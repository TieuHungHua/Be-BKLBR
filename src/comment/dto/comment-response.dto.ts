import { ApiProperty } from '@nestjs/swagger';

class CommentUserDto {
  @ApiProperty({ example: 'uuid-here', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'testuser', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'Test User', description: 'Tên hiển thị' })
  displayName: string;

  @ApiProperty({ example: 'https://cloudinary.com/avatar.jpg', description: 'URL avatar', nullable: true })
  avatar: string | null;
}

export class CommentResponseDto {
  @ApiProperty({ example: 'uuid-here', description: 'Comment ID' })
  id: string;

  @ApiProperty({ example: 'Sách rất hay và bổ ích!', description: 'Nội dung bình luận' })
  content: string;

  @ApiProperty({ type: CommentUserDto, description: 'Thông tin người bình luận' })
  user: CommentUserDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Thời gian tạo' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Thời gian cập nhật', nullable: true })
  updatedAt?: Date;
}

