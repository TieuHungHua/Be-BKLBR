import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-room-id', description: 'Meeting room ID' })
  @IsUUID('4', { message: 'room_id must be a valid UUID' })
  room_id: string;

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
    example: 'Weekly project sync',
    description: 'Purpose of the meeting',
  })
  @IsString({ message: 'purpose must be a string' })
  @IsNotEmpty({ message: 'purpose is required' })
  @MaxLength(500, { message: 'purpose must be at most 500 characters' })
  purpose: string;

  @ApiProperty({
    example: 4,
    description: 'Number of attendees',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'attendee_count must be an integer' })
  @Min(1, { message: 'attendee_count must be at least 1' })
  attendee_count: number;
}
