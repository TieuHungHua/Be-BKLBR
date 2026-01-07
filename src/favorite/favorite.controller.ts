import {
  Controller,
  Post,
  Get,
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
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';
import { FavoritesQueryDto } from './dto/favorites-query.dto';

@ApiTags('Favorites')
@Controller('books')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get('favorites')
  @ApiOperation({ summary: 'Lấy danh sách sách yêu thích của user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo tên sách hoặc tác giả' })
  @ApiResponse({
    status: 200,
    description: 'Thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              bookId: { type: 'string' },
              createdAt: { type: 'string' },
              book: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  author: { type: 'string' },
                  coverImage: { type: 'string', nullable: true },
                  availableCopies: { type: 'number' },
                  likeCount: { type: 'number' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getFavorites(
    @Query() query: FavoritesQueryDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.favoriteService.getFavorites(currentUser.id, query);
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thêm/bỏ yêu thích sách' })
  @ApiParam({ name: 'id', description: 'ID của sách' })
  @ApiResponse({
    status: 200,
    description: 'Thành công',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'interaction-uuid-here' },
        userId: { type: 'string', example: 'user-uuid-here' },
        bookId: { type: 'string', example: 'book-uuid-here' },
        createdAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        book: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            author: { type: 'string' },
            coverImage: { type: 'string', nullable: true },
            availableCopies: { type: 'number' },
            likeCount: { type: 'number' },
          },
        },
        isFavorite: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async toggleFavorite(
    @Param('id') bookId: string,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.favoriteService.toggleFavorite(currentUser.id, bookId);
  }

  @Get(':id/favorite')
  @ApiOperation({ summary: 'Kiểm tra user đã yêu thích sách chưa' })
  @ApiParam({ name: 'id', description: 'ID của sách' })
  @ApiResponse({
    status: 200,
    description: 'Thành công',
    schema: {
      type: 'object',
      properties: {
        bookId: { type: 'string', example: 'book-uuid-here' },
        isFavorite: { type: 'boolean', example: true },
        favoriteId: { type: 'string', nullable: true, example: 'interaction-uuid-here' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Sách không tồn tại' })
  async checkFavorite(
    @Param('id') bookId: string,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.favoriteService.checkFavorite(currentUser.id, bookId);
  }
}






