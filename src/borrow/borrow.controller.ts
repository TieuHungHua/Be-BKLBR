import {
  Controller,
  Get,
  Post,
  Body,
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
import { BorrowService } from './borrow.service';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { BorrowsQueryDto } from './dto/borrows-query.dto';
import { BorrowResponseDto } from './dto/borrow-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';

@ApiTags('borrows')
@ApiBearerAuth('JWT-auth')
@Controller('borrows')
@UseGuards(JwtAuthGuard)
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mượn sách' })
  @ApiResponse({
    status: 201,
    description: 'Mượn sách thành công',
    type: BorrowResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc sách không còn' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async create(
    @Body() createBorrowDto: CreateBorrowDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.borrowService.create(user.id, createBorrowDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách lịch sử mượn' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'returned', 'overdue'] })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/BorrowResponseDto' },
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
  async findAll(
    @Query() query: BorrowsQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.borrowService.findAll(query, user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin lịch sử mượn theo ID' })
  @ApiParam({ name: 'id', description: 'ID của lịch sử mượn' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: BorrowResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem' })
  @ApiResponse({ status: 404, description: 'Lịch sử mượn không tồn tại' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.borrowService.findOne(id, user.id);
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trả sách' })
  @ApiParam({ name: 'id', description: 'ID của lịch sử mượn' })
  @ApiResponse({
    status: 200,
    description: 'Trả sách thành công',
    type: BorrowResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Sách đã được trả rồi' })
  @ApiResponse({ status: 403, description: 'Không có quyền trả sách này' })
  @ApiResponse({ status: 404, description: 'Lịch sử mượn không tồn tại' })
  async returnBook(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.borrowService.returnBook(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa lịch sử mượn (chỉ khi đã trả)' })
  @ApiParam({ name: 'id', description: 'ID của lịch sử mượn' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    type: BorrowResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Chỉ có thể xóa lịch sử đã trả' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  @ApiResponse({ status: 404, description: 'Lịch sử mượn không tồn tại' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.borrowService.remove(id, user.id);
  }
}



