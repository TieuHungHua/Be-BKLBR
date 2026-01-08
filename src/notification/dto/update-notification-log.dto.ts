import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationStatus } from '@prisma/client';

export class UpdateNotificationLogDto {
  @ApiProperty({
    example: '📚 Nhắc nhở trả sách',
    description: 'Tiêu đề thông báo',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Sách "Clean Code" của bạn sẽ hết hạn sau 3 ngày nữa.',
    description: 'Nội dung thông báo',
    required: false,
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.sent,
    description: 'Trạng thái thông báo',
    required: false,
  })
  @IsEnum(NotificationStatus, { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({
    example: 'Error message if failed',
    description: 'Thông báo lỗi (nếu có)',
    required: false,
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;
}
