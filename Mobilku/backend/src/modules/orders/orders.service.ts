import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { Prisma } from '@prisma/client';

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
        shippingAddress: createOrderDto.shippingAddress,
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

    return order;
  }

  async createFromCart(userId: number, createOrderDto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Create order from cart
    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        totalAmount: createOrderDto.totalAmount,
        shippingAddress: createOrderDto.shippingAddress,
        notes: createOrderDto.notes,
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
      },
    });

    // Clear cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  }

  async findAll(userId: number, role: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = role === 'ADMIN' ? {} : { userId };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
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

    const cancelStatuses = ['PENDING', 'PROCESSING'];
    if (!cancelStatuses.includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled in this status');
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

  async getOrderStats() {
    return await this.prisma.order.aggregate({
      _count: true,
      _sum: { totalAmount: true },
    });
  }
}
