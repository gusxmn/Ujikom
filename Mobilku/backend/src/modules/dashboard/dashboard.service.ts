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

  async getAdminDashboardStats(range: string = 'week') {
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();

    // Determine date range
    switch (range) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousStartDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(1);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        previousStartDate.setDate(1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear(), 0, 1);
        previousStartDate.setFullYear(now.getFullYear() - 1, 0, 1);
        break;
      case 'week':
      default:
        const day = now.getDay();
        const diff = now.getDate() - day;
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
    }

    // Get previous period end date
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    const [
      totalRevenue,
      previousRevenue,
      totalOrders,
      previousOrders,
      totalCustomers,
      previousCustomers,
      chartData,
      categoryData,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { 
          status: 'DELIVERED',
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { 
          status: 'DELIVERED',
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startDate } }
      }),
      this.prisma.order.count({
        where: { 
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      }),
      this.prisma.user.count({
        where: { 
          role: 'CUSTOMER',
          createdAt: { gte: startDate }
        }
      }),
      this.prisma.user.count({
        where: { 
          role: 'CUSTOMER',
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      }),
      this.getDashboardChartData(range),
      this.getCategoryDistribution(),
    ]);

    const currentRevenue = totalRevenue._sum.totalAmount ? Number(totalRevenue._sum.totalAmount) : 0;
    const prevRevenue = previousRevenue._sum.totalAmount ? Number(previousRevenue._sum.totalAmount) : 0;
    const avgOrderValue = totalOrders > 0 ? currentRevenue / totalOrders : 0;
    const prevAvgOrderValue = previousOrders > 0 ? prevRevenue / previousOrders : 0;

    const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 100;
    const orderGrowth = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 100;
    const customerGrowth = previousCustomers > 0 ? ((totalCustomers - previousCustomers) / previousCustomers) * 100 : 100;
    const aovGrowth = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 100;

    return {
      totalRevenue: currentRevenue,
      totalOrders,
      totalCustomers,
      averageOrderValue: avgOrderValue,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      orderGrowth: Math.round(orderGrowth * 100) / 100,
      customerGrowth: Math.round(customerGrowth * 100) / 100,
      aovGrowth: Math.round(aovGrowth * 100) / 100,
      salesData: chartData.salesData,
      orderData: chartData.orderData,
      customerData: chartData.customerData,
      categoryDistribution: categoryData,
    };
  }

  private async getDashboardChartData(range: string) {
    const now = new Date();
    let startDate = new Date();
    let periods = 7; // default for week
    let groupBy = 'day';

    switch (range) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        periods = 24;
        groupBy = 'hour';
        break;
      case 'month':
        startDate.setDate(1);
        periods = 30;
        groupBy = 'day';
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear(), 0, 1);
        periods = 12;
        groupBy = 'month';
        break;
      case 'week':
      default:
        const day = now.getDay();
        const diff = now.getDate() - day;
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        totalAmount: true,
        userId: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    // Initialize data structure
    const dataMap = new Map();
    for (let i = 0; i < periods; i++) {
      const date = new Date(startDate);
      if (groupBy === 'hour') {
        date.setHours(date.getHours() + i);
      } else if (groupBy === 'day') {
        date.setDate(date.getDate() + i);
      } else if (groupBy === 'month') {
        date.setMonth(date.getMonth() + i);
      } else {
        date.setDate(date.getDate() + i);
      }

      const key = this.formatDateKey(date, groupBy);
      dataMap.set(key, { date: key, amount: 0, count: 0, customers: new Set() });
    }

    // Process orders
    orders.forEach(order => {
      const key = this.formatDateKey(order.createdAt, groupBy);
      if (dataMap.has(key)) {
        const data = dataMap.get(key);
        data.amount += Number(order.totalAmount);
        data.count += 1;
        data.customers.add(order.userId);
      }
    });

    // Convert to array and format
    const salesData = Array.from(dataMap.values()).map(item => ({
      date: item.date,
      amount: Math.round(item.amount * 100) / 100,
    }));

    const orderData = Array.from(dataMap.values()).map(item => ({
      date: item.date,
      count: item.count,
    }));

    const customerData = Array.from(dataMap.values()).map(item => ({
      date: item.date,
      customers: item.customers.size,
    }));

    return { salesData, orderData, customerData };
  }

  private formatDateKey(date: Date, groupBy: string): string {
    if (groupBy === 'hour') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    } else if (groupBy === 'day') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else if (groupBy === 'month') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    return date.toISOString().split('T')[0];
  }

  private async getCategoryDistribution() {
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      take: 5,
    });

    // Sort by product count manually
    const sorted = categories.sort((a, b) => b._count.products - a._count.products);

    return sorted.map(cat => ({
      name: cat.name,
      value: cat._count.products,
    }));
  }

  async getRecentActivities() {
    const orders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const reviews = await this.prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
    });

    const activities = [];

    orders.forEach((order) => {
      activities.push({
        id: order.id,
        type: 'ORDER',
        title: `New Order #${order.id}`,
        description: `${order.user.name} placed an order`,
        createdAt: order.createdAt,
        metadata: { orderId: order.id, userId: order.userId },
      });
    });

    reviews.forEach((review) => {
      activities.push({
        id: review.id,
        type: 'REVIEW',
        title: `New Review on ${review.product.name}`,
        description: `${review.user.name} left a ${review.rating}-star review`,
        createdAt: review.createdAt,
        metadata: { reviewId: review.id, productId: review.productId },
      });
    });

    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
  }

  async getLowStockProducts(threshold: number = 10) {
    return this.prisma.product.findMany({
      where: {
        stock: { lte: threshold },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        images: true,
      },
      orderBy: { stock: 'asc' },
      take: 10,
    });
  }

  async getRecentOrders(limit: number = 10) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });
  }
}