import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionType, PointReason, EventType } from '@prisma/client';
import { FavoritesQueryDto } from './dto/favorites-query.dto';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) { }

  /**
   * Toggle yêu thích sách (thêm nếu chưa có, xóa nếu đã có)
   */
  async toggleFavorite(userId: string, bookId: string) {
    // Kiểm tra book có tồn tại không
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }

    // Kiểm tra đã yêu thích chưa
    const existingFavorite = await this.prisma.interaction.findUnique({
      where: {
        userId_bookId_type: {
          userId,
          bookId,
          type: InteractionType.like,
        },
      },
    });

    if (existingFavorite) {
      // Đã yêu thích -> Xóa yêu thích
      return this.removeFavorite(userId, bookId, existingFavorite.id);
    } else {
      // Chưa yêu thích -> Thêm yêu thích
      return this.addFavorite(userId, bookId);
    }
  }

  /**
   * Thêm sách vào danh sách yêu thích
   */
  private async addFavorite(userId: string, bookId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Tạo interaction
      const interaction = await tx.interaction.create({
        data: {
          userId,
          bookId,
          type: InteractionType.like,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              availableCopies: true,
              likeCount: true,
            },
          },
        },
      });

      // Tăng likeCount của book
      await tx.book.update({
        where: { id: bookId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });

      // Tăng totalLikes của user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalLikes: {
            increment: 1,
          },
        },
      });

      // Tạo điểm thưởng cho like (ví dụ: 2 điểm)
      await tx.pointTransaction.create({
        data: {
          userId,
          delta: 2,
          reason: PointReason.like,
          refType: 'interaction_id',
          refId: interaction.id,
          note: 'Yêu thích sách',
        },
      });

      // Tạo activity
      await tx.activity.create({
        data: {
          userId,
          eventType: EventType.like,
          bookId,
          payload: {
            interactionId: interaction.id,
          },
        },
      });

      return interaction;
    });

    return {
      id: result.id,
      userId: result.userId,
      bookId: result.bookId,
      createdAt: result.createdAt,
      book: result.book,
      isFavorite: true,
    };
  }

  /**
   * Xóa sách khỏi danh sách yêu thích
   */
  private async removeFavorite(
    userId: string,
    bookId: string,
    interactionId: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Xóa interaction
      await tx.interaction.delete({
        where: { id: interactionId },
      });

      // Giảm likeCount của book
      await tx.book.update({
        where: { id: bookId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });

      // Giảm totalLikes của user
      await tx.user.update({
        where: { id: userId },
        data: {
          totalLikes: {
            decrement: 1,
          },
        },
      });

      // Lấy thông tin book để trả về
      const book = await tx.book.findUnique({
        where: { id: bookId },
        select: {
          id: true,
          title: true,
          author: true,
          coverImage: true,
          availableCopies: true,
          likeCount: true,
        },
      });

      return book;
    });

    return {
      bookId,
      book: result,
      isFavorite: false,
    };
  }

  /**
   * Lấy danh sách sách yêu thích của user
   */
  async getFavorites(userId: string, query: FavoritesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const whereInteraction: Prisma.InteractionWhereInput = {
      userId,
      type: InteractionType.like,
    };

    if (query.search) {
      whereInteraction.book = {
        OR: [
          {
            title: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            author: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    const [favorites, total] = await Promise.all([
      this.prisma.interaction.findMany({
        where: whereInteraction,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              description: true,
              availableCopies: true,
              likeCount: true,
              commentCount: true,
              borrowCount: true,
              categories: true,
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
        where: whereInteraction,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: favorites.map((fav) => ({
        id: fav.id,
        userId: fav.userId,
        bookId: fav.bookId,
        favoritedAt: fav.createdAt,
        book: fav.book,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Kiểm tra user đã yêu thích sách chưa
   */
  async checkFavorite(userId: string, bookId: string) {
    // Kiểm tra book có tồn tại không
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }

    const favorite = await this.prisma.interaction.findUnique({
      where: {
        userId_bookId_type: {
          userId,
          bookId,
          type: InteractionType.like,
        },
      },
    });

    return {
      bookId,
      isFavorite: !!favorite,
      favoriteId: favorite?.id || null,
    };
  }
}

