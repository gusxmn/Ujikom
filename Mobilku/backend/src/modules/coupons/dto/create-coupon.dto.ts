import { IsString, IsEnum, IsNumber, Min, Max, IsDateString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'DISKON10' })
  @IsString()
  code: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: 100000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPurchase?: number;

  @ApiProperty({ example: 50000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31T23:59:59.999Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 100, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;
}