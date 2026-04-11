import { Module } from '@nestjs/common';
import { PackageTrackingService } from './package-tracking.service';
import { PackageTrackingController } from './package-tracking.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PackageTrackingService],
  controllers: [PackageTrackingController],
  exports: [PackageTrackingService],
})
export class PackageTrackingModule {}
