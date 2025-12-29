import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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
      throw new BadRequestException('Mã sinh viên là bắt buộc cho tài khoản sinh viên');
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.displayName && { displayName: updateUserDto.displayName }),
        ...(updateUserDto.avatar !== undefined && { avatar: updateUserDto.avatar }),
        ...(updateUserDto.classMajor !== undefined && { classMajor: updateUserDto.classMajor }),
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
}

