import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      popularProducts,
      userStats,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.product.findMany({
        where: { isActive: true },
        take: 10,
        orderBy: { stock: 'asc' },
      }),
      this.getUserStats(),
    ]);

    return {
      overview: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        revenue: totalRevenue._sum.totalAmount || new Prisma.Decimal(0),
      },
      userStats,
      recentOrders,
      popularProducts,
      salesData: await this.getSalesData(),
    };
  }

  async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      newUsersToday,
      newUsersThisWeek,
      adminUsers,
      customerUsers,
      userGrowthRate: await this.calculateUserGrowthRate(),
    };
  }

  private async calculateUserGrowthRate() {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [currentMonthUsers, lastMonthUsers] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
    ]);

    if (lastMonthUsers === 0) {
      return currentMonthUsers > 0 ? 100 : 0;
    }

    return ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
  }

  private async getSalesData() {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
        status: 'DELIVERED',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const salesByMonth = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      salesByMonth[monthKey] = new Prisma.Decimal(0);
    }

    orders.forEach(order => {
      const monthKey = `${order.createdAt.getFullYear()}-${(order.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (salesByMonth[monthKey]) {
        salesByMonth[monthKey] = salesByMonth[monthKey].plus(order.totalAmount);
      }
    });

    return {
      labels: Object.keys(salesByMonth),
      data: Object.values(salesByMonth).map(amount => typeof amount === 'object' && amount !== null && 'toNumber' in amount ? (amount as any).toNumber() : amount),
    };
  }

  // ... existing methods ...
}