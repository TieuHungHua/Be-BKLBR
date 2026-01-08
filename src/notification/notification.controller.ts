import {
    Controller,
    Put,
    Body,
    UseGuards,
    Request,
    Post,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser extends Request {
    user: {
        id: string;
        username: string;
        displayName: string;
        role: string;
    };
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Put('fcm-token')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cập nhật FCM token cho user' })
    @ApiResponse({
        status: 200,
        description: 'FCM token updated successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async updateFcmToken(
        @Request() req: RequestWithUser,
        @Body() updateFcmTokenDto: UpdateFcmTokenDto,
    ) {
        const userId = req.user.id;

        return this.notificationService.updateFcmToken(
            userId,
            updateFcmTokenDto.fcmToken,
            updateFcmTokenDto.isPushEnabled,
        );
    }

    @Post('trigger-reminder')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Trigger manual reminder (for testing - admin only)',
    })
    @ApiResponse({
        status: 200,
        description: 'Manual reminder triggered',
    })
    async triggerManualReminder() {
        // TODO: Thêm check admin role nếu cần
        return this.notificationService.triggerManualReminder();
    }

    @Post('test-send')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Test gửi notification với FCM token hiện tại của user (for testing)',
    })
    @ApiResponse({
        status: 200,
        description: 'Test notification sent',
    })
    async testSendNotification(@Request() req: RequestWithUser) {
        return this.notificationService.testSendNotification(req.user.id);
    }
}
