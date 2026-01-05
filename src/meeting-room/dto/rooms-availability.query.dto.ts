import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class RoomsAvailabilityQueryDto {
  @ApiProperty({
    example: '2024-01-01T08:00:00+07:00',
    description: 'Slot start time (ISO 8601)',
  })
  @IsDateString({}, { message: 'start_at must be a valid ISO date' })
  start_at: string;

  @ApiProperty({
    example: '2024-01-01T09:00:00+07:00',
    description: 'Slot end time (ISO 8601)',
  })
  @IsDateString({}, { message: 'end_at must be a valid ISO date' })
  end_at: string;

  @ApiProperty({
    example: 1,
    description: 'Page number (1-based)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Items per page',
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize must be an integer' })
  @Min(1, { message: 'pageSize must be at least 1' })
  @Max(100, { message: 'pageSize must be at most 100' })
  pageSize?: number = 20;

  @ApiProperty({
    example: 'name',
    description: 'Sort field (name, capacity, created_at)',
    required: false,
  })
  @IsOptional()
  sortBy?: string;

  @ApiProperty({
    example: 'asc',
    description: 'Sort direction',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  sortDir?: 'asc' | 'desc';
}
