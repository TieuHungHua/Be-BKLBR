import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadImageService } from '../upload-image/upload-image.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private uploadImageService: UploadImageService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Kiểm tra username đã tồn tại chưa
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Tên đăng nhập đã tồn tại');
    }

    // Kiểm tra email đã tồn tại chưa
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    // Kiểm tra phone đã tồn tại chưa
    if (createUserDto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: createUserDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    // Kiểm tra nếu là student thì phải có studentId
    if (createUserDto.role === 'student' && !createUserDto.studentId) {
      throw new BadRequestException(
        'Mã sinh viên là bắt buộc cho tài khoản sinh viên',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        phone: createUserDto.phone || null,
        password: hashedPassword,
        displayName: createUserDto.displayName,
        avatar: createUserDto.avatar || null,
        classMajor: createUserDto.classMajor || null,
        studentId: createUserDto.studentId || null,
        role: createUserDto.role || 'student',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        studentId: true,
        classMajor: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        totalBorrowed: true,
        totalReturned: true,
        totalLikes: true,
        totalComments: true,
        activityScore: true,
        createdAt: true,
      },
    });
  }

  async findAll(query: UsersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.username = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          phone: true,
          studentId: true,
          classMajor: true,
          avatar: true,
          dateOfBirth: true,
          gender: true,
          role: true,
          totalBorrowed: true,
          totalReturned: true,
          totalLikes: true,
          totalComments: true,
          activityScore: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        studentId: true,
        classMajor: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        totalBorrowed: true,
        totalReturned: true,
        totalLikes: true,
        totalComments: true,
        activityScore: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    avatarFile?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Upload avatar nếu có file
    let avatarUrl: string | undefined;
    if (avatarFile) {
      const uploadResult = await this.uploadImageService.uploadAvatar(avatarFile);
      avatarUrl = uploadResult.secureUrl;

      // Xóa avatar cũ nếu có
      if (user.avatar) {
        try {
          // Extract publicId từ Cloudinary URL
          // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{filename}
          // PublicId format: {folder}/{filename without extension}
          const urlParts = user.avatar.split('/');
          const uploadIndex = urlParts.findIndex((part) => part === 'upload');
          if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
            // Lấy phần sau 'upload/v{version}/'
            const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
            // Loại bỏ extension
            const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
            await this.uploadImageService.deleteImage(publicId);
          }
        } catch (error) {
          // Ignore error nếu không xóa được avatar cũ
          console.warn('Không thể xóa avatar cũ:', error);
        }
      }
    }

    // Kiểm tra email đã tồn tại chưa (nếu có cập nhật email)
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email đã được sử dụng bởi người dùng khác');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.displayName && {
          displayName: updateUserDto.displayName,
        }),
        ...(updateUserDto.email !== undefined && {
          email: updateUserDto.email || null,
        }),
        ...(updateUserDto.studentId !== undefined && {
          studentId: updateUserDto.studentId,
        }),
        ...(avatarUrl && { avatar: avatarUrl }),
        ...(updateUserDto.classMajor !== undefined && {
          classMajor: updateUserDto.classMajor,
        }),
        ...(updateUserDto.dateOfBirth && {
          dateOfBirth: new Date(updateUserDto.dateOfBirth),
        }),
        ...(updateUserDto.gender !== undefined && {
          gender: updateUserDto.gender,
        }),
        ...(updateUserDto.role !== undefined && { role: updateUserDto.role }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        studentId: true,
        classMajor: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        totalBorrowed: true,
        totalReturned: true,
        totalLikes: true,
        totalComments: true,
        activityScore: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
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

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (user._count.borrows > 0) {
      throw new BadRequestException('Không thể xóa người dùng đang mượn sách');
    }

    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        studentId: true,
        classMajor: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        totalBorrowed: true,
        totalReturned: true,
        totalLikes: true,
        totalComments: true,
        activityScore: true,
        createdAt: true,
      },
    });
  }

  async getStudentStats(userId: string) {
    // Kiểm tra user có tồn tại không
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        activityScore: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Tính toán 5 tháng gần nhất (từ tháng hiện tại trở về trước)
    const monthlyStats: Array<{
      month: number;
      year: number;
      borrowCount: number;
      returnCount: number;
      overdueCount: number;
    }> = [];
    
    for (let i = 0; i < 5; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      
      // Xử lý khi tháng < 1 (lùi về năm trước)
      while (month < 1) {
        month += 12;
        year -= 1;
      }

      // Tính toán thời gian bắt đầu và kết thúc của tháng
      const startDate = new Date(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Đếm số lượng mượn trong tháng
      const borrowCount = await this.prisma.borrow.count({
        where: {
          userId,
          borrowedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Đếm số lượng trả trong tháng
      const returnCount = await this.prisma.borrow.count({
        where: {
          userId,
          returnedAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'returned',
        },
      });

      // Đếm số lượng quá hạn trong tháng (sách mượn trong tháng nhưng quá hạn)
      // Quá hạn = mượn trong tháng, chưa trả (returnedAt = null), và dueAt < thời gian hiện tại
      const overdueCount = await this.prisma.borrow.count({
        where: {
          userId,
          borrowedAt: {
            gte: startDate,
            lte: endDate,
          },
          returnedAt: null, // Chưa trả
          dueAt: {
            lt: now, // Đã quá hạn
          },
        },
      });

      monthlyStats.push({
        month,
        year,
        borrowCount,
        returnCount,
        overdueCount,
      });
    }

    // Lấy sách nổi bật (top 5 sách có borrowCount cao nhất)
    const popularBooks = await this.prisma.book.findMany({
      take: 5,
      orderBy: {
        borrowCount: 'desc',
      },
      select: {
        id: true,
        title: true,
        author: true,
        coverImage: true,
        borrowCount: true,
        likeCount: true,
        commentCount: true,
        availableCopies: true,
        categories: true,
      },
    });

    return {
      monthlyStats,
      activityScore: user.activityScore,
      popularBooks,
    };
  }
}
