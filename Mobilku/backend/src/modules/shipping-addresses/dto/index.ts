import { IsString, IsInt, IsBoolean, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShippingAddressDto {
  @ApiProperty({ example: 'Rumah', description: 'Label for address' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'John Doe', description: 'Recipient name' })
  @IsString()
  recipient: string;

  @ApiProperty({ example: '081234567890', description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 1', description: 'Street address' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Jakarta', description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'DKI Jakarta', description: 'Province' })
  @IsString()
  province: string;

  @ApiProperty({ example: '12345', description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: true, description: 'Is primary address', required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateShippingAddressDto {
  @ApiProperty({ example: 'Kantor', description: 'Label for address', required: false })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Recipient name', required: false })
  @IsOptional()
  @IsString()
  recipient?: string;

  @ApiProperty({ example: '081987654321', description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Jl. Ahmad Yani No. 2', description: 'Street address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Surabaya', description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Jawa Timur', description: 'Province', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: '60123', description: 'Postal code', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: false, description: 'Is primary address', required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
