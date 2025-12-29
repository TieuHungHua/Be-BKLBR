import { Module } from '@nestjs/common';
import { UploadImageService } from './upload-image.service';
import { UploadImageController } from './upload-image.controller';

@Module({
    controllers: [UploadImageController],
    providers: [UploadImageService],
    exports: [UploadImageService],
})
export class UploadImageModule { }

