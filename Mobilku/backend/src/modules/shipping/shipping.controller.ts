import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';

@ApiTags('🚚 Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('methods')
  @ApiOperation({ summary: 'Get all active shipping methods' })
  @ApiResponse({ status: 200, description: 'Shipping methods retrieved successfully' })
  async getShippingMethods() {
    const methods = await this.shippingService.getShippingMethods();
    return methods;
  }

  @Get('methods/:id')
  @ApiOperation({ summary: 'Get shipping method details' })
  @ApiResponse({ status: 200, description: 'Shipping method retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Shipping method not found' })
  async getShippingMethod(@Param('id', ParseIntPipe) id: number) {
    const method = await this.shippingService.getShippingMethod(id);
    return method;
  }
}
