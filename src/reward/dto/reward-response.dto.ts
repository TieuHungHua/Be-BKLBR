import { ApiProperty } from '@nestjs/swagger';

export class RewardResponseDto {
  @ApiProperty({ example: 'uuid-here', description: 'Reward ID' })
  id: string;

  @ApiProperty({ example: 'Voucher 50k', description: 'Tên phần thưởng' })
  name: string;

  @ApiProperty({
    example: 'Voucher giảm giá 50.000đ',
    description: 'Mô tả phần thưởng',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: 100, description: 'Số điểm cần để đổi' })
  costPoints: number;

  @ApiProperty({ example: 10, description: 'Số lượng tồn kho' })
  stock: number;

  @ApiProperty({ example: true, description: 'Trạng thái hoạt động' })
  active: boolean;
}
