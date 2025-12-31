import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../validators/password.validator';

export enum RegisterRole {
  student = 'student',
  lecturer = 'lecturer',
  admin = 'admin',
}

export class RegisterDto {
  @ApiProperty({ example: 'newuser', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: '0123456789',
    description: 'Số điện thoại (10-11 chữ số)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Số điện thoại phải có 10-11 chữ số',
  })
  phone: string;

  @ApiProperty({
    enum: RegisterRole,
    example: RegisterRole.student,
    description: 'Loại tài khoản',
  })
  @IsEnum(RegisterRole, { message: 'Loại tài khoản không hợp lệ' })
  @IsNotEmpty({ message: 'Loại tài khoản không được để trống' })
  role: RegisterRole;

  @ApiProperty({
    example: 'SV001',
    description: 'Mã sinh viên (bắt buộc nếu role là student)',
    required: false,
  })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({
    example: 'Password123!@#',
    description:
      'Mật khẩu (ít nhất 1 chữ in hoa, 1 ký tự đặc biệt, 2 số, tối thiểu 6 ký tự)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsStrongPassword({
    message:
      'Mật khẩu phải chứa ít nhất 1 chữ in hoa, 1 ký tự đặc biệt và ít nhất 2 số',
  })
  password: string;

  @ApiProperty({
    example: 'Password123!@#',
    description: 'Xác nhận mật khẩu (phải khớp với password)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  confirmPassword: string;
}
