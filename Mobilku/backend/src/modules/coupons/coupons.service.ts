import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto';
import { Prisma, DiscountType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    // Check if coupon code already exists
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code: createCouponDto.code },
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists');
    }

    // Validate dates
    if (createCouponDto.startDate >= createCouponDto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        ...createCouponDto,
        startDate: new Date(createCouponDto.startDate),
        endDate: new Date(createCouponDto.endDate),
      },
    });

    return coupon;
  }

  async findAll(isActive?: boolean, page: number = 1, limit: number = 10) {
    const where: Prisma.CouponWhereInput = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        include: {
          _count: {
            select: { orders: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      data: coupons,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // If updating code, check for conflicts
    if (updateCouponDto.code && updateCouponDto.code !== coupon.code) {
      const existingCoupon = await this.prisma.coupon.findUnique({
        where: { code: updateCouponDto.code },
      });

      if (existingCoupon) {
        throw new ConflictException('Coupon code already exists');
      }
    }

    // Validate dates if both are provided
    if (updateCouponDto.startDate && updateCouponDto.endDate) {
      if (new Date(updateCouponDto.startDate) >= new Date(updateCouponDto.endDate)) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...updateCouponDto,
        startDate: updateCouponDto.startDate ? new Date(updateCouponDto.startDate) : undefined,
        endDate: updateCouponDto.endDate ? new Date(updateCouponDto.endDate) : undefined,
      },
    });

    return updatedCoupon;
  }

  async remove(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Soft delete
    await this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Coupon deleted successfully' };
  }

  async validateCoupon(validateCouponDto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: validateCouponDto.code,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        OR: [
          { usageLimit: null },
          { usageLimit: { gt: this.prisma.coupon.fields.usedCount } },
        ],
      },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid or expired coupon');
    }

    // Check minimum purchase
    if (coupon.minPurchase && validateCouponDto.totalAmount < coupon.minPurchase.toNumber()) {
      throw new BadRequestException(`Minimum purchase of ${coupon.minPurchase} required`);
    }

    // Calculate discount
    let discount = 0;
    let discountAmount = 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = coupon.value.toNumber();
      discountAmount = (validateCouponDto.totalAmount * discount) / 100;
      
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount.toNumber()) {
        discountAmount = coupon.maxDiscount.toNumber();
      }
    } else {
      discountAmount = coupon.value.toNumber();
    }

    // Ensure discount doesn't exceed total amount
    if (discountAmount > validateCouponDto.totalAmount) {
      discountAmount = validateCouponDto.totalAmount;
    }

    const finalAmount = validateCouponDto.totalAmount - discountAmount;

    return {
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value.toNumber(),
        minPurchase: coupon.minPurchase?.toNumber(),
        maxDiscount: coupon.maxDiscount?.toNumber(),
      },
      discount: discountAmount,
      finalAmount,
      message: 'Coupon applied successfully',
    };
  }

  async getCouponStats() {
    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUsage,
      totalDiscountGiven,
    ] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({
        where: {
          isActive: true,
          endDate: { gte: new Date() },
        },
      }),
      this.prisma.coupon.count({
        where: {
          endDate: { lt: new Date() },
        },
      }),
      this.prisma.coupon.aggregate({
        _sum: { usedCount: true },
      }),
      this.getTotalDiscountGiven(),
    ]);

    return {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUsage: totalUsage._sum.usedCount || 0,
      totalDiscountGiven,
    };
  }

  private async getTotalDiscountGiven() {
    // This is a simplified calculation
    // In a real app, you might want to calculate from order history
    const coupons = await this.prisma.coupon.findMany({
      where: { isActive: true },
      select: {
        discountType: true,
        value: true,
        usedCount: true,
        maxDiscount: true,
      },
    });

    let total = new Prisma.Decimal(0);
    
    for (const coupon of coupons) {
      if (coupon.discountType === 'PERCENTAGE') {
        // This is an approximation
        const avgOrderValue = new Prisma.Decimal(1000000); // Assume average order value
        const discountPerUse = avgOrderValue.times(coupon.value).dividedBy(100);
        
        if (coupon.maxDiscount && discountPerUse.gt(coupon.maxDiscount)) {
          total = total.plus(coupon.maxDiscount.times(coupon.usedCount));
        } else {
          total = total.plus(discountPerUse.times(coupon.usedCount));
        }
      } else {
        total = total.plus(coupon.value.times(coupon.usedCount));
      }
    }

    return total;
  }
}