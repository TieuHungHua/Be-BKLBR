import { ApiProperty } from '@nestjs/swagger';

class MeetingBookingUserDto {
  @ApiProperty({ example: 'uuid-user-id', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'jdoe', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  displayName: string;

  @ApiProperty({
    example: 'student',
    description: 'User role',
    enum: ['student', 'admin', 'lecturer'],
  })
  role: string;
}

export class MeetingBookingResponseDto {
  @ApiProperty({
    example: 'uuid-booking-id',
    description: 'Meeting booking ID',
  })
  id: string;

  @ApiProperty({ type: MeetingBookingUserDto, description: 'User info' })
  user: MeetingBookingUserDto;

  @ApiProperty({
    example: 'Table A1',
    description: 'Meeting table name or code',
  })
  tableName: string;

  @ApiProperty({
    example: '2024-02-01T09:00:00.000Z',
    description: 'Start time',
  })
  startAt: Date;

  @ApiProperty({
    example: '2024-02-01T10:00:00.000Z',
    description: 'End time',
  })
  endAt: Date;

  @ApiProperty({
    example: 'Weekly sync',
    description: 'Purpose',
    nullable: true,
  })
  purpose: string | null;

  @ApiProperty({
    example: 6,
    description: 'Number of attendees',
    nullable: true,
  })
  attendees: number | null;

  @ApiProperty({
    example: '2024-02-01T08:30:00.000Z',
    description: 'Created time',
  })
  createdAt: Date;
}
