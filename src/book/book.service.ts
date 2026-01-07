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
import { UploadImageService } from '../upload-image/upload-image.service';

@Injectable()
export class BookService {
  constructor(
    private prisma: PrismaService,
    private uploadImageService: UploadImageService,
  ) { }

  async create(
    createBookDto: CreateBookDto,
    coverImageFile?: Express.Multer.File,
  ) {
    let coverImageUrl: string | null = null;

    // Nếu có file ảnh, upload lên Cloudinary
    if (coverImageFile) {
      const uploadResult =
        await this.uploadImageService.uploadBookImage(coverImageFile);
      coverImageUrl = uploadResult.secureUrl;
    }
    // Nếu không có file nhưng có URL từ DTO, dùng URL đó
    else if (createBookDto.coverImageUrl) {
      coverImageUrl = createBookDto.coverImageUrl;
    }

    const book = await this.prisma.book.create({
      data: {
        title: createBookDto.title,
        author: createBookDto.author,
        categories: createBookDto.categories || [],
        coverImage: coverImageUrl,
        description: createBookDto.description || null,
        publisher: createBookDto.publisher || null,
        publicationYear: createBookDto.publicationYear || null,
        pages: createBookDto.pages || null,
        availableCopies: createBookDto.availableCopies || 0,
      },
    });

    // Thêm trường status
    return {
      ...book,
      status: book.availableCopies > 0 ? 'có sẵn' : 'không có sẵn',
    };
  }

  async findAll(query: BooksQueryDto, userId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {};

    if (query.search) {
      where.OR = [
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
      ];
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

    // Filter status = "available" - chỉ lấy sách có sẵn và user chưa mượn
    if (query.status === 'available') {
      where.availableCopies = {
        gt: 0,
      };

      // Nếu có userId, loại trừ sách mà user đã mượn
      if (userId) {
        where.NOT = {
          borrows: {
            some: {
              userId,
              status: 'active',
            },
          },
        };
      }
    }

    // Xử lý sort
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const orderBy: Prisma.BookOrderByWithRelationInput = {};
    if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'author') {
      orderBy.author = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.book.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Nếu có userId, thêm các fields isBorrowed, borrowDue, isFavorite
    let booksWithStatus = books;
    if (userId) {
      // Lấy tất cả borrows và favorites của user trong một lần query
      const [activeBorrows, favorites] = await Promise.all([
        this.prisma.borrow.findMany({
          where: {
            userId,
            bookId: { in: books.map((b) => b.id) },
            status: 'active',
          },
          select: {
            bookId: true,
            dueAt: true,
          },
        }),
        this.prisma.interaction.findMany({
          where: {
            userId,
            bookId: { in: books.map((b) => b.id) },
            type: 'like',
          },
          select: {
            bookId: true,
          },
        }),
      ]);

      // Tạo maps để lookup nhanh
      const borrowMap = new Map(
        activeBorrows.map((b) => [b.bookId, b.dueAt]),
      );
      const favoriteSet = new Set(favorites.map((f) => f.bookId));

      booksWithStatus = books.map((book) => ({
        ...book,
        status: book.availableCopies > 0 ? 'có sẵn' : 'không có sẵn',
        isBorrowed: borrowMap.has(book.id),
        borrowDue: borrowMap.get(book.id) || null,
        isFavorite: favoriteSet.has(book.id),
      }));
    } else {
      // Không có userId, chỉ thêm status
      booksWithStatus = books.map((book) => ({
        ...book,
        status: book.availableCopies > 0 ? 'có sẵn' : 'không có sẵn',
        isBorrowed: false,
        borrowDue: null,
        isFavorite: false,
      }));
    }

    return {
      data: booksWithStatus,
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

  async findOne(id: string, userId?: string) {
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

    // Nếu có userId, check các trạng thái của user với sách này
    let isBorrowed = false;
    let borrowDue: Date | null = null;
    let isFavorite = false;

    if (userId) {
      // Check isBorrowed và borrowDue
      const activeBorrow = await this.prisma.borrow.findFirst({
        where: {
          userId,
          bookId: id,
          status: 'active',
        },
        select: {
          dueAt: true,
        },
      });

      if (activeBorrow) {
        isBorrowed = true;
        borrowDue = activeBorrow.dueAt;
      }

      // Check isFavorite
      const favorite = await this.prisma.interaction.findUnique({
        where: {
          userId_bookId_type: {
            userId,
            bookId: id,
            type: 'like',
          },
        },
      });
      isFavorite = !!favorite;
    }

    // Thêm trường status
    return {
      ...book,
      status: book.availableCopies > 0 ? 'có sẵn' : 'không có sẵn',
      isBorrowed,
      borrowDue,
      isFavorite,
    };
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    // Kiểm tra sách có tồn tại không
    const existingBook = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      throw new NotFoundException('Sách không tồn tại');
    }

    const book = await this.prisma.book.update({
      where: { id },
      data: {
        ...(updateBookDto.title && { title: updateBookDto.title }),
        ...(updateBookDto.author && { author: updateBookDto.author }),
        ...(updateBookDto.categories !== undefined && {
          categories: updateBookDto.categories,
        }),
        ...(updateBookDto.coverImage !== undefined && {
          coverImage: updateBookDto.coverImage,
        }),
        ...(updateBookDto.description !== undefined && {
          description: updateBookDto.description,
        }),
        ...(updateBookDto.publisher !== undefined && {
          publisher: updateBookDto.publisher,
        }),
        ...(updateBookDto.publicationYear !== undefined && {
          publicationYear: updateBookDto.publicationYear,
        }),
        ...(updateBookDto.pages !== undefined && {
          pages: updateBookDto.pages,
        }),
        ...(updateBookDto.availableCopies !== undefined && {
          availableCopies: updateBookDto.availableCopies,
        }),
      },
    });

    // Thêm trường status
    return {
      ...book,
      status: book.availableCopies > 0 ? 'có sẵn' : 'không có sẵn',
    };
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
