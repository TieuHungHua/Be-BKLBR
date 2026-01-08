import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
  @ApiProperty({ example: 'interaction-uuid-here', description: 'ID của interaction' })
  id: string;

  @ApiProperty({ example: 'user-uuid-here', description: 'ID của user' })
  userId: string;

  @ApiProperty({ example: 'book-uuid-here', description: 'ID của sách' })
  bookId: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Thời gian yêu thích' })
  createdAt: Date;

  @ApiProperty({ description: 'Thông tin sách' })
  book?: {
    id: string;
    title: string;
    author: string;
    coverImage?: string;
    availableCopies: number;
    likeCount: number;
  };
}







