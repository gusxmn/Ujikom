import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, RegisterDto, RegisterAdminDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
    
    return {
      message: 'Registration successful',
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
    
    return {
      message: 'Admin registration successful',
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
}