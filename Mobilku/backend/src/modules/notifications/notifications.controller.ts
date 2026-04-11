import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@GetUser('id') userId: number) {
    return this.notificationsService.getUserNotifications(userId, 50);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') notificationId: number) {
    return this.notificationsService.markAsRead(notificationId);
  }

  @Post('read-all')
  async markAllAsRead(@GetUser('id') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post(':id/delete')
  async deleteNotification(@Param('id') notificationId: number) {
    return this.notificationsService.deleteNotification(notificationId);
  }
}
