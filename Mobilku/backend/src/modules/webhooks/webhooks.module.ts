import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketGateway } from '../../config/websocket.gateway';

@Module({
  imports: [PaymentsModule, NotificationsModule],
  controllers: [WebhooksController],
  providers: [WebsocketGateway],
})
export class WebhooksModule {}
