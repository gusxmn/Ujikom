import { Controller, Post, Body, Headers, BadRequestException, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { XenditService } from '../payments/xendit.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { WebsocketGateway } from '../../config/websocket.gateway';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private xenditService: XenditService,
    private paymentsService: PaymentsService,
    private notificationsService: NotificationsService,
    private websocketGateway: WebsocketGateway,
    private prisma: PrismaService,
  ) {}

  /**
   * Xendit Invoice Callback Webhook
   * Triggered when payment status changes
   */
  @Post('xendit/invoice')
  async handleXenditInvoiceCallback(
    @Body() body: any,
    @Headers('x-callback-token') callbackToken: string,
    @Res() res: Response,
  ) {
    try {
      console.log('🔔 [Webhook] Xendit invoice callback received:', body);

      // Verify callback token (add to env)
      const expectedToken = process.env.XENDIT_CALLBACK_TOKEN;
      if (callbackToken !== expectedToken) {
        console.warn('⚠️ [Webhook] Invalid callback token');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id, external_id, status, amount, paid_at, payer_email } = body;

      // Update payment status in database
      await this.paymentsService.updatePaymentByXenditId(id, {
        status: this.mapXenditStatusToPaymentStatus(status),
        paidAt: paid_at ? new Date(paid_at) : null,
        metadata: body,
      });

      // Get payment and order details
      const payment = await this.prisma.payment.findUnique({
        where: { xenditId: id },
        include: {
          order: {
            include: { user: true },
          },
        },
      });

      if (!payment || !payment.order) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const { order } = payment;
      const userId = order.userId;

      // Handle different payment statuses
      if (status === 'PAID') {
        console.log('✅ [Webhook] Payment marked as PAID');

        // Update order status to processing
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'PROCESSING' },
        });

        // Send success notification
        await this.notificationsService.notifyPaymentSuccess(
          userId,
          order.id,
          order.orderNumber,
        );

        // Send real-time update
        this.websocketGateway.sendPaymentUpdate(userId, {
          paymentId: payment.id,
          status: 'SUCCESS',
          amount,
          orderNumber: order.orderNumber,
        });

        this.websocketGateway.sendOrderUpdate(userId, {
          orderId: order.id,
          status: 'PROCESSING',
          message: 'Pembayaran berhasil, pesanan sedang dipersiapkan',
        });
      } else if (status === 'EXPIRED') {
        console.log('⏰ [Webhook] Payment marked as EXPIRED');

        await this.notificationsService.createNotification(
          userId,
          NotificationType.PAYMENT_EXPIRED,
          '⏰ Pembayaran Kadaluarsa',
          `Invoice untuk pesanan #${order.orderNumber} telah kadaluarsa. Silakan buat pesanan baru.`,
          { orderId: order.id, orderNumber: order.orderNumber },
        );

        this.websocketGateway.sendPaymentUpdate(userId, {
          paymentId: payment.id,
          status: 'EXPIRED',
          orderNumber: order.orderNumber,
        });
      } else if (status === 'PENDING') {
        console.log('⏳ [Webhook] Payment still PENDING');
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ [Webhook] Error handling Xendit callback:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Map Xendit payment status to our PaymentStatus enum
   */
  private mapXenditStatusToPaymentStatus(xenditStatus: string): string {
    const statusMap: Record<string, string> = {
      PAID: 'COMPLETED',
      PENDING: 'PENDING',
      EXPIRED: 'FAILED',
      FAILED: 'FAILED',
    };
    return statusMap[xenditStatus] || 'PENDING';
  }

  /**
   * Health check endpoint for webhook testing
   */
  @Post('health')
  async healthCheck() {
    return { success: true, timestamp: new Date().toISOString() };
  }
}
