import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateRewardDto {
  @ApiProperty({ example: 'Voucher 50k', description: 'Tên phần thưởng', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ 
    example: 'Voucher giảm giá 50.000đ', 
    description: 'Mô tả phần thưởng',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: 100, 
    description: 'Số điểm cần để đổi',
    minimum: 1,
    required: false,
  })
  @IsInt({ message: 'Số điểm phải là số nguyên' })
  @Min(1, { message: 'Số điểm phải lớn hơn 0' })
  @IsOptional()
  costPoints?: number;

  @ApiProperty({ 
    example: 10, 
    description: 'Số lượng tồn kho',
    minimum: 0,
    required: false,
  })
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  @IsOptional()
  stock?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Trạng thái hoạt động',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

