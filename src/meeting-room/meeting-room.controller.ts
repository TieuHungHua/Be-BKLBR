import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MeetingRoomService } from './meeting-room.service';
import { RoomsAvailabilityQueryDto } from './dto/rooms-availability.query.dto';

@ApiTags('rooms')
@Controller('api/v1/rooms')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List rooms with availability for a time slot' })
  @ApiResponse({ status: 200, description: 'Rooms with availability' })
  async getRooms(@Query() query: RoomsAvailabilityQueryDto) {
    return this.meetingRoomService.getRoomsWithAvailability(query);
  }
}
