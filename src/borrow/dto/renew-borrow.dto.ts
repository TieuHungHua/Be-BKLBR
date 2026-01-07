import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min, Max } from 'class-validator';

export class RenewBorrowDto {
  @ApiProperty({ 
    example: 7, 
    description: 'Số ngày gia hạn thêm (tối đa 30 ngày tính từ ngày hết hạn hiện tại)',
    minimum: 1,
    maximum: 30,
  })
  @IsInt({ message: 'Số ngày gia hạn phải là số nguyên' })
  @IsNotEmpty({ message: 'Số ngày gia hạn không được để trống' })
  @Min(1, { message: 'Số ngày gia hạn phải lớn hơn 0' })
  @Max(30, { message: 'Số ngày gia hạn không được vượt quá 30 ngày' })
  days: number;
}

