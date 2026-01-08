import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationLogService } from './notification-log.service';
import { EmailService } from './email.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ScheduleModule.forRoot(), PrismaModule],
    controllers: [NotificationController],
    providers: [NotificationService, NotificationLogService, EmailService, FirebaseAdminService],
    exports: [NotificationService, NotificationLogService, EmailService, FirebaseAdminService],
})
export class NotificationModule { }
