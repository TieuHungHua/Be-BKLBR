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
