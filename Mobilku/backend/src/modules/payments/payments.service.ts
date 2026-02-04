import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      popularProducts,
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
        orderBy: { stock: 'asc' }, // Products with low stock first
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        customers: await this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        admins: await this.prisma.user.count({ where: { role: 'ADMIN' } }),
      },
      products: {
        total: totalProducts,
        lowStock: await this.prisma.product.count({ where: { stock: { lt: 5 } } }),
        outOfStock: await this.prisma.product.count({ where: { stock: 0 } }),
      },
      orders: {
        total: totalOrders,
        pending: await this.prisma.order.count({ where: { status: 'PENDING' } }),
        delivered: await this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || new Prisma.Decimal(0),
        today: await this.getTodayRevenue(),
        thisMonth: await this.getThisMonthRevenue(),
      },
      recentOrders,
      popularProducts,
    };
  }

  async getSalesChartData(range: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
        status: 'DELIVERED',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const salesByDate = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = new Prisma.Decimal(0);
      }
      acc[date] = acc[date].plus(order.totalAmount);
      return acc;
    }, {} as Record<string, Prisma.Decimal>);

    return {
      labels: Object.keys(salesByDate),
      data: Object.values(salesByDate).map(amount => amount.toNumber()),
    };
  }

  async getProductPerformance() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        orderItems: {
          select: {
            quantity: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price.toNumber(),
      stock: product.stock,
      totalSold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      totalOrders: product._count.orderItems,
      revenue: product.orderItems.reduce(
        (sum, item) => sum + product.price.times(item.quantity).toNumber(),
        0,
      ),
    }));
  }

  private async getTodayRevenue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'DELIVERED',
      },
      _sum: { totalAmount: true },
    });

    return result._sum.totalAmount || new Prisma.Decimal(0);
  }

  private async getThisMonthRevenue() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.prisma.order.aggregate({
      where: {
        createdAt: {
          gte: firstDay,
          lte: lastDay,
        },
        status: 'DELIVERED',
      },
      _sum: { totalAmount: true },
    });

    return result._sum.totalAmount || new Prisma.Decimal(0);
  }

  async createPayment(data: any) {
    // Create payment record
    return await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        amount: new Prisma.Decimal(data.amount),
        method: data.method || 'BANK_TRANSFER',
        status: 'PENDING',
      },
    });
  }
}