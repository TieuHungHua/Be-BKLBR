import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-here', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'testuser', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'Test User', description: 'Tên hiển thị' })
  displayName: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email', nullable: true })
  email: string | null;

  @ApiProperty({ example: '0123456789', description: 'Số điện thoại', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'SV001', description: 'Mã sinh viên', nullable: true })
  studentId: string | null;

  @ApiProperty({ example: 'CNTT', description: 'Lớp/Chuyên ngành', nullable: true })
  classMajor: string | null;

  @ApiProperty({ 
    example: 'https://cloudinary.com/avatar.jpg', 
    description: 'URL avatar',
    nullable: true,
  })
  avatar: string | null;

  @ApiProperty({ 
    example: 'student', 
    description: 'Vai trò',
    enum: UserRole,
  })
  role: UserRole;

  @ApiProperty({ example: 10, description: 'Tổng số lượt mượn' })
  totalBorrowed: number;

  @ApiProperty({ example: 8, description: 'Tổng số lượt trả' })
  totalReturned: number;

  @ApiProperty({ example: 5, description: 'Tổng số lượt thích' })
  totalLikes: number;

  @ApiProperty({ example: 3, description: 'Tổng số bình luận' })
  totalComments: number;

  @ApiProperty({ example: 100, description: 'Điểm hoạt động' })
  activityScore: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Thời gian tạo' })
  createdAt: Date;
}






