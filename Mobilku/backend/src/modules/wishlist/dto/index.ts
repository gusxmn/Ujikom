import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWishlistDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  @IsPositive()
  productId: number;
}
