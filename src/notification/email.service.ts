import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
    private readonly logger = new Logger(EmailService.name);
    private transporter?: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit(): Promise<void> {
        try {
            const host =
                this.configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com';
            const port =
                Number(this.configService.get<string>('SMTP_PORT')) || 587;

            // ⚠️ env luôn là string → parse thủ công
            const secure =
                this.configService.get<string>('SMTP_SECURE') === 'true';

            const user = this.configService.get<string>('SMTP_USER');
            const pass = this.configService.get<string>('SMTP_PASS');

            if (!user || !pass) {
                this.logger.warn(
                    'SMTP credentials not found. Email service will be disabled.',
                );
                return;
            }

            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: { user, pass },
            });

            // verify có thể fail nhưng không làm app chết
            try {
                await this.transporter.verify();
                this.logger.log('✅ Email service initialized successfully');
                this.logger.log(`📧 Email will be sent from: ${user}`);
            } catch {
                this.logger.warn(
                    'SMTP verify failed, but email service will try to send anyway',
                );
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to initialize email service: ${message}`);
        }
    }

    /**
     * Gửi email nhắc trả / quá hạn
     */
    async sendOverdueReminderEmail(
        to: string,
        displayName: string,
        bookTitle: string,
        daysUntilDue: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _borrowId: string, // reserved for future use
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
            const smtpUser = this.configService.get<string>('SMTP_USER') ?? '';

            // Type assertion để tránh unsafe assignment
            const result = (await this.transporter.sendMail({
                from: `"Thư Viện BK" <${smtpUser}>`,
                to,
                subject,
                html,
            })) as { messageId?: string | number };

            // ✅ extract messageId an toàn (không unsafe-any, không base-to-string)
            let messageId: string | undefined;
            if (result && typeof result === 'object' && 'messageId' in result) {
                const msgId = result.messageId;
                if (typeof msgId === 'string') {
                    messageId = msgId;
                } else if (typeof msgId === 'number') {
                    messageId = String(msgId);
                }
            }

            this.logger.log(
                `✅ Email sent successfully: ${messageId || 'N/A'}`,
            );

            return {
                success: true,
                messageId,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(`❌ Failed to send email: ${errorMessage}`);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Tạo nội dung email
     */
    private getEmailContent(
        displayName: string,
        bookTitle: string,
        daysUntilDue: number,
    ): { subject: string; html: string } {
        let urgencyText = '';
        let urgencyColor = '#2196F3';

        if (daysUntilDue < 0) {
            urgencyText = `ĐÃ QUÁ HẠN ${Math.abs(daysUntilDue)} NGÀY`;
            urgencyColor = '#D32F2F';
        } else if (daysUntilDue === 0) {
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

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      <p><strong>Thời hạn trả:</strong> ${this.getDueDateText(
            daysUntilDue,
        )}</p>
    </div>

    <p>
      Vui lòng trả sách đúng hạn để tránh bị phạt và ảnh hưởng đến quyền
      mượn sách của bạn.
    </p>

    <p>
      Trân trọng,<br />
      <strong>Đội ngũ Thư Viện BK</strong>
    </p>
  </div>

  <div class="footer">
    <p>Email này được gửi tự động từ hệ thống thư viện BK.</p>
    <p>Vui lòng không trả lời email này.</p>
  </div>
</body>
</html>`;

        return { subject, html };
    }

    private getDueDateText(daysUntilDue: number): string {
        if (daysUntilDue < 0) {
            return `Quá hạn ${Math.abs(daysUntilDue)} ngày`;
        }
        if (daysUntilDue === 0) {
            return 'Hôm nay';
        }
        if (daysUntilDue === 1) {
            return 'Ngày mai';
        }
        return `Sau ${daysUntilDue} ngày nữa`;
    }

    isInitialized(): boolean {
        return Boolean(this.transporter);
    }
}