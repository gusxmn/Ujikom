import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ShippingAddressesService } from './shipping-addresses.service';
import { CreateShippingAddressDto, UpdateShippingAddressDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('🏠 Shipping Addresses')
@Controller('shipping-addresses')
export class ShippingAddressesController {
  constructor(private readonly shippingAddressesService: ShippingAddressesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipping address' })
  @ApiResponse({ status: 201, description: 'Shipping address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createShippingAddressDto: CreateShippingAddressDto) {
    return this.shippingAddressesService.create(req.user.sub, createShippingAddressDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user shipping addresses' })
  @ApiResponse({ status: 200, description: 'Shipping addresses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req) {
    return this.shippingAddressesService.findAll(req.user.sub);
  }

  @Get('primary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get primary shipping address' })
  @ApiResponse({ status: 200, description: 'Primary address retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPrimaryAddress(@Request() req) {
    return this.shippingAddressesService.getPrimaryAddress(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shipping address by ID' })
  @ApiResponse({ status: 200, description: 'Shipping address retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your address' })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.shippingAddressesService.findOne(id, req.user.sub, req.user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shipping address' })
  @ApiResponse({ status: 200, description: 'Shipping address updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your address' })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShippingAddressDto: UpdateShippingAddressDto,
  ) {
    return this.shippingAddressesService.update(id, req.user.sub, req.user.role, updateShippingAddressDto);
  }

  @Patch(':id/set-primary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set shipping address as primary' })
  @ApiResponse({ status: 200, description: 'Shipping address set as primary successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your address' })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async setPrimary(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.shippingAddressesService.setPrimary(id, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete shipping address' })
  @ApiResponse({ status: 200, description: 'Shipping address deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete the only address' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your address' })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.shippingAddressesService.remove(id, req.user.sub, req.user.role);
  }
}