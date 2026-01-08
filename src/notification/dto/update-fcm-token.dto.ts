import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFcmTokenDto {
  @ApiProperty({
    description: 'FCM token từ React Native app',
    example: 'fcm_token_example_123456',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @ApiProperty({
    description: 'Bật/tắt push notification',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPushEnabled?: boolean;
}
