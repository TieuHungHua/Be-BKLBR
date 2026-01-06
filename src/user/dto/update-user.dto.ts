import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsEmail } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Tên hiển thị',
    required: false,
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email',
    required: false,
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'SV001',
    description: 'Mã sinh viên (cho student) hoặc mã giảng viên (cho lecturer)',
    required: false,
  })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({
    example: 'CNTT',
    description: 'Ngành học',
    required: false,
  })
  @IsString()
  @IsOptional()
  classMajor?: string;

  @ApiProperty({
    example: '2000-01-15',
    description: 'Ngày sinh (format: YYYY-MM-DD)',
    required: false,
  })
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ (format: YYYY-MM-DD)' })
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    example: 'male',
    description: 'Giới tính',
    enum: ['male', 'female', 'other'],
    required: false,
  })
  @IsEnum(['male', 'female', 'other'], { message: 'Giới tính phải là: male, female hoặc other' })
  @IsOptional()
  gender?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.student,
    description: 'Vai trò',
    required: false,
  })
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  @IsOptional()
  role?: UserRole;
}
