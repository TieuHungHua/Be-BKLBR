import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    example: 'New User',
    description: 'Tên hiển thị',
    required: false,
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/...',
    description: 'URL avatar',
    required: false,
  })
  @IsString()
  @IsUrl({}, { message: 'URL avatar không hợp lệ' })
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    example: 'CNTT',
    description: 'Lớp/Chuyên ngành',
    required: false,
  })
  @IsString()
  @IsOptional()
  classMajor?: string;

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
