import { IsArray, ValidateNested, IsString, IsOptional, IsNumber, Min, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsOptional()
  items?: OrderItemDto[];

  @ApiProperty({ example: 'Jl. Contoh No. 123, Jakarta' })
  @IsString()
  shippingAddress: string;

  @ApiProperty({ example: 500000, description: 'Total amount' })
  @IsNumber()
  @Min(1)
  totalAmount: number;

  @ApiProperty({ example: 'Mohon dikirim sebelum jam 5 sore' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'DISKON10', required: false })
  @IsString()
  @IsOptional()
  couponCode?: string;

  // Internal field
  couponId?: number;
}