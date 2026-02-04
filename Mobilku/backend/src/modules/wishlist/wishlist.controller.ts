import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('❤️ Wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWishlist(@Request() req) {
    return this.wishlistService.getOrCreateWishlist(req.user.sub);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wishlist summary' })
  @ApiResponse({ status: 200, description: 'Wishlist summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWishlistSummary(@Request() req) {
    return this.wishlistService.getWishlistSummary(req.user.sub);
  }

  @Get('check/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  @ApiResponse({ status: 200, description: 'Check completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async isInWishlist(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const isInWishlist = await this.wishlistService.isInWishlist(req.user.sub, productId);
    return { isInWishlist };
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiResponse({ status: 200, description: 'Product added to wishlist successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product already in wishlist' })
  async addToWishlist(@Request() req, @Body() addToWishlistDto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(req.user.sub, addToWishlistDto);
  }

  @Delete('remove/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiResponse({ status: 200, description: 'Product removed from wishlist successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found in wishlist' })
  async removeFromWishlist(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.removeFromWishlist(req.user.sub, productId);
  }

  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wishlist not found' })
  async clearWishlist(@Request() req) {
    return this.wishlistService.clearWishlist(req.user.sub);
  }
}