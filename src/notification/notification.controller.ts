import {
    Controller,
    Put,
    Body,
    UseGuards,
    Request,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationLogService } from './notification-log.service';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { CreateNotificationLogDto } from './dto/create-notification-log.dto';
import { UpdateNotificationLogDto } from './dto/update-notification-log.dto';
import { NotificationLogsQueryDto } from './dto/notification-logs-query.dto';
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
    constructor(
        private readonly notificationService: NotificationService,
        private readonly notificationLogService: NotificationLogService,
    ) { }

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
        summary: 'Trigger manual reminder (for testing - includes email)',
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
        summary: 'Test tạo notification log (for testing)',
    })
    @ApiResponse({
        status: 200,
        description: 'Test notification log created',
    })
    async testSendNotification(@Request() req: RequestWithUser) {
        return this.notificationService.testSendNotification(req.user.id);
    }

    @Post('test-email')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Test gửi email nhắc trả hạn (for testing)',
    })
    @ApiResponse({
        status: 200,
        description: 'Test email sent',
    })
    async testSendEmail(@Request() req: RequestWithUser) {
        return this.notificationService.testSendEmail(req.user.id);
    }

    // ========== Notification Log CRUD ==========

    @Post('logs')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Tạo thông báo mới' })
    @ApiResponse({ status: 201, description: 'Thông báo đã được tạo' })
    async createNotificationLog(@Body() createDto: CreateNotificationLogDto) {
        return this.notificationLogService.create(createDto);
    }

    @Get('logs')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Lấy danh sách thông báo (có phân trang và filter)' })
    @ApiResponse({ status: 200, description: 'Danh sách thông báo' })
    async getNotificationLogs(
        @Query() query: NotificationLogsQueryDto,
        @Request() req: RequestWithUser,
    ) {
        // User chỉ xem được thông báo của chính mình (trừ admin)
        const userId = req.user.role === 'admin' ? undefined : req.user.id;
        return this.notificationLogService.findAll(query, userId);
    }

    @Get('logs/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Lấy chi tiết thông báo' })
    @ApiResponse({ status: 200, description: 'Chi tiết thông báo' })
    @ApiResponse({ status: 404, description: 'Thông báo không tồn tại' })
    async getNotificationLog(
        @Param('id') id: string,
        @Request() req: RequestWithUser,
    ) {
        // User chỉ xem được thông báo của chính mình (trừ admin)
        const userId = req.user.role === 'admin' ? undefined : req.user.id;
        return this.notificationLogService.findOne(id, userId);
    }

    @Patch('logs/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cập nhật thông báo' })
    @ApiResponse({ status: 200, description: 'Thông báo đã được cập nhật' })
    @ApiResponse({ status: 404, description: 'Thông báo không tồn tại' })
    async updateNotificationLog(
        @Param('id') id: string,
        @Body() updateDto: UpdateNotificationLogDto,
        @Request() req: RequestWithUser,
    ) {
        // User chỉ cập nhật được thông báo của chính mình (trừ admin)
        const userId = req.user.role === 'admin' ? undefined : req.user.id;
        return this.notificationLogService.update(id, updateDto, userId);
    }

    @Delete('logs/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Xóa thông báo' })
    @ApiResponse({ status: 200, description: 'Thông báo đã được xóa' })
    @ApiResponse({ status: 404, description: 'Thông báo không tồn tại' })
    async deleteNotificationLog(
        @Param('id') id: string,
        @Request() req: RequestWithUser,
    ) {
        // User chỉ xóa được thông báo của chính mình (trừ admin)
        const userId = req.user.role === 'admin' ? undefined : req.user.id;
        return this.notificationLogService.remove(id, userId);
    }
}
