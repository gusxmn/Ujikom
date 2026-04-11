import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { XenditService } from './xendit.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketGateway } from '../../config/websocket.gateway';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, XenditService, WebsocketGateway],
  exports: [PaymentsService, XenditService],
})
export class PaymentsModule {}