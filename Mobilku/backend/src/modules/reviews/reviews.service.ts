import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createReviewDto: CreateReviewDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: createReviewDto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has purchased this product
    const hasPurchased = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            productId: createReviewDto.productId,
          },
        },
      },
    });

    if (!hasPurchased) {
      throw new ForbiddenException('You must purchase this product before reviewing');
    }

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: createReviewDto.productId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = await this.prisma.review.create({
      data: {
        ...createReviewDto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product rating average
    await this.updateProductRating(createReviewDto.productId);

    return review;
  }

  async findAll(productId?: number, page: number = 1, limit: number = 10) {
    const where: Prisma.ReviewWhereInput = {
      isActive: true,
    };

    if (productId) {
      where.productId = productId;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(id: number, userId: number, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product rating average if rating changed
    if (updateReviewDto.rating !== undefined) {
      await this.updateProductRating(review.productId);
    }

    return updatedReview;
  }

  async remove(id: number, userId: number, role: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Users can delete their own reviews, admins can delete any
    if (role !== 'ADMIN' && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Soft delete
    await this.prisma.review.update({
      where: { id },
      data: { isActive: false },
    });

    // Update product rating average
    await this.updateProductRating(review.productId);

    return { message: 'Review deleted successfully' };
  }

  async getProductReviews(productId: number) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const ratingStats = await this.prisma.review.aggregate({
      where: {
        productId,
        isActive: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      reviews,
      stats: {
        averageRating: ratingStats._avg.rating || 0,
        totalReviews: ratingStats._count.rating,
        ratingDistribution: await this.getRatingDistribution(productId),
      },
    };
  }

  private async updateProductRating(productId: number) {
    const ratingStats = await this.prisma.review.aggregate({
      where: {
        productId,
        isActive: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // You might want to store this in a product field for faster queries
    // For now, we'll just return it
    return {
      averageRating: ratingStats._avg.rating || 0,
      totalReviews: ratingStats._count.rating,
    };
  }

  private async getRatingDistribution(productId: number) {
    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        isActive: true,
      },
      _count: {
        rating: true,
      },
    });

    // Format to include all ratings 1-5
    const result = {};
    for (let i = 1; i <= 5; i++) {
      result[i] = 0;
    }

    distribution.forEach(item => {
      result[item.rating] = item._count.rating;
    });

    return result;
  }

  async getUserReviews(userId: number, page: number = 1, limit: number = 10) {
    const where: Prisma.ReviewWhereInput = {
      userId,
      isActive: true,
    };

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

