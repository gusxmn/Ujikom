import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PackageTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrackingByNumber(trackingNumber: string) {
    return this.prisma.packageTracking.findUnique({
      where: { trackingNumber: trackingNumber.toUpperCase() },
      include: {
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getTrackingByOrderId(orderId: number) {
    return this.prisma.packageTracking.findUnique({
      where: { orderId },
      include: {
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
        },
        order: {
          select: {
            id: true,
            userId: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getUserPackageTracking(userId: number) {
    return this.prisma.packageTracking.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5, // Last 5 events
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTrackingStatus(
    trackingId: number,
    status: string,
    location: string,
    description: string,
  ) {
    return this.prisma.packageTracking.update({
      where: { id: trackingId },
      data: {
        status: status as any,
        currentLocation: location,
        trackingHistory: {
          create: {
            status: status as any,
            location,
            description,
          },
        },
        updatedAt: new Date(),
      },
      include: {
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  async getAllTracking() {
    return this.prisma.packageTracking.findMany({
      include: {
        trackingHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
