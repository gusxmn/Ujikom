import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('🏠 Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Welcome endpoint' })
  @ApiResponse({ status: 200, description: 'Welcome to Mobilku API' })
  welcome() {
    return {
      message: '🚗 Welcome to Mobilku - Online Shop Mobil API',
      version: '1.0.0',
      documentation: 'http://localhost:3000/api-docs',
      healthCheck: 'http://localhost:3000/health',
      features: [
        '🔐 Authentication & Authorization',
        '📦 Product Management',
        '🛒 Shopping Cart',
        '📋 Orders',
        '💳 Payments (Xendit)',
        '⭐ Reviews & Ratings',
        '❤️ Wishlist',
        '🎟️ Coupons',
        '📊 Admin Dashboard',
      ],
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Server is running' })
  health() {
    return { status: 'ok', message: 'Server is running' };
  }
}
