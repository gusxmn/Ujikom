import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WebsocketGateway } from '../../config/websocket.gateway';

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_EXPIRED = 'payment_expired',
  PROMOTION = 'promotion',
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Create and store notification in database
   */
  async createNotification(userId: number, type: NotificationType, title: string, description: string, data?: any) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          description,
          data: data || {},
          isRead: false,
        },
      });

      // Send real-time notification via WebSocket
      this.websocketGateway.sendNotification(userId, {
        id: notification.id,
        type,
        title,
        description,
        data,
        createdAt: notification.createdAt,
      });

      return notification;
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: number, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number) {
    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Send order creation notification
   */
  async notifyOrderCreated(userId: number, orderId: number, orderNumber: string, totalAmount: number) {
    return this.createNotification(
      userId,
      NotificationType.ORDER_CREATED,
      '✅ Pesanan Dibuat',
      `Pesanan #${orderNumber} telah dibuat dengan total Rp${totalAmount.toLocaleString('id-ID')}`,
      { orderId, orderNumber },
    );
  }

  /**
   * Send payment pending notification
   */
  async notifyPaymentPending(userId: number, orderId: number, invoiceUrl: string, expiresAt: Date) {
    const notification = await this.createNotification(
      userId,
      NotificationType.PAYMENT_PENDING,
      '💳 Pembayaran Ditunggu',
      'Silakan lakukan pembayaran untuk menyelesaikan pesanan Anda',
      { orderId, invoiceUrl, expiresAt },
    );

    // Send invoice link via WebSocket
    this.websocketGateway.sendPaymentInvoice(userId, {
      orderId,
      invoiceUrl,
      expiresAt,
    });

    return notification;
  }

  /**
   * Send payment success notification
   */
  async notifyPaymentSuccess(userId: number, orderId: number, orderNumber: string) {
    return this.createNotification(
      userId,
      NotificationType.PAYMENT_SUCCESS,
      '✅ Pembayaran Berhasil',
      `Pembayaran untuk pesanan #${orderNumber} telah berhasil. Pesanan sedang dipersiapkan.`,
      { orderId, orderNumber },
    );
  }

  /**
   * Send payment failed notification
   */
  async notifyPaymentFailed(userId: number, orderId: number, reason: string) {
    return this.createNotification(
      userId,
      NotificationType.PAYMENT_FAILED,
      '❌ Pembayaran Gagal',
      `Pembayaran gagal: ${reason}. Silakan coba lagi.`,
      { orderId, reason },
    );
  }

  /**
   * Send order shipped notification
   */
  async notifyOrderShipped(userId: number, orderId: number, orderNumber: string, trackingNumber?: string) {
    return this.createNotification(
      userId,
      NotificationType.ORDER_SHIPPED,
      '📦 Pesanan Dikirim',
      `Pesanan #${orderNumber} telah dikirim. ${trackingNumber ? `No. Resi: ${trackingNumber}` : ''}`,
      { orderId, orderNumber, trackingNumber },
    );
  }

  /**
   * Send order delivered notification
   */
  async notifyOrderDelivered(userId: number, orderId: number, orderNumber: string) {
    return this.createNotification(
      userId,
      NotificationType.ORDER_DELIVERED,
      '✅ Pesanan Tiba',
      `Pesanan #${orderNumber} telah tiba. Terima kasih telah berbelanja!`,
      { orderId, orderNumber },
    );
  }
}
