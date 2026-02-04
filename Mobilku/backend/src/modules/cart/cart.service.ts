import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: number) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: addToCartDto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check stock
    if (product.stock < addToCartDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Check if item already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: addToCartDto.productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const updatedItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + addToCartDto.quantity,
        },
        include: {
          product: true,
        },
      });

      return updatedItem;
    } else {
      // Add new item
      const newItem = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: addToCartDto.productId,
          quantity: addToCartDto.quantity,
        },
        include: {
          product: true,
        },
      });

      return newItem;
    }
  }

  async updateCartItem(userId: number, itemId: number, updateCartItemDto: UpdateCartItemDto) {
    // Verify user owns the cart item
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock if quantity is being increased
    if (updateCartItemDto.quantity > item.quantity) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      const quantityIncrease = updateCartItemDto.quantity - item.quantity;
      if (product.stock < quantityIncrease) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    const updatedItem = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: updateCartItemDto.quantity,
      },
      include: {
        product: true,
      },
    });

    return updatedItem;
  }

  async removeFromCart(userId: number, itemId: number) {
    // Verify user owns the cart item
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared' };
  }

  async getCartSummary(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    let totalItems = 0;
    let totalPrice = new Prisma.Decimal(0);

    for (const item of cart.items) {
      totalItems += item.quantity;
      totalPrice = totalPrice.plus(item.product.price.times(item.quantity));
    }

    return {
      cartId: cart.id,
      totalItems,
      totalPrice,
      items: cart.items,
      updatedAt: cart.updatedAt,
    };
  }
}
