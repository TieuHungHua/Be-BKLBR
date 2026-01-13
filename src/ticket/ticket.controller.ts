import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
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
import { TicketService } from './ticket.service';
import { TicketsQueryDto } from './dto/tickets-query.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách tickets (có phân trang và filter)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['book', 'room'],
    description: 'Phân loại: "book" (borrow_book, return_book) hoặc "room" (room_booking, room_cancellation)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['borrow_book', 'return_book', 'room_booking', 'room_cancellation'],
    description: 'Lọc theo loại ticket cụ thể (không dùng nếu đã có category)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
  })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Chỉ admin' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo mã số sinh viên' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async findAll(
    @Query() query: TicketsQueryDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.ticketService.findAll(
      query,
      currentUser.id,
      currentUser.role as UserRole,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết ticket theo ID' })
  @ApiParam({ name: 'id', description: 'ID của ticket' })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết thành công',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem' })
  @ApiResponse({ status: 404, description: 'Ticket không tồn tại' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.ticketService.findOne(id, currentUser.id, currentUser.role as UserRole);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin cập nhật trạng thái ticket (chỉ admin)' })
  @ApiParam({ name: 'id', description: 'ID của ticket' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới được phép' })
  @ApiResponse({ status: 404, description: 'Ticket không tồn tại' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTicketStatusDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.ticketService.updateStatus(
      id,
      updateDto,
      currentUser.id,
      currentUser.role as UserRole,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa ticket (user tạo hoặc admin)' })
  @ApiParam({ name: 'id', description: 'ID của ticket' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
  })
  @ApiResponse({ status: 400, description: 'Chỉ có thể xóa ticket pending' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  @ApiResponse({ status: 404, description: 'Ticket không tồn tại' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.ticketService.remove(id, currentUser.id, currentUser.role as UserRole);
  }
}
