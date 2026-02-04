import { IsString, IsNumber, IsEnum, IsOptional, IsDate, Min, MinDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCouponDto {
  @ApiProperty({ example: 'DISKON10' })
  @IsString()
  code: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: 100000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ example: '2026-02-28' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-03-31' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;
}

export class UpdateCouponDto {
  @ApiProperty({ example: 'DISKON15', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 15, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiProperty({ example: 150000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @ApiProperty({ example: 75000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ example: '2026-03-01', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ example: '2026-04-30', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'DISKON10' })
  @IsString()
  code: string;

  @ApiProperty({ example: 500000, description: 'Order total amount' })
  @IsNumber()
  @Min(1)
  totalAmount: number;
}
