import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MeetingRoomController } from './meeting-room.controller';
import { RoomBookingController } from './room-booking.controller';
import { RoomBookingAdminController } from './room-booking-admin.controller';
import { MeetingRoomService } from './meeting-room.service';
import { RoomBookingService } from './room-booking.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    MeetingRoomController,
    RoomBookingController,
    RoomBookingAdminController,
  ],
  providers: [MeetingRoomService, RoomBookingService],
})
export class MeetingRoomModule {}
