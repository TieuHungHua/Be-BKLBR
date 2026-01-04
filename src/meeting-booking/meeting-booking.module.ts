import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MeetingBookingController } from './meeting-booking.controller';
import { MeetingBookingService } from './meeting-booking.service';

@Module({
  imports: [PrismaModule],
  controllers: [MeetingBookingController],
  providers: [MeetingBookingService],
  exports: [MeetingBookingService],
})
export class MeetingBookingModule {}
