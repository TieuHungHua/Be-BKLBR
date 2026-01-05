import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsAvailabilityQueryDto } from './dto/rooms-availability.query.dto';
import { RoomBookingStatus } from '@prisma/client';

@Injectable()
export class MeetingRoomService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomsWithAvailability(query: RoomsAvailabilityQueryDto) {
    const startAt = new Date(query.start_at);
    const endAt = new Date(query.end_at);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid start_at or end_at');
    }

    this.assertOneHourSlot(startAt, endAt);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const orderBy = this.buildRoomOrderBy(query.sortBy, query.sortDir);

    const [rooms, total] = await Promise.all([
      this.prisma.meetingRoom.findMany({
        where: { isActive: true },
        include: { resources: true },
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.meetingRoom.count({ where: { isActive: true } }),
    ]);

    const roomIds = rooms.map((room) => room.id);
    const conflicts = roomIds.length
      ? await this.prisma.roomBooking.findMany({
          where: {
            roomId: { in: roomIds },
            status: { in: [RoomBookingStatus.pending, RoomBookingStatus.approved] },
            AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
          },
          select: { roomId: true },
        })
      : [];

    const busyRoomIds = new Set(conflicts.map((item) => item.roomId));

    return {
      items: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        image_url: room.imageUrl,
        resources: room.resources.map((resource) => resource.type),
        availability: {
          is_available: !busyRoomIds.has(room.id),
        },
      })),
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private buildRoomOrderBy(
    sortBy?: string,
    sortDir?: 'asc' | 'desc',
  ): Record<string, 'asc' | 'desc'> {
    const direction = sortDir === 'asc' ? 'asc' : 'desc';
    switch (sortBy) {
      case 'capacity':
        return { capacity: direction };
      case 'created_at':
        return { createdAt: direction };
      case 'name':
      default:
        return { name: direction };
    }
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
}
