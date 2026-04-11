import { Controller, Post, Body, UseGuards, BadRequestException, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { XenditService } from './xendit.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly xenditService: XenditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create payment record
   */
  @Post('create')
  async createPayment(@Body() body: any) {
    return this.paymentsService.createPayment(body);
  }

  /**
   * Create invoice and generate payment link
   * POST /payments/create-invoice
   * Body: { orderId, amount, paymentId? }
   */
  @Post('create-invoice')
  async createInvoice(
    @Body() body: { 
      orderId: number; 
      amount: number; 
      paymentId?: number;
      paymentMethod?: string;
      paymentSubMethod?: string;
    },
    @GetUser() user: any,
  ) {
    try {
      const { orderId, amount, paymentId, paymentMethod = 'BANK_TRANSFER', paymentSubMethod } = body;

      console.log('💳 [Payment] Create invoice request:', {
        orderId,
        amount,
        paymentMethod,
        paymentSubMethod,
        userId: user?.id,
        userRole: user?.role,
      });

      if (!orderId || !amount) {
        console.error('❌ [Payment] Missing orderId or amount');
        throw new BadRequestException('orderId and amount are required');
      }

      // Verify order belongs to user or user is admin
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) {
        console.error(`❌ [Payment] Order not found - orderId: ${orderId}`);
        throw new BadRequestException(`Order not found with ID: ${orderId}`);
      }

      console.log(`✅ [Payment] Order found - orderId: ${orderId}, userId: ${order.userId}`);

      if (user.role !== 'ADMIN' && order.userId !== user.id) {
        console.error(`❌ [Payment] Unauthorized - Order belongs to userId ${order.userId}, but user ${user.id} (role: ${user.role}) tried to access`);
        throw new BadRequestException(`Unauthorized: Order does not belong to this user`);
      }

      // Get or create payment
      let payment = await this.paymentsService.getPaymentByOrderId(orderId);

      if (!payment) {
        console.log(`📝 [Payment] Auto-creating payment for orderId: ${orderId}`);
        // Auto-create payment if it doesn't exist with selected method
        payment = await this.paymentsService.createPayment({
          orderId,
          userId: user.id,
          amount,
          method: paymentMethod,
          metadata: paymentSubMethod ? { subMethod: paymentSubMethod } : undefined,
        });
        console.log(`✅ [Payment] Payment created - paymentId: ${payment.id}`);
      }

      // Create invoice and get payment link
      console.log(`🔗 [Payment] Creating Xendit invoice for paymentId: ${payment.id}`);
      const invoiceResult = await this.xenditService.createInvoiceForPayment(
        payment.id,
        orderId,
        amount,
        order.user.email,
        order.user.name,
      );

      console.log(`✅ [Payment] Invoice created successfully`);
      return invoiceResult;
    } catch (error) {
      console.error('❌ [Payment] Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get payment status by order ID
   * GET /payments/status/:orderId
   */
  @Public()
  @Get('status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    try {
      const orderIdInt = parseInt(orderId);
      if (isNaN(orderIdInt)) {
        console.error(`❌ Invalid order ID format: ${orderId}`);
        throw new BadRequestException('Invalid order ID');
      }

      console.log(`🔍 [Payment Status] Fetching payment for order ID: ${orderIdInt}`);
      
      const payment = await this.paymentsService.getPaymentByOrderId(orderIdInt);
      
      if (!payment) {
        console.warn(`⚠️ [Payment Status] Payment not found for order ID: ${orderIdInt}`);
        // Check if order exists
        const order = await this.prisma.order.findUnique({
          where: { id: orderIdInt },
          select: { id: true, orderNumber: true },
        });
        
        if (!order) {
          console.error(`❌ [Payment Status] Order not found - ID: ${orderIdInt}`);
          return {
            found: false,
            message: 'Order not found',
            orderId: orderIdInt,
          };
        }
        
        console.warn(`⚠️ [Payment Status] Order exists but payment not found - Order: ${order.orderNumber}`);
        return {
          found: false,
          message: 'Payment not found for this order',
          orderId: orderIdInt,
          orderNumber: order.orderNumber,
        };
      }

      console.log(`✅ [Payment Status] Payment found for order ID: ${orderIdInt}`, {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
      });

      return {
        found: true,
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount.toString(),
        status: payment.status,
        method: payment.method,
        xenditId: payment.xenditId,
        xenditInvoiceUrl: payment.xenditInvoiceUrl,
        metadata: payment.metadata,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };
    } catch (error) {
      console.error('❌ [Payment Status] Error getting payment status:', error);
      throw error;
    }
  }

  /**
   * Confirm payment for an order (simulate successful payment - for testing)
   * POST /payments/:orderId/confirm
   * No auth required for testing
   */
  @Public()
  @Post(':orderId/confirm')
  async confirmPayment(@Param('orderId') orderId: string) {
    try {
      const orderIdInt = parseInt(orderId);
      if (isNaN(orderIdInt)) {
        throw new BadRequestException('Invalid order ID');
      }

      console.log(`\n💰 [Payment Confirm] Confirming payment for order ID: ${orderIdInt}`);
      
      const result = await this.paymentsService.confirmPayment(orderIdInt);

      const payment = await this.paymentsService.getPaymentByOrderId(orderIdInt);

      console.log(`✅ [Payment Confirm] Payment confirmed successfully`);
      return {
        success: true,
        message: 'Payment confirmed',
        payment: {
          id: payment?.id,
          orderId: payment?.orderId,
          status: payment?.status,
          amount: payment?.amount.toString(),
          paidAt: payment?.paidAt,
        },
      };
    } catch (error: any) {
      console.error('❌ [Payment Confirm] Error confirming payment:', error.message);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update payment status (Admin only - for testing/admin functions)
   * PATCH /payments/:orderId/status
   * Body: { status: 'PAID' | 'EXPIRED' | 'FAILED' | 'PENDING' }
   */
  @Patch(':orderId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updatePaymentStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    try {
      const orderIdInt = parseInt(orderId);
      if (isNaN(orderIdInt)) {
        throw new BadRequestException('Invalid order ID');
      }

      const validStatuses = ['PENDING', 'PAID', 'EXPIRED', 'FAILED'];
      if (!validStatuses.includes(body.status)) {
        throw new BadRequestException(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        );
      }

      console.log(`\n📝 [Payment Update] Updating payment status for order ${orderIdInt} to ${body.status}`);
      
      const result = await this.paymentsService.updatePaymentStatusByOrderId(orderIdInt, body.status);

      const payment = await this.paymentsService.getPaymentByOrderId(orderIdInt);

      console.log(`✅ [Payment Update] Status updated successfully`);
      return {
        success: true,
        message: `Payment status updated to ${body.status}`,
        payment: {
          id: payment?.id,
          orderId: payment?.orderId,
          status: payment?.status,
          amount: payment?.amount.toString(),
          paidAt: payment?.paidAt,
        },
      };
    } catch (error: any) {
      console.error('❌ [Payment Update] Error updating payment status:', error.message);
      throw new BadRequestException(error.message);
    }
  }
}
