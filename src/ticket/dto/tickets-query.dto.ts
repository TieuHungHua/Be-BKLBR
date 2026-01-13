import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketType, TicketStatus } from '@prisma/client';

export class TicketsQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Số trang (bắt đầu từ 1)',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là số nguyên' })
  @Min(1, { message: 'Page phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Số lượng mỗi trang',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Limit không được vượt quá 100' })
  limit?: number = 10;

  @ApiProperty({
    example: 'borrow_book',
    description: 'Lọc theo loại ticket',
    enum: TicketType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketType, { message: 'Loại ticket không hợp lệ' })
  type?: TicketType;

  @ApiProperty({
    example: 'pending',
    description: 'Lọc theo trạng thái',
    enum: TicketStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketStatus, { message: 'Trạng thái không hợp lệ' })
  status?: TicketStatus;

  @ApiProperty({
    example: 'user-uuid',
    description: 'Lọc theo user ID (chỉ admin)',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
