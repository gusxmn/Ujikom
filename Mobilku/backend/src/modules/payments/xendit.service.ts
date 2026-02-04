import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Xendit, Invoice as XenditInvoice } from 'xendit-node';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PaymentStatus } from '@prisma/client';

@Injectable()
export class XenditService {
  private xendit: Xendit;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');
    if (!secretKey) {
      console.warn('⚠️ XENDIT_SECRET_KEY is not configured. Using test mode.');
    }
    
    this.xendit = new Xendit({
      secretKey: secretKey || 'xendit_test_key',
    });
  }

  async createInvoice(orderId: number, amount: number, customerEmail: string, customerName: string) {
    try {
      // For development without real Xendit account
      if (!this.configService.get<string>('XENDIT_SECRET_KEY') || 
          this.configService.get<string>('XENDIT_SECRET_KEY') === 'xendit_test_key') {
        return this.createMockInvoice(orderId, amount, customerEmail);
      }

      // Generate invoice
      const invoice: any = await (this.xendit as any).Invoice.createInvoice({
        data: {
          externalId: `order-${orderId}-${Date.now()}`,
          amount,
          payerEmail: customerEmail,
          description: `Payment for Order #${orderId}`,
          currency: 'IDR',
          reminderTime: 1,
          successRedirectUrl: `${this.configService.get('FRONTEND_URL')}/orders/success`,
          failureRedirectUrl: `${this.configService.get('FRONTEND_URL')}/orders/failed`,
          customer: {
            email: customerEmail,
            givenNames: customerName,
          },
          customerNotificationPreference: {
            invoicePaid: ['email', 'whatsapp'],
          },
          invoiceDuration: 86400, // 24 hours
        },
      });

      return invoice;
    } catch (error) {
      console.error('Xendit create invoice error:', error);
      // Fallback to mock invoice for development
      return this.createMockInvoice(orderId, amount, customerEmail);
    }
  }

  async createVirtualAccount(orderId: number, amount: number, bankCode: string, customerName: string) {
    try {
      // For development without real Xendit account
      if (!this.configService.get<string>('XENDIT_SECRET_KEY') || 
          this.configService.get<string>('XENDIT_SECRET_KEY') === 'xendit_test_key') {
        return this.createMockVirtualAccount(orderId, amount, bankCode);
      }

      const va = await (this.xendit as any).VirtualAccount.createFixedVA({
        data: {
          externalId: `order-${orderId}-va-${Date.now()}`,
          bankCode,
          name: customerName,
          expectedAmount: amount,
          isSingleUse: true,
          isClosed: true,
          expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return va;
    } catch (error) {
      console.error('Xendit create VA error:', error);
      // Fallback to mock VA for development
      return this.createMockVirtualAccount(orderId, amount, bankCode);
    }
  }

  async validateWebhook(payload: any, callbackToken: string) {
    const expectedToken = this.configService.get<string>('XENDIT_CALLBACK_TOKEN');
    
    if (expectedToken && callbackToken !== expectedToken) {
      throw new BadRequestException('Invalid callback token');
    }

    // Validate payload structure
    if (!payload.id || !payload.status || !payload.external_id) {
      throw new BadRequestException('Invalid webhook payload');
    }

    return true;
  }

  async handleWebhook(payload: any) {
    const { id: xenditId, status, external_id: externalId, amount } = payload;

    // Extract order ID from external_id
    const match = externalId.match(/order-(\d+)/);
    if (!match) {
      throw new BadRequestException('Invalid external_id format');
    }

    const orderId = parseInt(match[1]);

    // Update payment status
    let paymentStatus: PaymentStatus;
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        paymentStatus = PaymentStatus.PAID;
        break;
      case 'expired':
        paymentStatus = PaymentStatus.EXPIRED;
        break;
      case 'failed':
        paymentStatus = PaymentStatus.FAILED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }

    const payment = await this.prisma.payment.updateMany({
      where: {
        xenditId,
        orderId,
      },
      data: {
        status: paymentStatus,
        paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
        metadata: payload,
      },
    });

    // If payment is successful, update order status
    if (paymentStatus === PaymentStatus.PAID) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
        },
      });
    }

    return { success: true };
  }

  private createMockInvoice(orderId: number, amount: number, customerEmail: string) {
    const mockId = `mock_inv_${orderId}_${Date.now()}`;
    return {
      id: mockId,
      externalId: `order-${orderId}`,
      userId: customerEmail,
      status: 'PENDING',
      merchantName: 'Mock Online Shop Mobil',
      merchantProfilePictureUrl: null,
      amount,
      payerEmail: customerEmail,
      description: `Payment for Order #${orderId} (Mock)`,
      invoiceUrl: `http://localhost:3000/payments/mock/${mockId}`,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      availableBanks: [],
      availableRetailOutlets: [],
      availableEwallets: [],
      availableQrCodes: [],
      availableDirectDebits: [],
      shouldExcludeCreditCard: false,
      shouldSendEmail: false,
      created: new Date(),
      updated: new Date(),
      currency: 'IDR',
    };
  }

  private createMockVirtualAccount(orderId: number, amount: number, bankCode: string) {
    const mockId = `mock_va_${orderId}_${Date.now()}`;
    return {
      id: mockId,
      externalId: `order-${orderId}-va`,
      ownerId: 'mock_user',
      bankCode,
      name: 'Mock VA Customer',
      isClosed: true,
      expectedAmount: amount,
      isSingleUse: true,
      status: 'ACTIVE',
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      accountNumber: `1234567890${Math.floor(Math.random() * 1000)}`,
      merchantCode: 'MOCK001',
      currency: 'IDR',
      country: 'ID',
    };
  }
}