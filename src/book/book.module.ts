import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadImageModule } from '../upload-image/upload-image.module';
import { FavoriteModule } from '../favorite/favorite.module';

@Module({
  imports: [PrismaModule, UploadImageModule, FavoriteModule],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
