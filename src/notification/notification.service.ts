import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { BorrowStatus, NotificationStatus } from '@prisma/client';

interface OverdueBorrow {
    id: string;
    userId: string;
    bookId: string;
    dueAt: Date;
    daysUntilDue: number;
    user: {
        id: string;
        fcmToken: string | null;
        displayName: string;
    };
    book: {
        id: string;
        title: string;
        author: string;
    };
}

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly BATCH_SIZE = 50; // Số lượng user xử lý mỗi đợt
    private readonly MAX_RETRY = 3; // Số lần retry tối đa

    constructor(
        private prisma: PrismaService,
        private firebaseAdmin: FirebaseAdminService,
    ) { }

    /**
     * Cron job chạy lúc 8:00 sáng hàng ngày
     */
    @Cron('28 14 * * *', {
        name: 'daily-overdue-reminder',
        timeZone: 'Asia/Ho_Chi_Minh',
    })
    async handleDailyOverdueReminder() {
        this.logger.log('🕐 Starting daily overdue reminder job at 8:00 AM');

        try {
            await this.sendOverdueReminders();
            this.logger.log('✅ Daily overdue reminder job completed successfully');
        } catch (error) {
            this.logger.error(
                `❌ Daily overdue reminder job failed: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Gửi thông báo nhắc hạn trả cho các khoản mượn sắp hết hạn
     */
    async sendOverdueReminders(): Promise<void> {
        if (!this.firebaseAdmin.isInitialized()) {
            this.logger.warn(
                'Firebase Admin SDK not initialized. Skipping notifications.',
            );
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tính các mốc thời gian: -3 ngày, -1 ngày, và đúng ngày (0)
        const threeDaysBefore = new Date(today);
        threeDaysBefore.setDate(threeDaysBefore.getDate() + 3);

        const oneDayBefore = new Date(today);
        oneDayBefore.setDate(oneDayBefore.getDate() + 1);

        const dueToday = new Date(today);
        dueToday.setDate(dueToday.getDate());

        // Tìm các khoản mượn sắp hết hạn ở các mốc: -3 ngày, -1 ngày, và đúng ngày
        const overdueBorrows = await this.prisma.borrow.findMany({
            where: {
                status: BorrowStatus.active,
                user: {
                    isPushEnabled: true,
                    fcmToken: {
                        not: null,
                    },
                },
                dueAt: {
                    gte: today,
                    lt: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // Trong vòng 4 ngày tới
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fcmToken: true,
                        displayName: true,
                    },
                },
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                    },
                },
            },
        });

        if (overdueBorrows.length === 0) {
            this.logger.log('No overdue borrows found. Skipping notifications.');
            return;
        }

        // Tính số ngày còn lại cho mỗi khoản mượn và lọc theo mốc
        const borrowsToNotify: OverdueBorrow[] = [];

        for (const borrow of overdueBorrows) {
            const dueDate = new Date(borrow.dueAt);
            dueDate.setHours(0, 0, 0, 0);

            const daysUntilDue = Math.ceil(
                (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            );

            // Chỉ gửi thông báo ở các mốc: -3 ngày, -1 ngày, và đúng ngày (0)
            if (daysUntilDue === 3 || daysUntilDue === 1 || daysUntilDue === 0) {
                borrowsToNotify.push({
                    ...borrow,
                    daysUntilDue,
                });
            }
        }

        if (borrowsToNotify.length === 0) {
            this.logger.log(
                'No borrows match notification criteria (-3, -1, 0 days).',
            );
            return;
        }

        this.logger.log(
            `Found ${borrowsToNotify.length} borrows to notify. Processing in batches of ${this.BATCH_SIZE}...`,
        );

        // Xử lý theo batch để tránh treo server
        for (let i = 0; i < borrowsToNotify.length; i += this.BATCH_SIZE) {
            const batch = borrowsToNotify.slice(i, i + this.BATCH_SIZE);
            await this.processBatch(batch);

            // Delay giữa các batch để tránh quá tải
            if (i + this.BATCH_SIZE < borrowsToNotify.length) {
                await this.delay(1000); // Delay 1 giây giữa các batch
            }
        }

        this.logger.log('✅ All notifications processed');
    }

    /**
     * Xử lý một batch các thông báo
     */
    private async processBatch(batch: OverdueBorrow[]): Promise<void> {
        const promises = batch.map((borrow) => this.sendNotificationForBorrow(borrow));
        await Promise.allSettled(promises);
    }

    /**
     * Gửi thông báo cho một khoản mượn cụ thể
     */
    private async sendNotificationForBorrow(
        borrow: OverdueBorrow,
    ): Promise<void> {
        if (!borrow.user.fcmToken) {
            this.logger.warn(
                `User ${borrow.user.id} has no FCM token. Skipping notification.`,
            );
            return;
        }

        const { title, body } = this.getNotificationContent(borrow);

        // Tạo log entry
        const logEntry = await this.prisma.notificationLog.create({
            data: {
                userId: borrow.user.id,
                borrowId: borrow.id,
                title,
                body,
                status: NotificationStatus.pending,
                fcmToken: borrow.user.fcmToken,
            },
        });

        // Gửi notification với retry mechanism
        let success = false;
        let errorMessage: string | undefined;
        let retryCount = 0;

        while (retryCount < this.MAX_RETRY && !success) {
            try {
                const result = await this.firebaseAdmin.sendNotification(
                    borrow.user.fcmToken,
                    title,
                    body,
                    {
                        borrowId: borrow.id,
                        bookId: borrow.book.id,
                        bookTitle: borrow.book.title,
                        daysUntilDue: borrow.daysUntilDue.toString(),
                    },
                );

                if (result.success) {
                    success = true;
                    await this.prisma.notificationLog.update({
                        where: { id: logEntry.id },
                        data: {
                            status: NotificationStatus.sent,
                            sentAt: new Date(),
                            retryCount,
                        },
                    });
                    this.logger.log(
                        `✅ Notification sent to user ${borrow.user.id} for borrow ${borrow.id}`,
                    );
                } else {
                    errorMessage = result.error;
                    retryCount++;

                    if (retryCount < this.MAX_RETRY) {
                        this.logger.warn(
                            `⚠️ Retry ${retryCount}/${this.MAX_RETRY} for user ${borrow.user.id}: ${errorMessage}`,
                        );
                        await this.delay(2000 * retryCount); // Exponential backoff
                    }
                }
            } catch (error: any) {
                errorMessage = error.message || 'Unknown error';
                retryCount++;

                if (retryCount < this.MAX_RETRY) {
                    this.logger.warn(
                        `⚠️ Retry ${retryCount}/${this.MAX_RETRY} for user ${borrow.user.id}: ${errorMessage}`,
                    );
                    await this.delay(2000 * retryCount);
                }
            }
        }

        // Nếu vẫn thất bại sau MAX_RETRY lần
        if (!success) {
            await this.prisma.notificationLog.update({
                where: { id: logEntry.id },
                data: {
                    status: NotificationStatus.failed,
                    errorMessage,
                    retryCount,
                },
            });
            this.logger.error(
                `❌ Failed to send notification to user ${borrow.user.id} after ${this.MAX_RETRY} retries: ${errorMessage}`,
            );
        }
    }

    /**
     * Tạo nội dung thông báo dựa trên số ngày còn lại
     */
    private getNotificationContent(borrow: OverdueBorrow): {
        title: string;
        body: string;
    } {
        const bookTitle = borrow.book.title;
        const daysLeft = borrow.daysUntilDue;

        if (daysLeft === 0) {
            return {
                title: '📚 Hạn trả sách hôm nay!',
                body: `Sách "${bookTitle}" của bạn hết hạn trả vào hôm nay. Vui lòng trả sách đúng hạn!`,
            };
        } else if (daysLeft === 1) {
            return {
                title: '📚 Nhắc nhở trả sách',
                body: `Sách "${bookTitle}" của bạn sẽ hết hạn vào ngày mai. Vui lòng chuẩn bị trả sách!`,
            };
        } else if (daysLeft === 3) {
            return {
                title: '📚 Nhắc nhở trả sách',
                body: `Sách "${bookTitle}" của bạn sẽ hết hạn sau 3 ngày nữa. Vui lòng chuẩn bị trả sách!`,
            };
        }

        // Fallback (không nên xảy ra)
        return {
            title: '📚 Nhắc nhở trả sách',
            body: `Sách "${bookTitle}" của bạn sắp hết hạn. Vui lòng trả sách đúng hạn!`,
        };
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Manual trigger để test (có thể gọi từ API)
     */
    async triggerManualReminder(): Promise<{ message: string; count: number }> {
        this.logger.log('🔄 Manual reminder trigger requested');
        await this.sendOverdueReminders();
        return {
            message: 'Manual reminder triggered successfully',
            count: 0, // Có thể tính số lượng notifications đã gửi
        };
    }

    /**
     * Cập nhật FCM token cho user
     */
    async updateFcmToken(
        userId: string,
        fcmToken: string,
        isPushEnabled?: boolean,
    ) {
        const updateData: any = {
            fcmToken,
        };

        if (isPushEnabled !== undefined) {
            updateData.isPushEnabled = isPushEnabled;
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                displayName: true,
                fcmToken: true,
                isPushEnabled: true,
            },
        });

        this.logger.log(
            `✅ FCM token updated for user ${userId}. Push enabled: ${updatedUser.isPushEnabled}`,
        );

        return {
            message: 'FCM token updated successfully',
            user: updatedUser,
        };
    }

    /**
     * Test gửi notification cho user hiện tại (for testing)
     */
    async testSendNotification(userId: string) {
        if (!this.firebaseAdmin.isInitialized()) {
            return {
                success: false,
                message: 'Firebase Admin SDK not initialized',
            };
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fcmToken: true,
                displayName: true,
                isPushEnabled: true,
            },
        });

        if (!user) {
            return {
                success: false,
                message: 'User not found',
            };
        }

        if (!user.fcmToken) {
            return {
                success: false,
                message: 'User does not have FCM token. Please update FCM token first.',
            };
        }

        if (!user.isPushEnabled) {
            return {
                success: false,
                message: 'Push notifications are disabled for this user',
            };
        }

        const title = '🧪 Test Notification';
        const body = `Xin chào ${user.displayName}! Đây là thông báo test từ hệ thống thư viện BK.`;

        const result = await this.firebaseAdmin.sendNotification(
            user.fcmToken,
            title,
            body,
            {
                type: 'test',
                userId: user.id,
            },
        );

        if (result.success) {
            // Log vào database
            await this.prisma.notificationLog.create({
                data: {
                    userId: user.id,
                    title,
                    body,
                    status: NotificationStatus.sent,
                    fcmToken: user.fcmToken,
                    sentAt: new Date(),
                },
            });

            return {
                success: true,
                message: 'Test notification sent successfully',
                messageId: result.messageId,
            };
        } else {
            // Log lỗi vào database
            await this.prisma.notificationLog.create({
                data: {
                    userId: user.id,
                    title,
                    body,
                    status: NotificationStatus.failed,
                    fcmToken: user.fcmToken,
                    errorMessage: result.error,
                },
            });

            return {
                success: false,
                message: 'Failed to send test notification',
                error: result.error,
            };
        }
    }
}
