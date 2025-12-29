import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export enum RegisterRole {
  student = 'student',
  lecturer = 'lecturer',
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Số điện thoại phải có 10-11 chữ số',
  })
  phone: string;

  @IsEnum(RegisterRole, { message: 'Loại tài khoản không hợp lệ' })
  @IsNotEmpty({ message: 'Loại tài khoản không được để trống' })
  role: RegisterRole;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsStrongPassword({
    message: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa, 1 ký tự đặc biệt và ít nhất 2 số',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  confirmPassword: string;
}

