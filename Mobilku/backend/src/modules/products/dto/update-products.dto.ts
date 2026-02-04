import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-products.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}