import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoomBookingStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  BookingSearchCriteriaDto,
  FilterOperator,
  SortDirection,
} from './dto/booking-search.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';

const BLOCKING_STATUSES: RoomBookingStatus[] = [
  RoomBookingStatus.pending,
  RoomBookingStatus.approved,
];

const BOOKING_INCLUDE = {
  room: {
    include: {
      resources: true,
    },
  },
  user: {
    select: {
      id: true,
      displayName: true,
      email: true,
      studentId: true,
      username: true,
    },
  },
};

type BookingWithRelations = Prisma.RoomBookingGetPayload<{
  include: typeof BOOKING_INCLUDE;
}>;

@Injectable()
export class RoomBookingService {
  constructor(private readonly prisma: PrismaService) { }

  async createBooking(user: CurrentUserType, dto: CreateBookingDto) {
    const startAt = new Date(dto.start_at);
    const endAt = new Date(dto.end_at);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid start_at or end_at');
    }

    this.assertOneHourSlot(startAt, endAt);

    const room = await this.prisma.meetingRoom.findUnique({
      where: { id: dto.room_id },
      include: { resources: true },
    });

    if (!room || !room.isActive) {
      throw new NotFoundException('Room not found');
    }

    if (dto.attendee_count > room.capacity) {
      throw new BadRequestException('attendee_count exceeds room capacity');
    }

    const purpose = dto.purpose.trim();
    if (!purpose) {
      throw new BadRequestException('purpose is required');
    }

    const status = this.getDefaultStatus();
    const now = new Date();

    const booking = await this.prisma.$transaction(async (tx) => {
      await this.assertNoConflict(tx, dto.room_id, startAt, endAt);

      return tx.roomBooking.create({
        data: {
          roomId: dto.room_id,
          userId: user.id,
          startAt,
          endAt,
          purpose,
          attendeeCount: dto.attendee_count,
          status,
          approvedAt: status === RoomBookingStatus.approved ? now : null,
        },
        include: BOOKING_INCLUDE,
      });
    });

    return this.formatBooking(booking);
  }

  async searchBookings(
    criteria: BookingSearchCriteriaDto,
    currentUser?: CurrentUserType | null,
  ) {
    if (currentUser) {
      this.assertKnownRole(currentUser.role);
    }

    const page = criteria.page ?? 1;
    const pageSize = criteria.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = this.buildBookingWhere(criteria);
    const orderBy = this.buildBookingOrderBy(criteria);

    const [items, total] = await Promise.all([
      this.prisma.roomBooking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.roomBooking.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatBooking(item)),
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getBookingById(id: string, currentUser?: CurrentUserType | null) {
    if (currentUser) {
      this.assertKnownRole(currentUser.role);
    }

    const booking = await this.prisma.roomBooking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.formatBooking(booking);
  }

  async cancelBooking(
    id: string,
    currentUser: CurrentUserType,
    dto: CancelBookingDto,
  ) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!this.isOwnerOrStaff(booking.userId, currentUser)) {
      throw new ForbiddenException('Not allowed to cancel this booking');
    }

    if (!BLOCKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const updated = await this.prisma.roomBooking.update({
      where: { id },
      data: {
        status: RoomBookingStatus.cancelled,
        cancelledBy: currentUser.id,
        cancelledAt: new Date(),
        cancelReason: dto.reason?.trim() || null,
      },
      include: BOOKING_INCLUDE,
    });

    return this.formatBooking(updated);
  }

  async approveBooking(id: string, currentUser: CurrentUserType) {
    this.assertStaffRole(currentUser.role);

    const booking = await this.prisma.roomBooking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== RoomBookingStatus.pending) {
      throw new BadRequestException('Only pending bookings can be approved');
    }

    await this.assertNoConflict(
      this.prisma,
      booking.roomId,
      booking.startAt,
      booking.endAt,
      booking.id,
    );

    const updated = await this.prisma.roomBooking.update({
      where: { id },
      data: {
        status: RoomBookingStatus.approved,
        approvedBy: currentUser.id,
        approvedAt: new Date(),
      },
      include: BOOKING_INCLUDE,
    });

    return this.formatBooking(updated);
  }

  async rejectBooking(
    id: string,
    currentUser: CurrentUserType,
    dto: CancelBookingDto,
  ) {
    this.assertStaffRole(currentUser.role);

    const booking = await this.prisma.roomBooking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== RoomBookingStatus.pending) {
      throw new BadRequestException('Only pending bookings can be rejected');
    }

    const updated = await this.prisma.roomBooking.update({
      where: { id },
      data: {
        status: RoomBookingStatus.cancelled,
        cancelledBy: currentUser.id,
        cancelledAt: new Date(),
        cancelReason: dto.reason?.trim() || null,
      },
      include: BOOKING_INCLUDE,
    });

    return this.formatBooking(updated);
  }

  private assertKnownRole(role: UserRole) {
    if (!role) {
      throw new ForbiddenException('Role is required');
    }
  }

  private assertStaffRole(role: UserRole) {
    if (role !== UserRole.admin && role !== UserRole.lecturer) {
      throw new ForbiddenException('Admin or staff role required');
    }
  }

  private isOwnerOrStaff(ownerId: string, currentUser: CurrentUserType) {
    if (ownerId === currentUser.id) {
      return true;
    }
    return currentUser.role === UserRole.admin || currentUser.role === UserRole.lecturer;
  }

  private assertOneHourSlot(startAt: Date, endAt: Date) {
    if (startAt >= endAt) {
      throw new BadRequestException('start_at must be before end_at');
    }

    const durationMs = endAt.getTime() - startAt.getTime();
    const oneHourMs = 60 * 60 * 1000;
    if (durationMs !== oneHourMs) {
      throw new BadRequestException('Slot must be exactly 60 minutes');
    }

    if (
      startAt.getMinutes() !== 0 ||
      startAt.getSeconds() !== 0 ||
      startAt.getMilliseconds() !== 0
    ) {
      throw new BadRequestException('start_at must be aligned to the hour');
    }
  }

  private getDefaultStatus(): RoomBookingStatus {
    return process.env.BOOKING_AUTO_APPROVE === 'true'
      ? RoomBookingStatus.approved
      : RoomBookingStatus.pending;
  }

  private async assertNoConflict(
    prisma: PrismaService | Prisma.TransactionClient,
    roomId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ) {
    const conflict = await prisma.roomBooking.findFirst({
      where: {
        roomId,
        status: { in: BLOCKING_STATUSES },
        AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (conflict) {
      throw new ConflictException('Room is already booked for this slot');
    }
  }

  private buildBookingWhere(criteria: BookingSearchCriteriaDto) {
    const filters = criteria.filters ?? [];
    if (!filters.length) {
      return {};
    }

    const andConditions: Prisma.RoomBookingWhereInput[] = [];

    for (const filter of filters) {
      const mappedField = this.mapFilterField(filter.field);
      if (!mappedField) {
        throw new BadRequestException(`Unsupported filter field: ${filter.field}`);
      }

      const value = this.coerceFilterValue(mappedField, filter.value);
      const condition = this.buildFilterCondition(mappedField, filter.op, value);
      andConditions.push(condition);
    }

    return { AND: andConditions };
  }

  private mapFilterField(field: string): keyof Prisma.RoomBookingWhereInput | null {
    switch (field) {
      case 'status':
        return 'status';
      case 'start_at':
        return 'startAt';
      case 'end_at':
        return 'endAt';
      case 'created_at':
        return 'createdAt';
      case 'room_id':
        return 'roomId';
      case 'user_id':
        return 'userId';
      case 'attendee_count':
        return 'attendeeCount';
      case 'purpose':
        return 'purpose';
      default:
        return null;
    }
  }

  private coerceFilterValue(
    field: keyof Prisma.RoomBookingWhereInput,
    value: unknown,
  ) {
    if (field === 'status') {
      if (Array.isArray(value)) {
        return value.map((item) => this.normalizeStatus(String(item)));
      }
      return this.normalizeStatus(String(value));
    }

    if (field === 'startAt' || field === 'endAt' || field === 'createdAt') {
      const parseDate = (input: unknown) => {
        const parsed = new Date(String(input));
        if (Number.isNaN(parsed.getTime())) {
          throw new BadRequestException(`Invalid date value for ${field}`);
        }
        return parsed;
      };
      if (Array.isArray(value)) {
        return value.map((item) => parseDate(item));
      }
      return parseDate(value);
    }

    if (field === 'attendeeCount') {
      const parseNumber = (input: unknown) => {
        const parsed = Number(input);
        if (Number.isNaN(parsed)) {
          throw new BadRequestException('Invalid attendee_count value');
        }
        return parsed;
      };
      if (Array.isArray(value)) {
        return value.map((item) => parseNumber(item));
      }
      return parseNumber(value);
    }

    return value;
  }

  private normalizeStatus(status: string): RoomBookingStatus {
    const normalized = status.toLowerCase();
    if (Object.values(RoomBookingStatus).includes(normalized as RoomBookingStatus)) {
      return normalized as RoomBookingStatus;
    }
    throw new BadRequestException(`Invalid status: ${status}`);
  }

  private buildFilterCondition(
    field: keyof Prisma.RoomBookingWhereInput,
    op: FilterOperator,
    value: unknown,
  ): Prisma.RoomBookingWhereInput {
    switch (op) {
      case FilterOperator.EQ:
        return { [field]: value } as Prisma.RoomBookingWhereInput;
      case FilterOperator.NE:
        return { [field]: { not: value } } as Prisma.RoomBookingWhereInput;
      case FilterOperator.IN:
        return { [field]: { in: Array.isArray(value) ? value : [value] } } as Prisma.RoomBookingWhereInput;
      case FilterOperator.GTE:
        return { [field]: { gte: value } } as Prisma.RoomBookingWhereInput;
      case FilterOperator.LTE:
        return { [field]: { lte: value } } as Prisma.RoomBookingWhereInput;
      case FilterOperator.GT:
        return { [field]: { gt: value } } as Prisma.RoomBookingWhereInput;
      case FilterOperator.LT:
        return { [field]: { lt: value } } as Prisma.RoomBookingWhereInput;
      case FilterOperator.CONTAINS:
        if (field !== 'purpose') {
          throw new BadRequestException('CONTAINS is only supported for purpose');
        }
        return {
          purpose: { contains: String(value), mode: 'insensitive' },
        } as Prisma.RoomBookingWhereInput;
      default:
        throw new BadRequestException(`Unsupported operator: ${op}`);
    }
  }

  private buildBookingOrderBy(criteria: BookingSearchCriteriaDto) {
    const sorts = criteria.sorts ?? [];
    if (!sorts.length) {
      return [{ startAt: 'desc' }];
    }

    return sorts.map((sort) => {
      const sortField: string = sort.field;
      const field = this.mapSortField(sortField);
      if (!field) {
        throw new BadRequestException(`Unsupported sort field: ${String(sortField)}`);
      }
      const direction = sort.dir === SortDirection.ASC ? 'asc' : 'desc';
      return { [field as string]: direction };
    });
  }

  private mapSortField(field: string) {
    switch (field) {
      case 'start_at':
        return 'startAt';
      case 'end_at':
        return 'endAt';
      case 'created_at':
        return 'createdAt';
      case 'status':
        return 'status';
      case 'attendee_count':
        return 'attendeeCount';
      default:
        return null;
    }
  }

  private formatBooking(booking: BookingWithRelations) {
    return {
      id: booking.id,
      room_id: booking.roomId,
      user_id: booking.userId,
      start_at: booking.startAt.toISOString(),
      end_at: booking.endAt.toISOString(),
      purpose: booking.purpose,
      attendee_count: booking.attendeeCount,
      status: booking.status,
      approved_by: booking.approvedBy,
      approved_at: booking.approvedAt ? booking.approvedAt.toISOString() : null,
      cancelled_by: booking.cancelledBy,
      cancelled_at: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
      cancel_reason: booking.cancelReason,
      created_at: booking.createdAt.toISOString(),
      updated_at: booking.updatedAt.toISOString(),
      room: {
        id: booking.room.id,
        name: booking.room.name,
        capacity: booking.room.capacity,
        image_url: booking.room.imageUrl,
        resources: booking.room.resources.map((resource) => resource.type),
      },
      user: {
        id: booking.user.id,
        name: booking.user.displayName,
        email: booking.user.email,
        student_code: booking.user.studentId,
        username: booking.user.username,
      },
    };
  }
}
