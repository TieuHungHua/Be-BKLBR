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
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksQueryDto } from './dto/books-query.dto';
import { BookResponseDto } from './dto/book-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('books')
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo sách mới (có thể kèm file ảnh bìa)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Tên sách',
          example: 'Clean Code',
        },
        author: {
          type: 'string',
          description: 'Tác giả',
          example: 'Robert C. Martin',
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Danh mục sách',
          example: ['Programming', 'Software Engineering'],
        },
        coverImage: {
          type: 'string',
          format: 'binary',
          description:
            'File ảnh bìa sách (jpg, jpeg, png, gif, webp, max 10MB). Nếu không có file, có thể gửi URL ảnh trong coverImageUrl',
        },
        coverImageUrl: {
          type: 'string',
          description: 'URL ảnh bìa từ Cloudinary (nếu không upload file)',
          example: 'https://res.cloudinary.com/...',
        },
        availableCopies: {
          type: 'number',
          description: 'Số lượng bản sao có sẵn',
          example: 5,
        },
      },
      required: ['title', 'author'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo sách thành công',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @UseInterceptors(
    FileInterceptor('coverImage', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (!file) {
          // File không bắt buộc, cho phép không có file
          return cb(null, true);
        }
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() coverImageFile?: Express.Multer.File,
  ) {
    return this.bookService.create(createBookDto, coverImageFile);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách sách với phân trang và tìm kiếm' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng sách mỗi trang (mặc định: 10, tối đa: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên sách',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    type: String,
    description: 'Lọc theo tác giả',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Lọc theo danh mục',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    enum: ['createdAt', 'title', 'author'],
    description: 'Trường để sắp xếp (mặc định: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    enum: ['asc', 'desc'],
    description: 'Thứ tự sắp xếp (mặc định: desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách sách thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/BookResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async findAll(@Query() query: BooksQueryDto) {
    return this.bookService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin sách theo ID' })
  @ApiParam({ name: 'id', description: 'ID của sách' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin sách thành công',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async findOne(@Param('id') id: string) {
    return this.bookService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin sách' })
  @ApiParam({ name: 'id', description: 'ID của sách' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật sách thành công',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(id, updateBookDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa sách' })
  @ApiParam({ name: 'id', description: 'ID của sách' })
  @ApiResponse({
    status: 200,
    description: 'Xóa sách thành công',
    type: BookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa sách đang được mượn',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async remove(@Param('id') id: string) {
    return this.bookService.remove(id);
  }
}
