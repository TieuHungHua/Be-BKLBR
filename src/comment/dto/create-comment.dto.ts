import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Sách rất hay và bổ ích!',
    description: 'Nội dung bình luận',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @MinLength(1, { message: 'Nội dung bình luận phải có ít nhất 1 ký tự' })
  @MaxLength(1000, { message: 'Nội dung bình luận không được vượt quá 1000 ký tự' })
  content: string;
}






