import { IsString, IsNumber, IsArray, IsEnum, IsOptional, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Transmission, FuelType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Toyota Avanza' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Mobil keluarga dengan 7 seat' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 250000000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 2023 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  year: number;

  @ApiProperty({ enum: Transmission, example: Transmission.AUTOMATIC })
  @IsEnum(Transmission)
  transmission: Transmission;

  @ApiProperty({ enum: FuelType, example: FuelType.GASOLINE })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ example: 10000 })
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: 'Hitam' })
  @IsString()
  color: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  categoryId: number;

  @ApiProperty({ type: [String], example: ['image1.jpg', 'image2.jpg'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}