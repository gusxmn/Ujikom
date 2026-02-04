import { IsInt, IsString, Min, Max, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 5, description: 'Rating from 1-5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great product!', description: 'Review comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateReviewDto {
  @ApiProperty({ example: 4, description: 'Updated rating', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'Good product', description: 'Updated comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
