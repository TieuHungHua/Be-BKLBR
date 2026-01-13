import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketStatusDto {
  @ApiProperty({
    example: 'approved',
    description: 'Trạng thái mới (approved hoặc rejected)',
    enum: TicketStatus,
  })
  @IsEnum(TicketStatus, {
    message: 'Trạng thái phải là approved hoặc rejected',
  })
  status: TicketStatus;

  @ApiProperty({
    example: 'Đã duyệt yêu cầu',
    description: 'Ghi chú từ admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
