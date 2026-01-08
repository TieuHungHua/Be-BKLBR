import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { BorrowStatus, NotificationStatus } from '@prisma/client';

interface OverdueBorrow {
    id: string;
    userId: string;
    bookId: string;
    dueAt: Date;
    daysUntilDue: number;
    user: {
        id: string;
        displayName: string;
        email: string | null;
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
    // Các mốc thời gian nhắc nhở: 0 (đúng ngày), 1 (1 ngày trước), 2 (2 ngày trước), 3 (3 ngày trước)
    private readonly REMINDER_DAYS = [0, 1, 2, 3];

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * Cron job chạy lúc 8:00 sáng hàng ngày
     */
    @Cron('21 19 * * *', {
        name: 'daily-overdue-reminder',
        timeZone: 'Asia/Ho_Chi_Minh',
    })
    async handleDailyOverdueReminder() {
        this.logger.log('🕐 Starting daily overdue reminder job at 8:00 AM');

        try {
            await this.sendOverdueReminders();
            this.logger.log('✅ Daily overdue reminder job completed successfully');
        } catch (error: unknown) {
            const errorObj = error as { message?: string; stack?: string };
            this.logger.error(
                `❌ Daily overdue reminder job failed: ${errorObj?.message || 'Unknown error'}`,
                errorObj?.stack,
            );
        }
    }

    /**
     * Tạo thông báo nhắc hạn trả cho các khoản mượn sắp hết hạn (chỉ lưu vào log)
     */
    async sendOverdueReminders(): Promise<void> {

        const now = new Date();
        const threeDaysLater = new Date(now);
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);

        // Tìm các khoản mượn sắp hết hạn trong vòng 3 ngày tới
        // Query tương đương SQL: due_at >= NOW() AND due_at < NOW() + INTERVAL '3 days'
        // Chỉ lấy user có email để gửi email
        const overdueBorrows = await this.prisma.borrow.findMany({
            where: {
                status: BorrowStatus.active,
                returnedAt: null, // Đảm bảo chưa trả (tương đương returned_at IS NULL)
                user: {
                    email: {
                        not: null, // Chỉ lấy user có email
                    },
                },
                dueAt: {
                    gte: now, // due_at >= NOW()
                    lt: threeDaysLater, // due_at < NOW() + INTERVAL '3 days'
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const borrow of overdueBorrows) {
            const dueDate = new Date(borrow.dueAt);
            dueDate.setHours(0, 0, 0, 0);

            const daysUntilDue = Math.ceil(
                (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            );

            // Chỉ gửi thông báo ở các mốc đã cấu hình
            if (this.REMINDER_DAYS.includes(daysUntilDue)) {
                borrowsToNotify.push({
                    ...borrow,
                    daysUntilDue,
                });
            }
        }

        if (borrowsToNotify.length === 0) {
            this.logger.log(
                `No borrows match notification criteria (${this.REMINDER_DAYS.join(', ')} days).`,
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
     * Tạo thông báo cho một khoản mượn cụ thể (lưu vào log và gửi email)
     */
    private async sendNotificationForBorrow(
        borrow: OverdueBorrow,
    ): Promise<void> {
        const { title, body } = this.getNotificationContent(borrow);

        // Tạo log entry
        const logEntry = await this.prisma.notificationLog.create({
            data: {
                userId: borrow.user.id,
                borrowId: borrow.id,
                title,
                body,
                status: NotificationStatus.pending,
            },
        });

        // Gửi email nếu user có email
        if (!borrow.user.email) {
            this.logger.warn(
                `User ${borrow.user.id} has no email. Skipping email notification.`,
            );
            return;
        }

        if (!this.emailService.isInitialized()) {
            this.logger.warn(
                'Email service not initialized. Skipping email notification.',
            );
            return;
        }

        try {
            this.logger.log(
                `📧 Attempting to send email to ${borrow.user.email} for borrow ${borrow.id}...`,
            );

            const emailResult = await this.emailService.sendOverdueReminderEmail(
                borrow.user.email,
                borrow.user.displayName,
                borrow.book.title,
                borrow.daysUntilDue,
                borrow.id,
            );

            if (emailResult.success) {
                // Cập nhật log status thành sent
                await this.prisma.notificationLog.update({
                    where: { id: logEntry.id },
                    data: {
                        status: NotificationStatus.sent,
                        sentAt: new Date(),
                    },
                });
                this.logger.log(
                    `✅ Email sent successfully to ${borrow.user.email} for user ${borrow.user.id} (borrow ${borrow.id})`,
                );
            } else {
                // Cập nhật log status thành failed
                await this.prisma.notificationLog.update({
                    where: { id: logEntry.id },
                    data: {
                        status: NotificationStatus.failed,
                        errorMessage: emailResult.error,
                    },
                });
                this.logger.error(
                    `❌ Failed to send email to ${borrow.user.email}: ${emailResult.error}`,
                );
            }
        } catch (error: unknown) {
            const errorObj = error as { message?: string };
            await this.prisma.notificationLog.update({
                where: { id: logEntry.id },
                data: {
                    status: NotificationStatus.failed,
                    errorMessage: errorObj?.message || 'Unknown error',
                },
            });
            this.logger.error(
                `❌ Error sending email to ${borrow.user.email}: ${errorObj?.message || 'Unknown error'}`,
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
        } else if (daysLeft === 2) {
            return {
                title: '📚 Nhắc nhở trả sách',
                body: `Sách "${bookTitle}" của bạn sẽ hết hạn sau 2 ngày nữa. Vui lòng chuẩn bị trả sách!`,
            };
        } else if (daysLeft === 3) {
            return {
                title: '📚 Nhắc nhở trả sách',
                body: `Sách "${bookTitle}" của bạn sẽ hết hạn sau 3 ngày nữa. Vui lòng chuẩn bị trả sách!`,
            };
        }

        // Fallback (không nên xảy ra nếu REMINDER_DAYS được cấu hình đúng)
        return {
            title: '📚 Nhắc nhở trả sách',
            body: `Sách "${bookTitle}" của bạn sắp hết hạn (còn ${daysLeft} ngày). Vui lòng trả sách đúng hạn!`,
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
        const updateData: {
            fcmToken: string;
            isPushEnabled?: boolean;
        } = {
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
     * Test tạo notification log cho user hiện tại (for testing)
     */
    async testSendNotification(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                displayName: true,
            },
        });

        if (!user) {
            return {
                success: false,
                message: 'User not found',
            };
        }

        const title = '🧪 Test Notification';
        const body = `Xin chào ${user.displayName}! Đây là thông báo test từ hệ thống thư viện BK.`;

        // Tạo log vào database
        const log = await this.prisma.notificationLog.create({
            data: {
                userId: user.id,
                title,
                body,
                status: NotificationStatus.pending,
            },
        });

        return {
            success: true,
            message: 'Test notification log created successfully',
            log,
        };
    }

    /**
     * Test gửi email nhắc trả hạn cho user hiện tại (for testing)
     */
    async testSendEmail(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                displayName: true,
                email: true,
            },
        });

        if (!user) {
            return {
                success: false,
                message: 'User not found',
            };
        }

        if (!user.email) {
            return {
                success: false,
                message: 'User does not have email address',
            };
        }

        if (!this.emailService.isInitialized()) {
            return {
                success: false,
                message: 'Email service not initialized. Please check SMTP configuration.',
            };
        }

        // Test gửi email với dữ liệu mẫu
        const result = await this.emailService.sendOverdueReminderEmail(
            user.email,
            user.displayName,
            'Sách Test - Clean Code',
            3, // 3 ngày nữa
            'test-borrow-id',
        );

        if (result.success) {
            return {
                success: true,
                message: `Test email sent successfully to ${user.email}`,
                messageId: result.messageId,
            };
        } else {
            return {
                success: false,
                message: 'Failed to send test email',
                error: result.error,
            };
        }
    }
}
