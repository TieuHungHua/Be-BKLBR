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

  @ApiProperty({ 
    example: 'Một cuốn sách về lập trình sạch và best practices trong phát triển phần mềm.', 
    description: 'Mô tả sách',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ 
    example: 'Scribner', 
    description: 'Nhà xuất bản',
    nullable: true,
  })
  publisher: string | null;

  @ApiProperty({ 
    example: 2014, 
    description: 'Năm xuất bản',
    nullable: true,
  })
  publicationYear: number | null;

  @ApiProperty({ 
    example: 531, 
    description: 'Số trang',
    nullable: true,
  })
  pages: number | null;

  @ApiProperty({ example: 5, description: 'Số lượng bản sao có sẵn' })
  availableCopies: number;

  @ApiProperty({ 
    example: 'có sẵn', 
    description: 'Trạng thái sách (có sẵn nếu availableCopies > 0, không có sẵn nếu = 0)',
    enum: ['có sẵn', 'không có sẵn'],
  })
  status: string;

  @ApiProperty({ example: 10, description: 'Số lượt thích' })
  likeCount: number;

  @ApiProperty({ example: 5, description: 'Số bình luận' })
  commentCount: number;

  @ApiProperty({ example: 20, description: 'Số lượt mượn' })
  borrowCount: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Thời gian tạo' })
  createdAt: Date;
}





