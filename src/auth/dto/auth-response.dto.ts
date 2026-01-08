import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ example: 'uuid-here', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'testuser', description: 'Tên đăng nhập' })
  username: string;

  @ApiProperty({ example: 'Test User', description: 'Tên hiển thị' })
  displayName: string;

  @ApiProperty({
    example: 'https://cloudinary.com/avatar.jpg',
    description: 'URL avatar',
    nullable: true,
  })
  avatar: string | null;

  @ApiProperty({
    example: 'student',
    description: 'Vai trò (student, lecturer, admin)',
  })
  role: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    example: 'SV001',
    description: 'Mã sinh viên',
    nullable: true,
  })
  studentId: string | null;

  @ApiProperty({
    example: 'CNTT',
    description: 'Lớp chuyên ngành',
    nullable: true,
  })
  classMajor: string | null;

  @ApiProperty({
    example: '2000-01-15T00:00:00.000Z',
    description: 'Ngày tháng năm sinh',
    nullable: true,
  })
  dateOfBirth: Date | null;

  @ApiProperty({
    example: 'male',
    description: 'Giới tính (male, female, other)',
    nullable: true,
  })
  gender: string | null;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token',
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token',
  })
  refresh_token: string;

  @ApiProperty({ type: UserDto, description: 'Thông tin user' })
  user: UserDto;
}
