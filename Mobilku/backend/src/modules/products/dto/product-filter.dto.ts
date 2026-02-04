import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Transmission, FuelType } from '@prisma/client';

export class ProductFilterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  minYear?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  maxYear?: number;

  @ApiProperty({ enum: Transmission, required: false })
  @IsEnum(Transmission)
  @IsOptional()
  transmission?: Transmission;

  @ApiProperty({ enum: FuelType, required: false })
  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}