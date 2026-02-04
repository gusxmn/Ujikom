import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto, CreateUserDto, UpdateUserStatusDto } from './dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, requestingUserRole: string) {
    // Only admin can create users
    if (requestingUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only admin can create users');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: string,
    isActive?: boolean,
    search?: string,
  ) {
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, requestingUserId: number, requestingUserRole: string) {
    // Users can view their own profile, admins can view any profile
    if (requestingUserRole !== 'ADMIN' && requestingUserId !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: true,
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, requestingUserId: number, requestingUserRole: string) {
    // Users can update their own profile, admins can update any profile
    if (requestingUserRole !== 'ADMIN' && requestingUserId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Only admin can change role
    if (updateUserDto.role && requestingUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only admin can change user role');
    }

    // Admin cannot change their own role to non-admin
    if (updateUserDto.role && requestingUserId === id && updateUserDto.role !== 'ADMIN') {
      throw new BadRequestException('Cannot change your own role from ADMIN');
    }

    // Only admin can change isActive status
    if (updateUserDto.isActive !== undefined && requestingUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only admin can change user status');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  async updateStatus(id: number, updateUserStatusDto: UpdateUserStatusDto, requestingUserId: number, requestingUserRole: string) {
    // Only admin can update user status
    if (requestingUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only admin can update user status');
    }

    // Admin cannot deactivate themselves
    if (requestingUserId === id && !updateUserStatusDto.isActive) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: updateUserStatusDto.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  async updatePassword(id: number, newPassword: string, requestingUserId: number, requestingUserRole: string) {
    // Users can update their own password, admins can update any password
    if (requestingUserRole !== 'ADMIN' && requestingUserId !== id) {
      throw new ForbiddenException('You can only update your own password');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async remove(id: number, requestingUserId: number, requestingUserRole: string) {
    // Only admin can delete users
    if (requestingUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only admin can delete users');
    }

    // Admin cannot delete themselves
    if (requestingUserId === id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has any active orders
    const activeOrders = await this.prisma.order.findFirst({
      where: {
        userId: id,
        status: {
          in: ['PENDING', 'PROCESSING', 'SHIPPED'],
        },
      },
    });

    if (activeOrders) {
      throw new BadRequestException('Cannot delete user with active orders');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }

  async updateAvatar(id: number, avatarUrl: string, requestingUserId: number, requestingUserRole: string) {
    // Users can update their own avatar, admins can update any avatar
    if (requestingUserRole !== 'ADMIN' && requestingUserId !== id) {
      throw new ForbiddenException('You can only update your own avatar');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      customerUsers,
      newUsersThisMonth,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      customerUsers,
      newUsersThisMonth,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      userGrowth: await this.getUserGrowth(),
    };
  }

  private async getUserGrowth() {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        role: true,
      },
    });

    // Group by month and role
    const growth = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      growth[monthKey] = {
        total: 0,
        admin: 0,
        customer: 0,
      };
    }

    users.forEach(user => {
      const monthKey = `${user.createdAt.getFullYear()}-${(user.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (growth[monthKey]) {
        growth[monthKey].total += 1;
        if (user.role === 'ADMIN') {
          growth[monthKey].admin += 1;
        } else {
          growth[monthKey].customer += 1;
        }
      }
    });

    return growth;
  }
}