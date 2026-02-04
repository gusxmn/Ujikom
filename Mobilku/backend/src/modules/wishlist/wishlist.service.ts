import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddToWishlistDto } from './dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateWishlist(userId: number) {
    let wishlist = await this.prisma.wishlist.findUnique({
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

    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({
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

    return wishlist;
  }

  async addToWishlist(userId: number, addToWishlistDto: AddToWishlistDto) {
    // Get or create wishlist
    const wishlist = await this.getOrCreateWishlist(userId);

    // Check if product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: addToWishlistDto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if item already in wishlist
    const existingItem = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: addToWishlistDto.productId,
        },
      },
    });

    if (existingItem) {
      throw new ConflictException('Product already in wishlist');
    }

    // Add to wishlist
    const wishlistItem = await this.prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: addToWishlistDto.productId,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return wishlistItem;
  }

  async removeFromWishlist(userId: number, productId: number) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    const wishlistItem = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.prisma.wishlistItem.delete({
      where: { id: wishlistItem.id },
    });

    return { message: 'Product removed from wishlist' };
  }

  async clearWishlist(userId: number) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id },
    });

    return { message: 'Wishlist cleared' };
  }

  async isInWishlist(userId: number, productId: number) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return false;
    }

    const wishlistItem = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    return !!wishlistItem;
  }

  async getWishlistSummary(userId: number) {
    const wishlist = await this.getOrCreateWishlist(userId);

    return {
      wishlistId: wishlist.id,
      totalItems: wishlist.items.length,
      items: wishlist.items,
      updatedAt: wishlist.updatedAt,
    };
  }
}

