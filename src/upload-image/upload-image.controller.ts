import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UploadImageService } from './upload-image.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { memoryStorage } from 'multer';

@ApiTags('upload')
@ApiBearerAuth('JWT-auth')
@Controller('upload')
export class UploadImageController {
  constructor(private readonly uploadImageService: UploadImageService) {}

  /**
   * Upload avatar cho user
   * POST /upload/avatar
   */
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload avatar cho user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh avatar (jpg, jpeg, png, gif, webp, max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload thành công',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'File không hợp lệ hoặc quá lớn' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new Error('Không có file được upload');
    }
    return this.uploadImageService.uploadAvatar(file);
  }

  /**
   * Upload ảnh sách
   * POST /upload/book
   */
  @Post('book')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload ảnh sách' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh sách (jpg, jpeg, png, gif, webp, max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload thành công',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'File không hợp lệ hoặc quá lớn' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async uploadBookImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new Error('Không có file được upload');
    }
    return this.uploadImageService.uploadBookImage(file);
  }

  /**
   * Xóa ảnh khỏi Cloudinary
   * DELETE /upload/:publicId
   */
  @Delete(':publicId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa ảnh khỏi Cloudinary' })
  @ApiResponse({ status: 200, description: 'Xóa ảnh thành công' })
  @ApiResponse({ status: 400, description: 'Ảnh không tồn tại' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async deleteImage(@Param('publicId') publicId: string) {
    const result = await this.uploadImageService.deleteImage(publicId);
    return {
      message: 'Xóa ảnh thành công',
      publicId: publicId,
      result: result.result,
    };
  }
}
