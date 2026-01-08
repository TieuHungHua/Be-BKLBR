import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentStatsQueryDto {
  @ApiProperty({
    example: 12,
    description: 'Tháng (1-12)',
    required: false,
    default: new Date().getMonth() + 1,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tháng phải là số nguyên' })
  @Min(1, { message: 'Tháng phải từ 1 đến 12' })
  @Max(12, { message: 'Tháng phải từ 1 đến 12' })
  month?: number;

  @ApiProperty({
    example: 2024,
    description: 'Năm',
    required: false,
    default: new Date().getFullYear(),
    minimum: 2000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Năm phải là số nguyên' })
  @Min(2000, { message: 'Năm phải từ 2000 trở lên' })
  year?: number;
}
