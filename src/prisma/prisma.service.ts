import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(private configService: ConfigService) {
        // Ưu tiên lấy từ process.env (đã được load bởi dotenv trong main.ts)
        // Sau đó mới lấy từ ConfigService
        const databaseUrl = process.env.DATABASE_URL || configService.get<string>('DATABASE_URL') || "postgresql://neondb_owner:npg_sSDtRa5Jxi0b@ep-delicate-mouse-a40czuxz-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

        console.log('🔍 Checking DATABASE_URL...');
        console.log('process.env.DATABASE_URL:', databaseUrl ? '✅ Found' : '❌ Not found');
        console.log('configService.get:', configService.get<string>('DATABASE_URL') ? '✅ Found' : '❌ Not found');

        if (!databaseUrl) {
            console.error('❌ DATABASE_URL not found in environment variables');
            console.error('Please check your .env file in the backend directory');
            throw new Error('DATABASE_URL is not defined in environment variables');
        }

        super({
            datasources: {
                db: {
                    url: databaseUrl,
                },
            },
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
            ],
        });

        // Log tất cả các query được execute
        this.$on('query' as never, (e: any) => {
            console.log('📊 Query:', e.query);
            console.log('📋 Params:', e.params);
            console.log('⏱️  Duration:', e.duration, 'ms');
            console.log('---');
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            console.log('✅ Database connected successfully');
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            console.log('⚠️  Database connection will be retried on first query');
            // Không throw error để server vẫn có thể khởi động
            // Connection sẽ được retry khi có query đầu tiên
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}

