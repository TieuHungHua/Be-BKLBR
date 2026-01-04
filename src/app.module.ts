import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UploadImageModule } from './upload-image/upload-image.module';
import { CommentModule } from './comment/comment.module';
import { BookModule } from './book/book.module';
import { BorrowModule } from './borrow/borrow.module';
import { RewardModule } from './reward/reward.module';
import { UserModule } from './user/user.module';
import { MeetingBookingModule } from './meeting-booking/meeting-booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UploadImageModule,
    CommentModule,
    BookModule,
    BorrowModule,
    MeetingBookingModule,
    RewardModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
