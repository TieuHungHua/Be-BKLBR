import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateBorrowDto {
  @ApiProperty({ example: 'uuid-book-id', description: 'ID của sách' })
  @IsString()
  @IsNotEmpty({ message: 'ID sách không được để trống' })
  bookId: string;

  @ApiProperty({ 
    example: '2024-02-01T00:00:00.000Z', 
    description: 'Ngày hết hạn (due date)',
  })
  @IsDateString({}, { message: 'Ngày hết hạn không hợp lệ' })
  @IsNotEmpty({ message: 'Ngày hết hạn không được để trống' })
  dueAt: string;
}





