import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { InteractionType, PointReason, EventType } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async createComment(
    userId: string,
    bookId: string,
    createCommentDto: CreateCommentDto,
  ) {
    // Kiểm tra book có tồn tại không
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }

    // Kiểm tra user đã comment chưa (unique constraint)
    const existingComment = await this.prisma.interaction.findUnique({
      where: {
        userId_bookId_type: {
          userId,
          bookId,
          type: InteractionType.comment,
        },
      },
    });

    if (existingComment) {
      throw new BadRequestException('Bạn đã bình luận cho sách này rồi');
    }

    // Tạo comment và cập nhật counters trong transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Tạo comment
      const comment = await tx.interaction.create({
        data: {
          userId,
          bookId,
          type: InteractionType.comment,
          content: createCommentDto.content,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      // Cập nhật commentCount của book
      await tx.book.update({
        where: { id: bookId },
        data: {
          commentCount: {
            increment: 1,
          },
        },
      });

      // Cập nhật totalComments của user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalComments: {
            increment: 1,
          },
        },
      });

      // Tạo điểm thưởng cho comment (ví dụ: 5 điểm)
      await tx.pointTransaction.create({
        data: {
          userId,
          delta: 5,
          reason: PointReason.comment,
          refType: 'interaction_id',
          refId: comment.id,
          note: 'Bình luận sách',
        },
      });

      // Tạo activity
      await tx.activity.create({
        data: {
          userId,
          eventType: EventType.comment,
          bookId,
          payload: {
            commentId: comment.id,
            content: createCommentDto.content.substring(0, 100), // Lưu preview
          },
        },
      });

      return comment;
    });

    return {
      id: result.id,
      content: result.content,
      user: result.user,
      createdAt: result.createdAt,
    };
  }

  async getComments(bookId: string, query: CommentsQueryDto) {
    // Kiểm tra book có tồn tại không
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Lấy comments với pagination
    const [comments, total] = await Promise.all([
      this.prisma.interaction.findMany({
        where: {
          bookId,
          type: InteractionType.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.interaction.count({
        where: {
          bookId,
          type: InteractionType.comment,
        },
      }),
    ]);

    return {
      data: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateComment(
    userId: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ) {
    // Tìm comment
    const comment = await this.prisma.interaction.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // Kiểm tra quyền (chỉ owner mới được sửa)
    if (comment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa bình luận này');
    }

    // Kiểm tra type phải là comment
    if (comment.type !== InteractionType.comment) {
      throw new BadRequestException('Đây không phải là bình luận');
    }

    // Cập nhật comment
    const updated = await this.prisma.interaction.update({
      where: { id: commentId },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      content: updated.content,
      user: updated.user,
      createdAt: updated.createdAt,
    };
  }

  async deleteComment(userId: string, commentId: string) {
    // Tìm comment
    const comment = await this.prisma.interaction.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // Kiểm tra quyền (chỉ owner mới được xóa)
    if (comment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    // Kiểm tra type phải là comment
    if (comment.type !== InteractionType.comment) {
      throw new BadRequestException('Đây không phải là bình luận');
    }

    // Xóa comment và cập nhật counters trong transaction
    await this.prisma.$transaction(async (tx) => {
      // Xóa comment
      await tx.interaction.delete({
        where: { id: commentId },
      });

      // Cập nhật commentCount của book
      await tx.book.update({
        where: { id: comment.bookId },
        data: {
          commentCount: {
            decrement: 1,
          },
        },
      });

      // Cập nhật totalComments của user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalComments: {
            decrement: 1,
          },
        },
      });
    });

    return {
      message: 'Xóa bình luận thành công',
    };
  }
}

