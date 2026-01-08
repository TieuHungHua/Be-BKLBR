import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo người dùng thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 409, description: 'Tài khoản đã tồn tại' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách người dùng' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: ['student', 'admin', 'lecturer'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() query: UsersQueryDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        displayName: {
          type: 'string',
          description: 'Tên hiển thị',
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Email',
        },
        studentId: {
          type: 'string',
          description: 'Mã sinh viên (cho student) hoặc mã giảng viên (cho lecturer)',
        },
        classMajor: {
          type: 'string',
          description: 'Ngành học',
        },
        dateOfBirth: {
          type: 'string',
          format: 'date',
          description: 'Ngày sinh (format: YYYY-MM-DD)',
        },
        gender: {
          type: 'string',
          enum: ['male', 'female', 'other'],
          description: 'Giới tính',
        },
        role: {
          type: 'string',
          enum: ['student', 'admin', 'lecturer'],
          description: 'Vai trò',
        },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh avatar (jpg, jpeg, png, gif, webp, max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file && !file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.userService.update(id, updateUserDto, avatar);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa người dùng' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Không thể xóa người dùng đang mượn sách' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Get('stats/student')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thống kê của sinh viên: số lượng mượn/trả/quá hạn trong 5 tháng gần nhất, activity score, top 5 sách nổi bật' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê thành công',
    schema: {
      type: 'object',
      properties: {
        monthlyStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'number', example: 12 },
              year: { type: 'number', example: 2024 },
              borrowCount: { type: 'number', example: 5 },
              returnCount: { type: 'number', example: 4 },
              overdueCount: { type: 'number', example: 1 },
            },
          },
        },
        activityScore: { type: 'number', example: 100 },
        popularBooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              author: { type: 'string' },
              coverImage: { type: 'string', nullable: true },
              borrowCount: { type: 'number' },
              likeCount: { type: 'number' },
              commentCount: { type: 'number' },
              availableCopies: { type: 'number' },
              categories: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  async getStudentStats(
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.userService.getStudentStats(currentUser.id);
  }
}









