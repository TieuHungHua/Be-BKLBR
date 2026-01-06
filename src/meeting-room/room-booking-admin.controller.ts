import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserType,
} from '../auth/decorators/current-user.decorator';
import { RoomBookingService } from './room-booking.service';
import { BookingSearchCriteriaDto } from './dto/booking-search.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@ApiTags('admin-bookings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/admin/bookings')
export class RoomBookingAdminController {
  constructor(private readonly roomBookingService: RoomBookingService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin search bookings' })
  @ApiBody({ type: BookingSearchCriteriaDto })
  @ApiResponse({ status: 200, description: 'Bookings list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async searchBookings(
    @Body() criteria: BookingSearchCriteriaDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    this.assertStaff(currentUser);
    return this.roomBookingService.searchBookings(criteria, currentUser);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a booking' })
  @ApiResponse({ status: 200, description: 'Booking approved' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 409, description: 'Room conflict' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    this.assertStaff(currentUser);
    return this.roomBookingService.approveBooking(id, currentUser);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a booking' })
  @ApiResponse({ status: 200, description: 'Booking rejected' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async reject(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    this.assertStaff(currentUser);
    return this.roomBookingService.rejectBooking(id, currentUser, dto);
  }

  private assertStaff(currentUser: CurrentUserType) {
    if (
      currentUser.role !== UserRole.admin &&
      currentUser.role !== UserRole.lecturer
    ) {
      throw new ForbiddenException('Admin or staff role required');
    }
  }
}
