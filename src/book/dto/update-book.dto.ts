import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  IsUrl,
} from 'class-validator';

export class UpdateBookDto {
  @ApiProperty({
    example: 'Clean Code',
    description: 'Tên sách',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Robert C. Martin',
    description: 'Tác giả',
    required: false,
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({
    example: ['Programming', 'Software Engineering'],
    description: 'Danh mục sách',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({
    example: 'https://res.cloudinary.com/...',
    description: 'URL ảnh bìa từ Cloudinary',
    required: false,
  })
  @IsString()
  @IsUrl({}, { message: 'URL ảnh bìa không hợp lệ' })
  @IsOptional()
  coverImage?: string;

  @ApiProperty({
    example: 5,
    description: 'Số lượng bản sao có sẵn',
    minimum: 0,
    required: false,
  })
  @IsInt({ message: 'Số lượng bản sao phải là số nguyên' })
  @Min(0, { message: 'Số lượng bản sao không được âm' })
  @IsOptional()
  availableCopies?: number;

  @ApiProperty({
    example:
      'Một cuốn sách về lập trình sạch và best practices trong phát triển phần mềm.',
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
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn 0' })
  @IsOptional()
  pages?: number;
}
