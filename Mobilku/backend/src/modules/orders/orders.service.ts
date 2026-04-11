import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    // Check if all products exist and have sufficient stock
    for (const item of createOrderDto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId, isActive: true },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        totalAmount: createOrderDto.totalAmount,
        shippingAddress: createOrderDto.shippingAddress as any,
        notes: createOrderDto.notes,
        items: {
          create: createOrderDto.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: createOrderDto.totalAmount,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });

    // Create payment record
    console.log(`\n🔷 PAYMENT CREATION START for order ID: ${order.id}`);
    try {
      const paymentData: any = {
        orderId: order.id,
        userId,
        amount: Number(Number(createOrderDto.totalAmount).toFixed(2)),
        method: 'BANK_TRANSFER',
        status: 'PENDING',
      };
      
      console.log(`💳 Creating payment with data:`, JSON.stringify(paymentData, null, 2));
      
      const payment = await this.prisma.payment.create({
        data: paymentData,
      });
      
      console.log(`✅ Payment record created successfully!`, {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        status: payment.status,
      });
    } catch (paymentError: any) {
      console.error(`❌ PAYMENT CREATION FAILED for order ${order.id}`);
      console.error(`Error Message: ${paymentError.message}`);
      console.error(`Error Code: ${paymentError.code}`);
      console.error(`Error Details:`, paymentError);
      if (paymentError.meta) {
        console.error(`DB Meta:`, paymentError.meta);
      }
    }
    console.log(`🔷 PAYMENT CREATION END\n`);

    return order;
  }

  async createFromCart(userId: number, createOrderDto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Keranjang belum ada produk');
    }

    // Get shipping address by ID
    let shippingAddress: any = null;
    if (createOrderDto.addressId) {
      shippingAddress = await this.prisma.shippingAddress.findUnique({
        where: { id: createOrderDto.addressId, userId },
      });

      if (!shippingAddress) {
        throw new BadRequestException('Alamat pengiriman tidak ditemukan');
      }
    }

    // Get shipping method
    const shippingMethod = await (this.prisma as any).shippingMethod.findUnique({
      where: { id: createOrderDto.shippingMethodId },
    });

    if (!shippingMethod || !shippingMethod.isActive) {
      throw new BadRequestException('Metode pengiriman tidak tersedia');
    }

    // Calculate subtotal from cart items
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    console.log(`📊 Subtotal calculated: ${subtotal}`);

    // Handle coupon if provided
    let couponId: number | null = null;
    let couponCode: string | null = null;
    let discountAmount = 0;

    if (createOrderDto.couponCode) {
      console.log(`🔍 Searching for coupon: ${createOrderDto.couponCode}`);
      
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: createOrderDto.couponCode,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      });

      if (!coupon) {
        console.warn(`⚠️ Coupon not found: ${createOrderDto.couponCode}`);
        // Check if coupon exists but is inactive or outside date range
        const inactiveCoupon = await this.prisma.coupon.findFirst({
          where: { code: createOrderDto.couponCode },
        });
        
        if (inactiveCoupon) {
          if (!inactiveCoupon.isActive) {
            throw new BadRequestException('Kupon tidak aktif');
          }
          if (new Date() < inactiveCoupon.startDate) {
            throw new BadRequestException('Kupon belum berlaku');
          }
          if (new Date() > inactiveCoupon.endDate) {
            throw new BadRequestException('Kupon sudah kadaluarsa');
          }
        } else {
          throw new BadRequestException('Kupon tidak ditemukan');
        }
      }

      if (coupon) {
        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new BadRequestException('Kupon sudah mencapai batas penggunaan');
        }

        // Check minimum purchase
        if (coupon.minPurchase && subtotal < coupon.minPurchase.toNumber()) {
          throw new BadRequestException(
            `Minimum pembelian Rp ${coupon.minPurchase.toNumber().toLocaleString('id-ID')} diperlukan`,
          );
        }

        couponId = coupon.id;
        couponCode = coupon.code;

        // Calculate discount
        if (coupon.discountType === 'PERCENTAGE') {
          const discountPercent = coupon.value.toNumber();
          discountAmount = (subtotal * discountPercent) / 100;

          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount.toNumber()) {
            discountAmount = coupon.maxDiscount.toNumber();
          }
        } else {
          discountAmount = coupon.value.toNumber();
        }

        // Ensure discount doesn't exceed subtotal
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }

        console.log(`✅ Coupon detected in checkout: ${couponCode}`);
        console.log(`💰 Discount applied: ${discountAmount}`);
      }
    }

    // Calculate final amount (subtotal - discount + shipping)
    const shippingCost = Number(shippingMethod.cost);
    const finalAmount = subtotal - discountAmount + shippingCost;

    // Build shipping address object
    const shippingAddressData = {
      name: shippingAddress?.recipient || 'Unknown',
      phone: shippingAddress?.phone || '',
      email: '',
      street: shippingAddress?.address || '',
      city: shippingAddress?.city || '',
      province: shippingAddress?.province || '',
      zipCode: shippingAddress?.postalCode || '',
      country: 'Indonesia',
    };

    // Create order from cart
    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        totalAmount: new Decimal(finalAmount),
        shippingAddress: shippingAddressData as any,
        shippingMethod: shippingMethod.name,
        shippingCost: new Decimal(shippingCost),
        paymentMethod: createOrderDto.paymentMethod,
        notes: createOrderDto.notes,
        couponId: couponId || undefined,
        couponCode: couponCode || undefined,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
        coupon: true,
      },
    });

    // Update order with subtotal and discount
    const updatedOrder = (await this.prisma.order.update({
      where: { id: order.id },
      data: {
        subtotal: new Decimal(subtotal),
        discount: new Decimal(discountAmount),
      } as any,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
        coupon: true,
      },
    })) as any;

    // Clear cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Increment coupon usage count if coupon was used
    if (couponId) {
      await this.prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
      console.log(`📊 Coupon usage incremented for coupon ID: ${couponId}`);
    }

    // Create payment record for the order
    console.log(`\n🔷 PAYMENT CREATION START for order ID: ${updatedOrder.id}`);
    try {
      console.log(`📝 Order data:`, { 
        orderId: updatedOrder.id, 
        userId, 
        finalAmount, 
        subtotal,
        shippingCost,
        discountAmount,
        paymentMethod: createOrderDto.paymentMethod,
      });
      
      const paymentData: any = {
        orderId: updatedOrder.id,
        userId: userId,
        amount: Number(finalAmount.toFixed(2)),
        method: createOrderDto.paymentMethod.toUpperCase(),
        status: 'PENDING',
      };
      
      console.log(`💳 Creating payment with data:`, JSON.stringify(paymentData, null, 2));
      
      const payment = await this.prisma.payment.create({
        data: paymentData,
      });
      
      console.log(`✅ Payment record created successfully!`, {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        status: payment.status,
        amount: payment.amount.toString(),
      });
    } catch (paymentError: any) {
      console.error(`❌ PAYMENT CREATION FAILED for order ${updatedOrder.id}`);
      console.error(`Error Message: ${paymentError.message}`);
      console.error(`Error Code: ${paymentError.code}`);
      console.error(`Error Details:`, paymentError);
      if (paymentError.meta) {
        console.error(`DB Meta:`, paymentError.meta);
      }
      // Continue even if payment creation fails, order is still created
    }
    console.log(`🔷 PAYMENT CREATION END\n`);

    console.log(`📦 Order created: ${updatedOrder.orderNumber}`);
    console.log(`  Subtotal: ${updatedOrder.subtotal}`);
    console.log(`  Shipping: ${shippingCost}`);
    console.log(`  Discount: ${updatedOrder.discount}`);
    console.log(`  Final Total: ${updatedOrder.totalAmount}`);
    if (updatedOrder.couponCode) {
      console.log(`  Coupon: ${updatedOrder.couponCode}`);
    }

    return updatedOrder;
  }

  async findAll(userId: number, role: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = role === 'ADMIN' ? {} : { userId };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
        coupon: true,
        payments: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.order.count({ where });

    return {
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number, userId: number, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
        coupon: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permission
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async updateStatus(id: number, updateOrderStatusDto: UpdateOrderStatusDto, userId: number, role: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update order status');
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(updateOrderStatusDto.status)) {
      throw new BadRequestException('Invalid order status');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: updateOrderStatusDto.status },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
        payments: true,
      },
    });

    return updated;
  }

  async cancelOrder(id: number, userId: number, role: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    const orderStatus = String(order.status).toUpperCase();
    const cancelStatuses = ['PENDING', 'PROCESSING'];
    if (!cancelStatuses.includes(orderStatus)) {
      throw new BadRequestException(
        `Order cannot be cancelled. Current status: ${orderStatus}. Allowed statuses: ${cancelStatuses.join(', ')}`
      );
    }

    const cancelled = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
        payments: true,
      },
    });

    return cancelled;
  }

  async reorder(id: number, userId: number, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to reorder this order');
    }

    // Get or create cart for user
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    // Add items from the previous order to cart
    for (const orderItem of order.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: orderItem.productId },
      });

      if (!product || !product.isActive) {
        throw new BadRequestException(`Product ${orderItem.productId} is no longer available`);
      }

      if (product.stock < orderItem.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      // Check if item already exists in cart
      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: orderItem.productId,
          },
        },
      });

      if (existingItem) {
        // Update quantity
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + orderItem.quantity },
        });
      } else {
        // Create new cart item
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: orderItem.productId,
            quantity: orderItem.quantity,
          },
        });
      }
    }

    return {
      message: 'Items from previous order added to cart successfully',
      itemCount: order.items.length,
    };
  }

  async getOrderStats() {
    return await this.prisma.order.aggregate({
      _count: true,
      _sum: { totalAmount: true },
    });
  }

  async generateInvoice(id: number, userId: number, role: string): Promise<Readable> {
    const order = (await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
        coupon: true,
      },
    })) as any;

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permission
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    // Convert stream to readable stream
    const stream = doc as any;

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke();
    doc.moveDown(1);

    // Company info
    doc.fontSize(10).font('Helvetica');
    doc.text('Mobilku - Online Car Shop', { align: 'left' });
    doc.text('Website: mobilku.com', { align: 'left' });
    doc.text('Email: support@mobilku.com', { align: 'left' });
    doc.text('Phone: +62 812 3456 7890', { align: 'left' });
    doc.moveDown(1);

    // Invoice details
    doc.fontSize(11).font('Helvetica-Bold').text('Invoice Details', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice #: ${order.orderNumber}`, { align: 'left' });
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`, { align: 'left' });
    doc.text(`Order Status: ${order.status.toUpperCase()}`, { align: 'left' });
    doc.moveDown(1);

    // Customer info
    doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', { underline: true });
    doc.fontSize(10).font('Helvetica');
    const shippingAddr = order.shippingAddress as any;
    doc.text(`Name: ${order.user.name}`, { align: 'left' });
    doc.text(`Email: ${order.user.email}`, { align: 'left' });
    if (shippingAddr) {
      doc.text(`Address: ${shippingAddr.street}`, { align: 'left' });
      doc.text(`City: ${shippingAddr.city}, ${shippingAddr.province} ${shippingAddr.zipCode}`, { align: 'left' });
      doc.text(`Country: ${shippingAddr.country}`, { align: 'left' });
    }
    doc.moveDown(1);

    // Shipping info
    if ((order as any).shippingMethod) {
      doc.fontSize(11).font('Helvetica-Bold').text('Shipping Information:', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Method: ${(order as any).shippingMethod}`, { align: 'left' });
      if ((order as any).shippingCost) {
        doc.text(`Cost: Rp ${Number((order as any).shippingCost).toLocaleString('id-ID')}`, { align: 'left' });
      }
      doc.moveDown(1);
    }

    // Payment info
    if ((order as any).paymentMethod && typeof (order as any).paymentMethod === 'string') {
      doc.fontSize(11).font('Helvetica-Bold').text('Payment Information:', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Method: ${(order as any).paymentMethod.replace(/_/g, ' ').toUpperCase()}`, { align: 'left' });
      doc.moveDown(1);
    }

    // Items table
    doc.fontSize(11).font('Helvetica-Bold').text('Order Items', { underline: true });
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const leftMargin = 40;
    const itemWidth = 200;
    const qtyWidth = 80;
    const priceWidth = 80;
    const totalWidth = 80;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Product Name', leftMargin, tableTop);
    doc.text('Qty', leftMargin + itemWidth, tableTop);
    doc.text('Unit Price', leftMargin + itemWidth + qtyWidth, tableTop);
    doc.text('Total', leftMargin + itemWidth + qtyWidth + priceWidth, tableTop);

    doc.moveTo(leftMargin, tableTop + 15).lineTo(555, tableTop + 15).stroke();

    // Table rows
    let rowY = tableTop + 25;
    doc.fontSize(9).font('Helvetica');

    for (const item of order.items) {
      const itemTotal = Number(item.price) * item.quantity;
      doc.text(item.product.name.substring(0, 30), leftMargin, rowY);
      doc.text(item.quantity.toString(), leftMargin + itemWidth, rowY);
      doc.text(`Rp ${Number(item.price).toLocaleString('id-ID')}`, leftMargin + itemWidth + qtyWidth, rowY);
      doc.text(`Rp ${itemTotal.toLocaleString('id-ID')}`, leftMargin + itemWidth + qtyWidth + priceWidth, rowY);
      rowY += 20;
    }

    doc.moveTo(leftMargin, rowY - 5).lineTo(555, rowY - 5).stroke();
    rowY += 10;

    // Summary
    doc.fontSize(9).font('Helvetica');
    doc.text('Subtotal:', leftMargin + itemWidth + qtyWidth, rowY);
    doc.text(`Rp ${Number(order.subtotal).toLocaleString('id-ID')}`, leftMargin + itemWidth + qtyWidth + priceWidth, rowY);

    rowY += 15;
    if (order.discount && Number(order.discount) > 0) {
      doc.text('Discount:', leftMargin + itemWidth + qtyWidth, rowY);
      doc.text(`-Rp ${Number(order.discount).toLocaleString('id-ID')}`, leftMargin + itemWidth + qtyWidth + priceWidth, rowY);
      rowY += 15;
    }

    if ((order as any).shippingCost && Number((order as any).shippingCost) > 0) {
      doc.text('Shipping Cost:', leftMargin + itemWidth + qtyWidth, rowY);
      doc.text(`Rp ${Number((order as any).shippingCost).toLocaleString('id-ID')}`, leftMargin + itemWidth + qtyWidth + priceWidth, rowY);
      rowY += 15;
    }

    // Total
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('TOTAL:', leftMargin + itemWidth + qtyWidth, rowY);
    doc.text(`Rp ${Number(order.totalAmount).toLocaleString('id-ID')}`, leftMargin + itemWidth + qtyWidth + priceWidth, rowY);

    // Footer
    doc.moveDown(3);
    doc.fontSize(9).font('Helvetica');
    doc.text('Thank you for your purchase!', { align: 'center' });
    doc.text('Generated on ' + new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }), { align: 'center' });

    // End document
    doc.end();

    return stream;
  }
}
