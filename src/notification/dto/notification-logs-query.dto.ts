import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationStatus } from '@prisma/client';

export class NotificationLogsQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Số trang',
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn 0' })
  @IsOptional()
  page?: number;

  @ApiProperty({
    example: 10,
    description: 'Số lượng item mỗi trang',
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn 0' })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.sent,
    description: 'Lọc theo trạng thái',
    required: false,
  })
  @IsEnum(NotificationStatus, { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({
    example: 'user-uuid-123',
    description: 'Lọc theo user ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    example: 'borrow-uuid-456',
    description: 'Lọc theo borrow ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  borrowId?: string;
}
