import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserType,
} from '../auth/decorators/current-user.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingSearchCriteriaDto } from './dto/booking-search.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { RoomBookingService } from './room-booking.service';

interface RequestWithUser extends Request {
  user?: CurrentUserType;
}

@ApiTags('bookings')
@Controller('api/v1/bookings')
export class RoomBookingController {
  constructor(private readonly roomBookingService: RoomBookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a meeting room booking' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Room conflict' })
  async createBooking(
    @Body() dto: CreateBookingDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.roomBookingService.createBooking(currentUser, dto);
  }

  @Post('search')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search bookings (Criteria-based pagination)' })
  @ApiBody({ type: BookingSearchCriteriaDto })
  @ApiResponse({ status: 200, description: 'Bookings list' })
  async searchBookings(
    @Body() criteria: BookingSearchCriteriaDto,
    @Req() req: RequestWithUser,
  ) {
    return this.roomBookingService.searchBookings(criteria, req.user ?? null);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get booking detail' })
  @ApiResponse({ status: 200, description: 'Booking detail' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.roomBookingService.getBookingById(id, req.user ?? null);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async cancelBooking(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.roomBookingService.cancelBooking(id, currentUser, dto);
  }
}
