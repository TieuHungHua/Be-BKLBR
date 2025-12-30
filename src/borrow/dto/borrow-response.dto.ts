import { ApiProperty } from '@nestjs/swagger';

class BorrowUserDto {
  @ApiProperty({ example: 'uuid-here', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'testuser', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'Test User', description: 'Tên hiển thị' })
  displayName: string;
}

class BorrowBookDto {
  @ApiProperty({ example: 'uuid-here', description: 'Book ID' })
  id: string;

  @ApiProperty({ example: 'Clean Code', description: 'Tên sách' })
  title: string;

  @ApiProperty({ example: 'Robert C. Martin', description: 'Tác giả' })
  author: string;
}

export class BorrowResponseDto {
  @ApiProperty({ example: 'uuid-here', description: 'Borrow ID' })
  id: string;

  @ApiProperty({ type: BorrowUserDto, description: 'Thông tin người mượn' })
  user: BorrowUserDto;

  @ApiProperty({ type: BorrowBookDto, description: 'Thông tin sách' })
  book: BorrowBookDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Thời gian mượn' })
  borrowedAt: Date;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z', description: 'Ngày hết hạn' })
  dueAt: Date;

  @ApiProperty({ 
    example: '2024-01-10T00:00:00.000Z', 
    description: 'Thời gian trả',
    nullable: true,
  })
  returnedAt: Date | null;

  @ApiProperty({ 
    example: 'active', 
    description: 'Trạng thái (active, returned, overdue)',
    enum: ['active', 'returned', 'overdue'],
  })
  status: string;
}



