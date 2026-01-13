import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, TicketType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsQueryDto } from './dto/tickets-query.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: TicketsQueryDto, currentUserId: string, currentUserRole: UserRole) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    // User chỉ xem được ticket của mình, Admin xem được tất cả
    if (currentUserRole !== UserRole.admin) {
      where.userId = currentUserId;
    } else if (query.userId) {
      // Admin có thể filter theo userId
      where.userId = query.userId;
    }

    // Phân loại theo category: book hoặc room (ưu tiên hơn type)
    if (query.category) {
      if (query.category === 'book') {
        // Lọc các ticket liên quan đến sách
        where.type = {
          in: [TicketType.borrow_book, TicketType.return_book],
        };
      } else if (query.category === 'room') {
        // Lọc các ticket liên quan đến phòng
        where.type = {
          in: [TicketType.room_booking, TicketType.room_cancellation],
        };
      }
    } else if (query.type) {
      // Nếu không có category thì mới dùng type
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    // Tìm kiếm theo mã số sinh viên
    if (query.search) {
      where.user = {
        studentId: {
          contains: query.search,
          mode: 'insensitive',
        },
      };
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              studentId: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
          room: {
            select: {
              id: true,
              name: true,
              capacity: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUserId: string, currentUserRole: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            studentId: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket không tồn tại');
    }

    // User chỉ xem được ticket của mình
    if (currentUserRole !== UserRole.admin && ticket.userId !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền xem ticket này');
    }

    return ticket;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateTicketStatusDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ) {
    // Chỉ admin mới được cập nhật trạng thái
    if (currentUserRole !== UserRole.admin) {
      throw new ForbiddenException('Chỉ admin mới được phép cập nhật trạng thái ticket');
    }

    // Chỉ cho phép approved hoặc rejected
    if (updateDto.status !== 'approved' && updateDto.status !== 'rejected') {
      throw new BadRequestException('Trạng thái phải là approved hoặc rejected');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket không tồn tại');
    }

    const now = new Date();
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: updateDto.status,
        note: updateDto.note || null,
        reviewedBy: currentUserId,
        reviewedAt: now,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            studentId: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string, currentUserId: string, currentUserRole: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket không tồn tại');
    }

    // User chỉ xóa được ticket của mình (nếu status = pending)
    if (currentUserRole !== UserRole.admin) {
      if (ticket.userId !== currentUserId) {
        throw new ForbiddenException('Bạn không có quyền xóa ticket này');
      }
      if (ticket.status !== 'pending') {
        throw new BadRequestException('Chỉ có thể xóa ticket có trạng thái pending');
      }
    }

    await this.prisma.ticket.delete({
      where: { id },
    });

    return {
      message: 'Ticket đã được xóa thành công',
    };
  }
}
