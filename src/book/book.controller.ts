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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Tạo sách mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo sách thành công',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách sách' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'author', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
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
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
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
  @ApiResponse({ status: 400, description: 'Không thể xóa sách đang được mượn' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async remove(@Param('id') id: string) {
    return this.bookService.remove(id);
  }
}

