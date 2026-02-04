import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { XenditService } from './xendit.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, XenditService],
  exports: [PaymentsService, XenditService],
})
export class PaymentsModule {}