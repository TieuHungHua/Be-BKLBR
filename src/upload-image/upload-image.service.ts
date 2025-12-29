import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadOptions } from './interfaces/upload-options.interface';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadImageService {
  constructor() {
    // Cấu hình Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload ảnh lên Cloudinary
   * @param file File ảnh từ multer
   * @param folder Folder trên Cloudinary (ví dụ: 'library/avatars', 'library/books')
   * @param options Các tùy chọn upload
   * @returns UploadResponseDto với URL và thông tin ảnh
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'library',
    options?: UploadOptions,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    // Kiểm tra file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File phải là hình ảnh');
    }

    // Kiểm tra file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File không được vượt quá 10MB');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    // Store buffer in const to help TypeScript narrow the type
    const fileBuffer: Buffer = file.buffer;

    return new Promise<UploadResponseDto>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: options?.transformation || {
            quality: 'auto',
            fetch_format: 'auto',
          },
        },
        (
          error: Error | undefined,
          result:
            | {
                secure_url: string;
                public_id: string;
                width: number;
                height: number;
                format: string;
                bytes: number;
              }
            | undefined,
        ) => {
          if (error) {
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else if (!result) {
            reject(
              new BadRequestException('Upload failed: No result returned'),
            );
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              secureUrl: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
            });
          }
        },
      );

      // Upload file buffer
      try {
        const readStream = streamifier.createReadStream(fileBuffer);
        readStream.pipe(uploadStream);
      } catch (streamError: unknown) {
        const errorMessage =
          streamError &&
          typeof streamError === 'object' &&
          'message' in streamError &&
          typeof streamError.message === 'string'
            ? streamError.message
            : 'Failed to create read stream';
        reject(new BadRequestException(`Upload failed: ${errorMessage}`));
      }
    });
  }

  /**
   * Xóa ảnh khỏi Cloudinary
   * @param publicId Public ID của ảnh trên Cloudinary
   * @returns Kết quả xóa
   */
  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      })) as { result: string };

      if (result.result === 'not found') {
        throw new BadRequestException('Ảnh không tồn tại');
      }

      return { result: result.result };
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Unknown error';
      throw new BadRequestException(`Xóa ảnh thất bại: ${errorMessage}`);
    }
  }

  /**
   * Upload avatar cho user
   * @param file File ảnh
   * @returns UploadResponseDto
   */
  async uploadAvatar(file: Express.Multer.File): Promise<UploadResponseDto> {
    return this.uploadImage(file, 'library/avatars', {
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      },
    });
  }

  /**
   * Upload ảnh sách
   * @param file File ảnh
   * @returns UploadResponseDto
   */
  async uploadBookImage(file: Express.Multer.File): Promise<UploadResponseDto> {
    return this.uploadImage(file, 'library/books', {
      transformation: {
        width: 800,
        height: 1200,
        crop: 'limit',
        quality: 'auto',
        format: 'auto',
      },
    });
  }
}
