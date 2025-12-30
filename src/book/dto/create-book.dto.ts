import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, Min, IsUrl } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateBookDto {
  @ApiProperty({ example: 'Clean Code', description: 'Tên sách' })
  @IsString()
  @IsNotEmpty({ message: 'Tên sách không được để trống' })
  title: string;

  @ApiProperty({ example: 'Robert C. Martin', description: 'Tác giả' })
  @IsString()
  @IsNotEmpty({ message: 'Tác giả không được để trống' })
  author: string;

  @ApiProperty({ 
    example: ['Programming', 'Software Engineering'], 
    description: 'Danh mục sách (có thể gửi dạng array hoặc string comma-separated)',
    type: [String],
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Nếu là string, split bằng comma
      return value.split(',').map((item: string) => item.trim()).filter(Boolean);
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({ 
    example: 'https://res.cloudinary.com/...', 
    description: 'URL ảnh bìa từ Cloudinary (nếu không upload file)',
    required: false,
  })
  @IsString()
  @IsUrl({}, { message: 'URL ảnh bìa không hợp lệ' })
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({ 
    example: 5, 
    description: 'Số lượng bản sao có sẵn',
    minimum: 0,
    default: 0,
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng bản sao phải là số nguyên' })
  @Min(0, { message: 'Số lượng bản sao không được âm' })
  @IsOptional()
  availableCopies?: number;
}



