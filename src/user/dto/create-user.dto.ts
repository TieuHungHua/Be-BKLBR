import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'newuser', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '0123456789', description: 'Số điện thoại', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Số điện thoại phải có 10-11 chữ số',
  })
  phone?: string;

  @ApiProperty({ example: 'New User', description: 'Tên hiển thị' })
  @IsString()
  @IsNotEmpty({ message: 'Tên hiển thị không được để trống' })
  displayName: string;

  @ApiProperty({ 
    example: 'https://res.cloudinary.com/...', 
    description: 'URL avatar',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ example: 'CNTT', description: 'Lớp/Chuyên ngành', required: false })
  @IsString()
  @IsOptional()
  classMajor?: string;

  @ApiProperty({ 
    example: 'SV001', 
    description: 'Mã sinh viên (bắt buộc nếu role là student)',
    required: false,
  })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: UserRole.student, 
    description: 'Vai trò',
    default: UserRole.student,
  })
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 'Password123!@#', description: 'Mật khẩu' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}





