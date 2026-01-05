import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ example: 'Voucher 50k', description: 'Tên phần thưởng' })
  @IsString()
  @IsNotEmpty({ message: 'Tên phần thưởng không được để trống' })
  name: string;

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
  })
  @IsInt({ message: 'Số điểm phải là số nguyên' })
  @Min(1, { message: 'Số điểm phải lớn hơn 0' })
  @IsNotEmpty({ message: 'Số điểm không được để trống' })
  costPoints: number;

  @ApiProperty({ 
    example: 10, 
    description: 'Số lượng tồn kho',
    minimum: 0,
    default: 0,
  })
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  @IsOptional()
  stock?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Trạng thái hoạt động',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}







