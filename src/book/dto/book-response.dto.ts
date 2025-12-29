import { ApiProperty } from '@nestjs/swagger';

export class BookResponseDto {
  @ApiProperty({ example: 'uuid-here', description: 'Book ID' })
  id: string;

  @ApiProperty({ example: 'Clean Code', description: 'Tên sách' })
  title: string;

  @ApiProperty({ example: 'Robert C. Martin', description: 'Tác giả' })
  author: string;

  @ApiProperty({ 
    example: ['Programming', 'Software Engineering'], 
    description: 'Danh mục sách',
    type: [String],
  })
  categories: string[];

  @ApiProperty({ 
    example: 'https://res.cloudinary.com/...', 
    description: 'URL ảnh bìa',
    nullable: true,
  })
  coverImage: string | null;

  @ApiProperty({ example: 5, description: 'Số lượng bản sao có sẵn' })
  availableCopies: number;

  @ApiProperty({ example: 10, description: 'Số lượt thích' })
  likeCount: number;

  @ApiProperty({ example: 5, description: 'Số bình luận' })
  commentCount: number;

  @ApiProperty({ example: 20, description: 'Số lượt mượn' })
  borrowCount: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Thời gian tạo' })
  createdAt: Date;
}

