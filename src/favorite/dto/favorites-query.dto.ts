import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

export class FavoritesQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Số trang',
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Số lượng mỗi trang',
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    example: 'Clean',
    description: 'Tìm kiếm theo tên sách hoặc tác giả',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

