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
import { UploadImageService } from './upload-image.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { memoryStorage } from 'multer';

@Controller('upload')
export class UploadImageController {
    constructor(private readonly uploadImageService: UploadImageService) { }

    /**
     * Upload avatar cho user
     * POST /upload/avatar
     */
    @Post('avatar')
    @UseGuards(JwtAuthGuard)
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
    async deleteImage(@Param('publicId') publicId: string) {
        const result = await this.uploadImageService.deleteImage(publicId);
        return {
            message: 'Xóa ảnh thành công',
            publicId: publicId,
            result: result.result,
        };
    }
}

