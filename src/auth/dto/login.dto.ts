import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../validators/password.validator';

export class LoginDto {
  @ApiProperty({ example: 'testuser', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @ApiProperty({ example: 'Password123!@#', description: 'Mật khẩu (ít nhất 1 chữ in hoa, 1 ký tự đặc biệt, 2 số, tối thiểu 6 ký tự)' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsStrongPassword({ message: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa, 1 ký tự đặc biệt và ít nhất 2 số' })
  password: string;
}

