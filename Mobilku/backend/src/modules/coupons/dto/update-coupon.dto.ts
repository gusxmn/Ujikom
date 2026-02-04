import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}