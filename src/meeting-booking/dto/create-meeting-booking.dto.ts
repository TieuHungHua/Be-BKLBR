import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMeetingBookingDto {
  @ApiProperty({ example: 'uuid-user-id', description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'Table A1',
    description: 'Meeting table name or code',
  })
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiProperty({
    example: '2024-02-01T09:00:00.000Z',
    description: 'Start time',
  })
  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @ApiProperty({
    example: '2024-02-01T10:00:00.000Z',
    description: 'End time',
  })
  @IsDateString()
  @IsNotEmpty()
  endAt: string;

  @ApiProperty({
    example: 'Weekly sync',
    description: 'Purpose',
    required: false,
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({
    example: 6,
    description: 'Number of attendees',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  attendees?: number;
}
