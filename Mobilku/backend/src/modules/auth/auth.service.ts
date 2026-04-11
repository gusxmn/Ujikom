import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, RegisterDto, RegisterAdminDto } from './dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email, isActive: true },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const token = this.jwtService.sign(payload);
    
    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        phone: registerDto.phone,
        address: registerDto.address,
      },
    });

    const { password, ...result } = user;
    
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const token = this.jwtService.sign(payload);
    
    return {
      access_token: token,
      user: result,
    };
  }

  async registerAdmin(registerAdminDto: RegisterAdminDto) {
    const adminSecret = this.configService.get<string>('ADMIN_SECRET') || 'ADMIN_SECRET_123';
    
    if (registerAdminDto.adminSecret !== adminSecret) {
      throw new UnauthorizedException('Invalid admin secret');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerAdminDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: registerAdminDto.name,
        email: registerAdminDto.email,
        password: hashedPassword,
        phone: registerAdminDto.phone,
        address: registerAdminDto.address,
        role: 'ADMIN',
      },
    });

    const { password, ...result } = user;
    
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const token = this.jwtService.sign(payload);
    
    return {
      access_token: token,
      user: result,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success anyway for security (don't reveal if email exists)
      return { 
        message: 'If an account exists with this email, a password reset link has been sent' 
      };
    }

    // Generate reset token with 1 hour expiration
    const resetToken = this.jwtService.sign(
      { email, purpose: 'password-reset' },
      { expiresIn: '1h' }
    );

    try {
      // Send email with reset link
      const result = await this.mailService.sendPasswordResetEmail(email, resetToken);
      
      // For development/testing only - return preview URL
      const response: any = { 
        message: 'If an account exists with this email, a password reset link has been sent' 
      };
      
      if (result?.url && process.env.NODE_ENV !== 'production') {
        response.previewUrl = result.url;
        response.testResetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
      }
      
      return response;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      // Still return success message for security
      return { 
        message: 'If an account exists with this email, a password reset link has been sent' 
      };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token
      const decoded = this.jwtService.verify(token);
      
      if (decoded.purpose !== 'password-reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      const user = await this.prisma.user.findUnique({
        where: { email: decoded.email },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { message: 'Password reset successful' };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Reset token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid reset token');
      }
      throw error;
    }
  }
}