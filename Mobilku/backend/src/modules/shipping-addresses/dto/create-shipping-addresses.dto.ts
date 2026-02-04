import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShippingAddressDto {
  @ApiProperty({ example: 'Rumah' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  recipient: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Jl. Contoh No. 123' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Jakarta Selatan' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'DKI Jakarta' })
  @IsString()
  province: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}