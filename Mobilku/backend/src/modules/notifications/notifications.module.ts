import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WebsocketGateway } from '../../config/websocket.gateway';

@Module({
  providers: [NotificationsService, WebsocketGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService, WebsocketGateway],
})
export class NotificationsModule {}
