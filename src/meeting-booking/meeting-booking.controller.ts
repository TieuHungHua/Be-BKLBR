import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MeetingBookingService } from './meeting-booking.service';
import { CreateMeetingBookingDto } from './dto/create-meeting-booking.dto';
import { MeetingBookingsCriteriaDto } from './dto/meeting-bookings-criteria.dto';
import { MeetingBookingResponseDto } from './dto/meeting-booking-response.dto';
import { UpdateMeetingBookingDto } from './dto/update-meeting-booking.dto';
import { Prisma } from '@prisma/client';

type MeetingBookingWithUser = Prisma.MeetingBookingLegacyGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        username: true;
        displayName: true;
        role: true;
      };
    };
  };
}>;

@ApiTags('meeting-bookings')
@Controller('meeting-bookings')
export class MeetingBookingController {
  constructor(private readonly meetingBookingService: MeetingBookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a meeting table booking' })
  @ApiResponse({
    status: 201,
    description: 'Meeting booking created',
    type: MeetingBookingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or time slot conflict',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(
    @Body() createMeetingBookingDto: CreateMeetingBookingDto,
  ): Promise<MeetingBookingWithUser> {
    return this.meetingBookingService.create(createMeetingBookingDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List meeting table bookings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Meeting booking list',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MeetingBookingResponseDto' },
        },
        criteria: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() criteria: MeetingBookingsCriteriaDto): Promise<{
    data: MeetingBookingWithUser[];
    criteria: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return this.meetingBookingService.findAll(criteria);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get meeting table booking by id' })
  @ApiParam({ name: 'id', description: 'Meeting booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Meeting booking detail',
    type: MeetingBookingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Meeting booking not found' })
  async findOne(@Param('id') id: string): Promise<MeetingBookingWithUser> {
    return this.meetingBookingService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update meeting table booking' })
  @ApiParam({ name: 'id', description: 'Meeting booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Meeting booking updated',
    type: MeetingBookingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or time slot conflict',
  })
  @ApiResponse({
    status: 404,
    description: 'Meeting booking or user not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMeetingBookingDto: UpdateMeetingBookingDto,
  ): Promise<MeetingBookingWithUser> {
    return this.meetingBookingService.update(id, updateMeetingBookingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel meeting table booking' })
  @ApiParam({ name: 'id', description: 'Meeting booking ID' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Meeting booking deleted',
    type: MeetingBookingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Meeting booking or user not found',
  })
  async remove(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<MeetingBookingWithUser> {
    return this.meetingBookingService.remove(id, userId);
  }
}
