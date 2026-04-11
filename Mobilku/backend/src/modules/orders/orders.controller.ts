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
  Query,
  ParseIntPipe,
  Response,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('📦 Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.createFromCart(req.user.sub, createOrderDto);
    return {
      order: {
        ...order,
        status: order.status.toLowerCase(),
      }
    };
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  @Post('checkout/cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Checkout from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully from cart' })
  @ApiResponse({ status: 400, description: 'Cart is empty or invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkoutFromCart(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.createFromCart(req.user.sub, createOrderDto);
    return {
      ...order,
      status: order.status.toLowerCase(),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Request() req,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    
    const result = await this.ordersService.findAll(req.user.sub, req.user.role, page, limit);
    return {
      data: result.data.map(order => ({
        ...order,
        status: order.status.toLowerCase(),
      })),
      pagination: result.pagination,
    };
  }

  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download order invoice as PDF' })
  @ApiResponse({ status: 200, description: 'Invoice PDF generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getInvoice(@Request() req, @Param('id', ParseIntPipe) id: number, @Response() res: any) {
    try {
      const stream = await this.ordersService.generateInvoice(id, req.user.sub, req.user.role);
      const order = await this.ordersService.findOne(id, req.user.sub, req.user.role);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
      
      stream.on('error', (error: any) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to generate invoice' });
        }
      });
      
      res.on('error', (error: any) => {
        console.error('Response error:', error);
        stream.destroy();
      });
      
      stream.pipe(res);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: error.message });
      } else if (error instanceof ForbiddenException) {
        res.status(403).json({ message: error.message });
      } else {
        console.error('Invoice generation error:', error);
        res.status(500).json({ message: 'Failed to generate invoice' });
      }
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.findOne(id, req.user.sub, req.user.role);
    return {
      ...order,
      status: order.status.toLowerCase(),
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(id, updateOrderStatusDto, req.user.sub, req.user.role);
    return {
      ...order,
      status: order.status.toLowerCase(),
    };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.cancelOrder(id, req.user.sub, req.user.role);
    return {
      ...order,
      status: order.status.toLowerCase(),
    };
  }

  @Post(':id/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder items from a previous order' })
  @ApiResponse({ status: 200, description: 'Items added to cart successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async reorder(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const result = await this.ordersService.reorder(id, req.user.sub, req.user.role);
    return result;
  }
}