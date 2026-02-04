import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'SUV' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Sport Utility Vehicle', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}