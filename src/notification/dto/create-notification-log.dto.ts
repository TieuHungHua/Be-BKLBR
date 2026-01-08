import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { NotificationStatus } from '@prisma/client';

export class CreateNotificationLogDto {
  @ApiProperty({
    example: 'user-uuid-123',
    description: 'ID của user nhận thông báo',
  })
  @IsString()
  @IsNotEmpty({ message: 'User ID không được để trống' })
  userId: string;

  @ApiProperty({
    example: 'borrow-uuid-456',
    description: 'ID của khoản mượn (nếu có)',
    required: false,
  })
  @IsString()
  @IsOptional()
  borrowId?: string;

  @ApiProperty({
    example: '📚 Nhắc nhở trả sách',
    description: 'Tiêu đề thông báo',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @ApiProperty({
    example: 'Sách "Clean Code" của bạn sẽ hết hạn sau 3 ngày nữa.',
    description: 'Nội dung thông báo',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  body: string;

  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.pending,
    description: 'Trạng thái thông báo',
    default: NotificationStatus.pending,
    required: false,
  })
  @IsEnum(NotificationStatus, { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: NotificationStatus;
}
