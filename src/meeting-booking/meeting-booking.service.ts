import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingBookingDto } from './dto/create-meeting-booking.dto';
import { MeetingBookingsCriteriaDto } from './dto/meeting-bookings-criteria.dto';
import { UpdateMeetingBookingDto } from './dto/update-meeting-booking.dto';

const MEETING_BOOKING_INCLUDE = {
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
    },
  },
} as const;

type MeetingBookingWithUser = Prisma.MeetingBookingGetPayload<{
  include: typeof MEETING_BOOKING_INCLUDE;
}>;

@Injectable()
export class MeetingBookingService {
  constructor(private prisma: PrismaService) {}

  private ensureRoleAllowed(role: UserRole) {
    const allowedRoles: UserRole[] = [
      UserRole.admin,
      UserRole.lecturer,
      UserRole.student,
    ];

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('User role is not allowed');
    }
  }

  async create(createMeetingBookingDto: CreateMeetingBookingDto): Promise<MeetingBookingWithUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: createMeetingBookingDto.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Keep role check in place while the endpoint is public.
    this.ensureRoleAllowed(user.role);

    const startAt = new Date(createMeetingBookingDto.startAt);
    const endAt = new Date(createMeetingBookingDto.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid startAt or endAt');
    }

    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }

    const overlap = await this.prisma.meetingBooking.findFirst({
      where: {
        tableName: createMeetingBookingDto.tableName,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (overlap) {
      throw new BadRequestException('Time slot already booked');
    }

    return this.prisma.meetingBooking.create({
      data: {
        userId: user.id,
        tableName: createMeetingBookingDto.tableName,
        startAt,
        endAt,
        purpose: createMeetingBookingDto.purpose,
        attendees: createMeetingBookingDto.attendees,
      },
      include: MEETING_BOOKING_INCLUDE,
    });
  }

  async findAll(criteria: MeetingBookingsCriteriaDto): Promise<{
    data: MeetingBookingWithUser[];
    criteria: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = criteria.page || 1;
    const limit = criteria.limit || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.prisma.meetingBooking.findMany({
        include: MEETING_BOOKING_INCLUDE,
        orderBy: {
          startAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.meetingBooking.count(),
    ]);

    return {
      data: bookings,
      criteria: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<MeetingBookingWithUser> {
    const booking = await this.prisma.meetingBooking.findUnique({
      where: { id },
      include: MEETING_BOOKING_INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException('Meeting booking not found');
    }

    return booking;
  }

  async update(id: string, updateMeetingBookingDto: UpdateMeetingBookingDto): Promise<MeetingBookingWithUser> {
    const existingBooking = await this.prisma.meetingBooking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      throw new NotFoundException('Meeting booking not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: updateMeetingBookingDto.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Keep role check in place while the endpoint is public.
    this.ensureRoleAllowed(user.role);

    const hasChanges =
      updateMeetingBookingDto.tableName !== undefined ||
      updateMeetingBookingDto.startAt !== undefined ||
      updateMeetingBookingDto.endAt !== undefined ||
      updateMeetingBookingDto.purpose !== undefined ||
      updateMeetingBookingDto.attendees !== undefined;

    if (!hasChanges) {
      throw new BadRequestException('No data to update');
    }

    const startAt =
      updateMeetingBookingDto.startAt !== undefined
        ? new Date(updateMeetingBookingDto.startAt)
        : existingBooking.startAt;
    const endAt =
      updateMeetingBookingDto.endAt !== undefined
        ? new Date(updateMeetingBookingDto.endAt)
        : existingBooking.endAt;

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid startAt or endAt');
    }

    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }

    const tableName =
      updateMeetingBookingDto.tableName !== undefined
        ? updateMeetingBookingDto.tableName
        : existingBooking.tableName;

    const shouldCheckOverlap =
      updateMeetingBookingDto.tableName !== undefined ||
      updateMeetingBookingDto.startAt !== undefined ||
      updateMeetingBookingDto.endAt !== undefined;

    if (shouldCheckOverlap) {
      const overlap = await this.prisma.meetingBooking.findFirst({
        where: {
          id: { not: id },
          tableName,
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });

      if (overlap) {
        throw new BadRequestException('Time slot already booked');
      }
    }

    const data: Prisma.MeetingBookingUpdateInput = {};

    if (updateMeetingBookingDto.tableName !== undefined) {
      data.tableName = updateMeetingBookingDto.tableName;
    }
    if (updateMeetingBookingDto.startAt !== undefined) {
      data.startAt = startAt;
    }
    if (updateMeetingBookingDto.endAt !== undefined) {
      data.endAt = endAt;
    }
    if (updateMeetingBookingDto.purpose !== undefined) {
      data.purpose = updateMeetingBookingDto.purpose;
    }
    if (updateMeetingBookingDto.attendees !== undefined) {
      data.attendees = updateMeetingBookingDto.attendees;
    }

    return this.prisma.meetingBooking.update({
      where: { id },
      data,
      include: MEETING_BOOKING_INCLUDE,
    });
  }

  async remove(id: string, userId: string): Promise<MeetingBookingWithUser> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Keep role check in place while the endpoint is public.
    this.ensureRoleAllowed(user.role);

    const booking = await this.prisma.meetingBooking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Meeting booking not found');
    }

    return this.prisma.meetingBooking.delete({
      where: { id },
      include: MEETING_BOOKING_INCLUDE,
    });
  }
}
