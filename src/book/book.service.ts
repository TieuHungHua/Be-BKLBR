import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksQueryDto } from './dto/books-query.dto';

@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        title: createBookDto.title,
        author: createBookDto.author,
        categories: createBookDto.categories || [],
        coverImage: createBookDto.coverImage || null,
        availableCopies: createBookDto.availableCopies || 0,
      },
    });
  }

  async findAll(query: BooksQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {};

    if (query.search) {
      where.title = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.author) {
      where.author = {
        contains: query.author,
        mode: 'insensitive',
      };
    }

    if (query.category) {
      where.categories = {
        has: query.category,
      };
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            borrows: true,
            comments: true,
            interactions: {
              where: {
                type: 'like',
              },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        ...(updateBookDto.title && { title: updateBookDto.title }),
        ...(updateBookDto.author && { author: updateBookDto.author }),
        ...(updateBookDto.categories !== undefined && { categories: updateBookDto.categories }),
        ...(updateBookDto.coverImage !== undefined && { coverImage: updateBookDto.coverImage }),
        ...(updateBookDto.availableCopies !== undefined && { availableCopies: updateBookDto.availableCopies }),
      },
    });
  }

  async remove(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            borrows: {
              where: {
                status: 'active',
              },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }

    if (book._count.borrows > 0) {
      throw new BadRequestException('Không thể xóa sách đang được mượn');
    }

    return this.prisma.book.delete({
      where: { id },
    });
  }
}

