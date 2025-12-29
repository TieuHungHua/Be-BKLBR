import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/...', description: 'URL ảnh' })
  url: string;

  @ApiProperty({ example: 'library/avatars/abc123', description: 'Public ID trên Cloudinary' })
  publicId: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', description: 'Secure URL ảnh' })
  secureUrl: string;

  @ApiProperty({ example: 800, description: 'Chiều rộng ảnh (pixels)', required: false })
  width?: number;

  @ApiProperty({ example: 600, description: 'Chiều cao ảnh (pixels)', required: false })
  height?: number;

  @ApiProperty({ example: 'jpg', description: 'Định dạng ảnh', required: false })
  format?: string;

  @ApiProperty({ example: 123456, description: 'Kích thước file (bytes)', required: false })
  bytes?: number;
}


