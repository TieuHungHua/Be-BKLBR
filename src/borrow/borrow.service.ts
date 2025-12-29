import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { BorrowsQueryDto } from './dto/borrows-query.dto';
import { BorrowStatus, PointReason, EventType } from '@prisma/client';

@Injectable()
export class BorrowService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBorrowDto: CreateBorrowDto) {
    // Kiểm tra book có tồn tại không
    const book = await this.prisma.book.findUnique({
      where: { id: createBorrowDto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }

    // Kiểm tra còn sách có sẵn không
    if (book.availableCopies <= 0) {
      throw new BadRequestException('Sách hiện không còn bản sao có sẵn');
    }

    // Kiểm tra user đã mượn sách này chưa (đang active)
    const existingBorrow = await this.prisma.borrow.findFirst({
      where: {
        userId,
        bookId: createBorrowDto.bookId,
        status: BorrowStatus.active,
      },
    });

    if (existingBorrow) {
      throw new BadRequestException('Bạn đang mượn sách này rồi');
    }

    // Tạo borrow và cập nhật counters trong transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Tạo borrow
      const borrow = await tx.borrow.create({
        data: {
          userId,
          bookId: createBorrowDto.bookId,
          dueAt: new Date(createBorrowDto.dueAt),
        },
        include: {
          user: {
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
        },
      });

      // Giảm availableCopies
      await tx.book.update({
        where: { id: createBorrowDto.bookId },
        data: {
          availableCopies: {
            decrement: 1,
          },
          borrowCount: {
            increment: 1,
          },
        },
      });

      // Cập nhật totalBorrowed của user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalBorrowed: {
            increment: 1,
          },
        },
      });

      // Tạo điểm thưởng cho borrow
      await tx.pointTransaction.create({
        data: {
          userId,
          delta: 10,
          reason: PointReason.borrow,
          refType: 'borrow_id',
          refId: borrow.id,
          note: 'Mượn sách',
        },
      });

      // Tạo activity
      await tx.activity.create({
        data: {
          userId,
          eventType: EventType.borrow,
          bookId: createBorrowDto.bookId,
          payload: {
            borrowId: borrow.id,
            dueAt: createBorrowDto.dueAt,
          },
        },
      });

      return borrow;
    });

    return result;
  }

  async findAll(query: BorrowsQueryDto, userId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BorrowWhereInput = {};
    if (userId) {
      where.userId = userId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [borrows, total] = await Promise.all([
      this.prisma.borrow.findMany({
        where,
        include: {
          user: {
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
        },
        orderBy: {
          borrowedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.borrow.count({ where }),
    ]);

    return {
      data: borrows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const borrow = await this.prisma.borrow.findUnique({
      where: { id },
      include: {
        user: {
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
      },
    });

    if (!borrow) {
      throw new NotFoundException('Lịch sử mượn không tồn tại');
    }

    // Kiểm tra quyền (chỉ owner hoặc admin mới xem được)
    if (userId && borrow.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem lịch sử mượn này');
    }

    return borrow;
  }

  async returnBook(id: string, userId: string) {
    const borrow = await this.prisma.borrow.findUnique({
      where: { id },
      include: {
        book: true,
      },
    });

    if (!borrow) {
      throw new NotFoundException('Lịch sử mượn không tồn tại');
    }

    // Kiểm tra quyền
    if (borrow.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền trả sách này');
    }

    // Kiểm tra đã trả chưa
    if (borrow.status === BorrowStatus.returned) {
      throw new BadRequestException('Sách đã được trả rồi');
    }

    const now = new Date();
    const isLate = now > borrow.dueAt;

    // Cập nhật borrow và counters trong transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Cập nhật borrow
      const updated = await tx.borrow.update({
        where: { id },
        data: {
          status: BorrowStatus.returned,
          returnedAt: now,
        },
        include: {
          user: {
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
        },
      });

      // Tăng availableCopies
      await tx.book.update({
        where: { id: borrow.bookId },
        data: {
          availableCopies: {
            increment: 1,
          },
        },
      });

      // Cập nhật totalReturned của user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalReturned: {
            increment: 1,
          },
        },
      });

      // Tạo điểm thưởng (trả đúng hạn: 5 điểm, trả muộn: -5 điểm)
      const points = isLate ? -5 : 5;
      await tx.pointTransaction.create({
        data: {
          userId,
          delta: points,
          reason: isLate ? PointReason.return_late : PointReason.return_on_time,
          refType: 'borrow_id',
          refId: borrow.id,
          note: isLate ? 'Trả sách muộn' : 'Trả sách đúng hạn',
        },
      });

      // Tạo activity
      await tx.activity.create({
        data: {
          userId,
          eventType: EventType.return,
          bookId: borrow.bookId,
          payload: {
            borrowId: borrow.id,
            isLate,
          },
        },
      });

      return updated;
    });

    return result;
  }

  async remove(id: string, userId: string) {
    const borrow = await this.prisma.borrow.findUnique({
      where: { id },
    });

    if (!borrow) {
      throw new NotFoundException('Lịch sử mượn không tồn tại');
    }

    // Kiểm tra quyền
    if (borrow.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa lịch sử mượn này');
    }

    // Chỉ cho phép xóa nếu đã trả
    if (borrow.status !== BorrowStatus.returned) {
      throw new BadRequestException('Chỉ có thể xóa lịch sử mượn đã trả');
    }

    return this.prisma.borrow.delete({
      where: { id },
    });
  }
}

