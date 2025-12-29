import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';

@ApiTags('comments')
@ApiBearerAuth('JWT-auth')
@Controller('books/:bookId/comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm bình luận cho sách' })
  @ApiParam({ name: 'bookId', description: 'ID của sách' })
  @ApiResponse({
    status: 201,
    description: 'Thêm bình luận thành công',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc đã bình luận rồi' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async createComment(
    @Param('bookId') bookId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.commentService.createComment(user.id, bookId, createCommentDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách bình luận của sách' })
  @ApiParam({ name: 'bookId', description: 'ID của sách' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách bình luận thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CommentResponseDto' },
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
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async getComments(
    @Param('bookId') bookId: string,
    @Query() query: CommentsQueryDto,
  ) {
    return this.commentService.getComments(bookId, query);
  }

  @Put(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật bình luận' })
  @ApiParam({ name: 'bookId', description: 'ID của sách' })
  @ApiParam({ name: 'commentId', description: 'ID của bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật bình luận thành công',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền sửa bình luận này' })
  @ApiResponse({ status: 404, description: 'Bình luận không tồn tại' })
  async updateComment(
    @Param('bookId') bookId: string,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.commentService.updateComment(user.id, commentId, updateCommentDto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiParam({ name: 'bookId', description: 'ID của sách' })
  @ApiParam({ name: 'commentId', description: 'ID của bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Xóa bình luận thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Xóa bình luận thành công' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa bình luận này' })
  @ApiResponse({ status: 404, description: 'Bình luận không tồn tại' })
  async deleteComment(
    @Param('bookId') bookId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.commentService.deleteComment(user.id, commentId);
  }
}

