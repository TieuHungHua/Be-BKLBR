import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsStrongPassword({ message: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa, 1 ký tự đặc biệt và ít nhất 2 số' })
  password: string;
}

