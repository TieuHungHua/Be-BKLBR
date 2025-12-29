import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, Min, IsUrl } from 'class-validator';

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
    default: 0,
  })
  @IsInt({ message: 'Số lượng bản sao phải là số nguyên' })
  @Min(0, { message: 'Số lượng bản sao không được âm' })
  @IsOptional()
  availableCopies?: number;
}

