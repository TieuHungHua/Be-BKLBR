import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseAdminService.name);
    private app: admin.app.App;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        try {
            // Lấy Firebase config từ environment variables
            const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID') || "bk-library-e0771";
            const clientEmail = this.configService.get<string>(
                'FIREBASE_CLIENT_EMAIL',
            ) || "firebase-adminsdk-fbsvc@bk-library-e0771.iam.gserviceaccount.com";
            const privateKey = this.configService
                .get<string>('FIREBASE_PRIVATE_KEY')
                ?.replace(/\\n/g, '\n') || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCstvKRRh2GQTPe\ntRxaDVjRWcv9qa2bfbzJ7E8sQb+31dleauRL/5rZgXdFdmYpxFhM9m94Koe5riif\nSQEUiWorm9jH2fJ57WaIUiEobZXjDAX/2zwxC3kQo16vN/9ARDr9vu5E8HPv1cr8\nKIeYKqn5BHP1A2Vgfk7Zf3+c8l/xRS8L2FF3ae3Fgy8WwmW7P8EcqN0KxF6KC16E\nqw57EpYQvfaTHJrGvoMvjzt9N2+EsdKWgBwgoeCgFfdZsDV78NiGnf9YGwqpfNxL\neYOxvke0ashKixSG6W60YMVXT/So5zcaF6YyB2W6f9WhmAVPBN++tNSP/dOgHIgs\n75ogS7iTAgMBAAECggEAGikWfLf+E4PKHjBDPHChGgoGl+7Hg7HRPVSJzs5MAnBl\nyE4F3m0M62fCGnILRMWfX6juzBNvvh7fEEwNLysmkGG+vXwJpOY3OEFtvE3np3L+\nxaOow6pVNWv0FN41JMAw9JZNniuS+VTiC2eoLNLpg/UPYKFEYw/pVDsM/UdzuNDd\nn8f1yX3EtJ91KZA5qTQR3AxmdhzyoZKAlG7KVzk3VsqtN04kfAYtMpZ9nqM5zxHP\nK9zAKijNKSLkudAOhagHenPADqFkEy8ofatR8O6OynD4wUxOtx4AaFvhMCABQwdn\n2QQACTnYfvhjUk3HC/tER5TY7exSNPnKe5F5S7+04QKBgQDvS07bU3N4Ql9q9q4f\nB5OF+4DN1IpdJolZ9/1MIcO2ip6N8R9GHJ4+UC+CouxaaVWWxRsq6wcsnZpLu/Jc\n5xsA+A/bFzetQDphkxEXE0lKhFg+1Z0DKqs+9EiU5t+C2qLzMS58b0f35Oe8hFbv\n3R9HpOd2At1VcZAdX1CErC4r7wKBgQC4xbkCtJCwqZQXhKfGi25243HsauufJzNt\nAXfXCAg/fl5Mse01l8x5dm/7JznpnmnK4yOkutK8Ex/QJlXAo6iPuveAuTM0/k5i\nmEMpFFFN1JQoFleqUmPiobC3vvq1DeWhh9gvF99Cjm2BD5v21LILJmSDycAs/6WR\nJHIncKapnQKBgAKw5R0gTh8fF/Wa+pBMxILwNh2ac0fi5A6H9GhDxPCrlGbiPEjM\nj5cBzdb5QBEwOA8u/kQ4SmddClwpq+sRikMzhvIey7h+DWoFfl61D9DvthJW0qIz\ne6OEmcBa7E6LaOO1POGXWsbV4ylCj7u4z949Y4D3PUf1s/owlTY4vXgvAoGAOLSt\np+/ka+NPSLx0hRFrkF8TKnxR3aE5Ph3yOnMDnQDaTe1ZIFZ68Vfw3AJY2qK8UwDM\ngpS3cfLok4gAT0OqypmVtdKgrYXSZp3WFrhej2VLJtZchzAL6ZS32FxrMr+WFrHL\nHgDUiueNIcu5kNIL5jIdLPjw2p6GoHmv8vy2mV0CgYEAl3TwRdtImlc6AvROjQ4W\n4Igtf8Yo9LGs4r1wZQcCpqxcGBSfB87Jdi5wtAevughaDtUm0b76rKRY3xabJYGR\n4Hr4al8KkNmuP2FhLNDq50lRO1vAOVLpzgkIw//OcXBC1ECbEKd3Osdl0koWgERb\nk/6747fj6zFYTGaqkUb3CwE=\n-----END PRIVATE KEY-----\n";
            const databaseURL = this.configService.get<string>(
                'FIREBASE_DATABASE_URL',
            ) || "https://bk-library-e0771-default-rtdb.asia-southeast1.firebasedatabase.app";

            if (!projectId || !clientEmail || !privateKey) {
                this.logger.warn(
                    'Firebase Admin credentials not found. Push notifications will be disabled.',
                );
                return;
            }

            // Initialize Firebase Admin SDK
            if (admin.apps.length === 0) {
                this.app = admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                    databaseURL,
                });
                this.logger.log('✅ Firebase Admin SDK initialized successfully');
            } else {
                this.app = admin.app();
                this.logger.log('✅ Firebase Admin SDK already initialized');
            }
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin SDK:', error);
            throw error;
        }
    }

    /**
     * Gửi FCM notification đến một device token
     */
    async sendNotification(
        token: string,
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!this.app) {
            return {
                success: false,
                error: 'Firebase Admin SDK not initialized',
            };
        }

        try {
            const message: admin.messaging.Message = {
                token,
                notification: {
                    title,
                    body,
                },
                data: data || {},
                android: {
                    priority: 'high' as const,
                    notification: {
                        sound: 'default',
                        channelId: 'default',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().send(message);
            this.logger.log(`✅ Notification sent successfully: ${response}`);

            return {
                success: true,
                messageId: response,
            };
        } catch (error: any) {
            this.logger.error(`❌ Failed to send notification: ${error.message}`);

            // Xử lý các lỗi phổ biến
            let errorMessage = error.message || 'Unknown error';
            if (error.code === 'messaging/invalid-registration-token') {
                errorMessage = 'Invalid FCM token';
            } else if (error.code === 'messaging/registration-token-not-registered') {
                errorMessage = 'FCM token not registered';
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Gửi notification đến nhiều tokens (batch)
     */
    async sendMulticast(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<admin.messaging.BatchResponse> {
        if (!this.app) {
            throw new Error('Firebase Admin SDK not initialized');
        }

        const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                priority: 'high' as const,
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        return await admin.messaging().sendEachForMulticast(message);
    }

    /**
     * Kiểm tra Firebase Admin SDK đã được khởi tạo chưa
     */
    isInitialized(): boolean {
        return !!this.app;
    }
}
