import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) { }

    async onModuleInit(): Promise<void> {
        try {
            const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
            const port = this.configService.get<number>('SMTP_PORT') || 587;
            const secure = this.configService.get<boolean>('SMTP_SECURE') || false;
            const user = this.configService.get<string>('SMTP_USER') || 'leelinhleelinh@gmail.com';
            const pass = this.configService.get<string>('SMTP_PASS') || 'gwzc appw hvwv ctap';

            if (!user || !pass) {
                this.logger.warn(
                    'SMTP credentials not found. Email notifications will be disabled.',
                );
                return;
            }

            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass,
                },
            });

            // Verify connection
            await this.transporter.verify();
            this.logger.log('✅ Email service initialized successfully');
            this.logger.log(`📧 Email will be sent from: ${user}`);
        } catch (error: unknown) {
            const errorObj = error as { message?: string };
            this.logger.error(
                `Failed to initialize email service: ${errorObj?.message || 'Unknown error'}`,
            );
            // Không throw error để app vẫn chạy được nếu email service fail
        }
    }

    /**
     * Gửi email nhắc trả hạn
     */
    async sendOverdueReminderEmail(
        to: string,
        displayName: string,
        bookTitle: string,
        daysUntilDue: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _borrowId: string, // Reserved for future use (e.g., tracking, links)
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!this.transporter) {
            return {
                success: false,
                error: 'Email service not initialized',
            };
        }

        const { subject, html } = this.getEmailContent(
            displayName,
            bookTitle,
            daysUntilDue,
        );

        try {
            const smtpUser = this.configService.get<string>('SMTP_USER') || '';
            const info: SentMessageInfo = await this.transporter.sendMail({
                from: `"Thư Viện BK" <${smtpUser}>`,
                to,
                subject,
                html,
            });

            // Extract messageId from nodemailer response
            const messageId: string | undefined = typeof info.messageId === 'string'
                ? info.messageId
                : undefined;

            this.logger.log(`✅ Email sent successfully: ${messageId || 'N/A'}`);
            return {
                success: true,
                messageId,
            };
        } catch (error: unknown) {
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = String((error as { message: unknown }).message);
            }
            this.logger.error(`❌ Failed to send email: ${errorMessage}`);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Tạo nội dung email dựa trên số ngày còn lại
     */
    private getEmailContent(
        displayName: string,
        bookTitle: string,
        daysUntilDue: number,
    ): { subject: string; html: string } {
        let urgencyText = '';
        let urgencyColor = '#2196F3';

        if (daysUntilDue === 0) {
            urgencyText = 'HẠN TRẢ SÁCH HÔM NAY';
            urgencyColor = '#F44336';
        } else if (daysUntilDue === 1) {
            urgencyText = 'HẾT HẠN VÀO NGÀY MAI';
            urgencyColor = '#FF9800';
        } else if (daysUntilDue === 2) {
            urgencyText = 'CÒN 2 NGÀY NỮA';
            urgencyColor = '#FFC107';
        } else if (daysUntilDue === 3) {
            urgencyText = 'CÒN 3 NGÀY NỮA';
            urgencyColor = '#4CAF50';
        }

        const subject = `📚 Nhắc nhở trả sách - ${bookTitle}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .urgency-badge {
            display: inline-block;
            background: ${urgencyColor};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
        }
        .book-info {
            background: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid ${urgencyColor};
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            background: ${urgencyColor};
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Thư Viện BK</h1>
        <p>Hệ thống quản lý thư viện</p>
    </div>
    <div class="content">
        <h2>Xin chào ${displayName},</h2>
        
        <div class="urgency-badge">${urgencyText}</div>
        
        <p>Chúng tôi muốn nhắc nhở bạn về việc trả sách:</p>
        
        <div class="book-info">
            <h3>📖 ${bookTitle}</h3>
            <p><strong>Thời hạn trả:</strong> ${this.getDueDateText(daysUntilDue)}</p>
        </div>
        
        <p>Vui lòng chuẩn bị và trả sách đúng hạn để tránh bị phạt và ảnh hưởng đến điểm số của bạn.</p>
        
        <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với thư viện.</p>
        
        <p>Trân trọng,<br>
        <strong>Đội ngũ Thư Viện BK</strong></p>
    </div>
    <div class="footer">
        <p>Email này được gửi tự động từ hệ thống thư viện BK.</p>
        <p>Vui lòng không trả lời email này.</p>
    </div>
</body>
</html>
        `;

        return { subject, html };
    }

    /**
     * Tạo text mô tả ngày hết hạn
     */
    private getDueDateText(daysUntilDue: number): string {
        if (daysUntilDue === 0) {
            return 'Hôm nay';
        } else if (daysUntilDue === 1) {
            return 'Ngày mai';
        } else {
            return `Sau ${daysUntilDue} ngày nữa`;
        }
    }

    /**
     * Kiểm tra email service đã được khởi tạo chưa
     */
    isInitialized(): boolean {
        return !!this.transporter;
    }
}
