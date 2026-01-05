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
  @Transform(({ value }): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
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

  @ApiProperty({ 
    example: 'Một cuốn sách về lập trình sạch và best practices trong phát triển phần mềm.', 
    description: 'Mô tả sách',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: 'Scribner', 
    description: 'Nhà xuất bản',
    required: false,
  })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiProperty({ 
    example: 2014, 
    description: 'Năm xuất bản',
    minimum: 1000,
    maximum: 9999,
    required: false,
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsInt({ message: 'Năm xuất bản phải là số nguyên' })
  @Min(1000, { message: 'Năm xuất bản phải từ 1000 trở lên' })
  @IsOptional()
  publicationYear?: number;

  @ApiProperty({ 
    example: 531, 
    description: 'Số trang',
    minimum: 1,
    required: false,
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn 0' })
  @IsOptional()
  pages?: number;
}



