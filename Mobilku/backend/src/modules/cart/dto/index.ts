import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, description: 'New quantity' })
  @IsInt()
  @IsPositive()
  quantity: number;
}
