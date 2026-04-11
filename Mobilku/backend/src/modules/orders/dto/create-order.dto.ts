import { IsArray, ValidateNested, IsString, IsOptional, IsNumber, Min, IsDecimal, IsObject } from 'class-validator';
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

export class ShippingAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'Jl. Contoh No. 123' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'DKI Jakarta' })
  @IsString()
  province: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 'Indonesia' })
  @IsString()
  country: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsOptional()
  items?: OrderItemDto[];

  @ApiProperty({ example: 1, description: 'Shipping Address ID' })
  @IsNumber()
  addressId: number;

  @ApiProperty({ type: ShippingAddressDto, required: false })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shippingAddress?: ShippingAddressDto;

  @ApiProperty({ example: 500000, description: 'Total amount' })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({ example: 1, description: 'Shipping method ID' })
  @IsNumber()
  shippingMethodId: number;

  @ApiProperty({ example: 'bank_transfer', description: 'Payment method' })
  @IsString()
  paymentMethod: string;

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