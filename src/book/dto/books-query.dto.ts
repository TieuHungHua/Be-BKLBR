import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class BooksQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Số trang (bắt đầu từ 1)',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là số nguyên' })
  @Min(1, { message: 'Page phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Số lượng sách mỗi trang',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Limit không được vượt quá 100' })
  limit?: number = 10;

  @ApiProperty({
    example: 'Clean Code',
    description: 'Tìm kiếm theo tên sách',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 'Robert C. Martin',
    description: 'Lọc theo tác giả',
    required: false,
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({
    example: 'Programming',
    description: 'Lọc theo danh mục',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: 'createdAt',
    description: 'Trường để sắp xếp (createdAt, title, author)',
    required: false,
    enum: ['createdAt', 'title', 'author'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    example: 'desc',
    description: 'Thứ tự sắp xếp (asc: tăng dần, desc: giảm dần)',
    required: false,
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    example: 'available',
    description: 'Lọc sách có sẵn (chỉ lấy sách có availableCopies > 0 và user chưa mượn)',
    required: false,
    enum: ['available'],
  })
  @IsOptional()
  @IsString()
  status?: 'available';
}
