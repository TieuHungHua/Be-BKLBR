import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseAdminService],
  exports: [NotificationService, FirebaseAdminService],
})
export class NotificationModule {}
