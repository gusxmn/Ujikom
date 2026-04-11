import { Controller, Get, Param, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { PackageTrackingService } from './package-tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/package-tracking')
export class PackageTrackingController {
  constructor(private readonly packageTrackingService: PackageTrackingService) {}

  @Public()
  @Get('search/:trackingNumber')
  async searchByTrackingNumber(@Param('trackingNumber') trackingNumber: string) {
    try {
      const tracking = await this.packageTrackingService.getTrackingByNumber(trackingNumber);
      
      if (!tracking) {
        throw new HttpException(
          'Tracking number not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: {
          id: tracking.id,
          trackingNumber: tracking.trackingNumber,
          status: tracking.status,
          carrier: tracking.carrier,
          currentLocation: tracking.currentLocation,
          estimatedDelivery: tracking.estimatedDelivery,
          actualDelivery: tracking.actualDelivery,
          shippingAddress: typeof tracking.shippingAddress === 'string'
            ? tracking.shippingAddress
            : JSON.parse(tracking.shippingAddress.toString()),
          order: tracking.order,
          timeline: tracking.trackingHistory.map((history) => ({
            status: history.status,
            location: history.location,
            description: history.description,
            timestamp: history.timestamp,
          })),
          createdAt: tracking.createdAt,
          updatedAt: tracking.updatedAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching tracking information',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Get('order/:orderId')
  async getByOrderId(@Param('orderId') orderId: string, @Req() req: any) {
    try {
      const order = await this.packageTrackingService.getTrackingByOrderId(parseInt(orderId));
      
      if (!order) {
        throw new HttpException(
          'No tracking found for this order',
          HttpStatus.NOT_FOUND,
        );
      }

      // Verify user ownership
      if (order.order.userId !== req.user.id) {
        throw new HttpException(
          'Unauthorized',
          HttpStatus.FORBIDDEN,
        );
      }

      return {
        success: true,
        data: {
          id: order.id,
          trackingNumber: order.trackingNumber,
          status: order.status,
          carrier: order.carrier,
          currentLocation: order.currentLocation,
          estimatedDelivery: order.estimatedDelivery,
          actualDelivery: order.actualDelivery,
          shippingAddress: typeof order.shippingAddress === 'string'
            ? order.shippingAddress
            : JSON.parse(order.shippingAddress.toString()),
          order: order.order,
          timeline: order.trackingHistory.map((history) => ({
            status: history.status,
            location: history.location,
            description: history.description,
            timestamp: history.timestamp,
          })),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching tracking information',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Get('my-shipments')
  async getUserShipments(@Req() req: any) {
    try {
      const shipments = await this.packageTrackingService.getUserPackageTracking(req.user.id);

      return {
        success: true,
        data: shipments.map((tracking) => ({
          id: tracking.id,
          trackingNumber: tracking.trackingNumber,
          status: tracking.status,
          carrier: tracking.carrier,
          currentLocation: tracking.currentLocation,
          estimatedDelivery: tracking.estimatedDelivery,
          actualDelivery: tracking.actualDelivery,
          order: tracking.order,
          latestUpdate: tracking.trackingHistory[0] || null,
          createdAt: tracking.createdAt,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching shipments',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/all')
  async getAllTracking() {
    try {
      const allTracking = await this.packageTrackingService.getAllTracking();

      return {
        success: true,
        data: allTracking.map((tracking) => ({
          id: tracking.id,
          trackingNumber: tracking.trackingNumber,
          status: tracking.status,
          carrier: tracking.carrier,
          currentLocation: tracking.currentLocation,
          order: tracking.order,
          latestUpdate: tracking.trackingHistory[0] || null,
          createdAt: tracking.createdAt,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error fetching tracking data',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
