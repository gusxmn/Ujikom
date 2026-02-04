import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'DISKON10' })
  @IsString()
  code: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  totalAmount: number;
}