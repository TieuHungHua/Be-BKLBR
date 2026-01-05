import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({
    example: 'Schedule changed',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'reason must be a string' })
  @MaxLength(300, { message: 'reason must be at most 300 characters' })
  reason?: string;
}
