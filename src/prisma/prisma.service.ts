import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(private configService: ConfigService) {
        const databaseUrl = 'postgresql://neondb_owner:npg_sSDtRa5Jxi0b@ep-delicate-mouse-a40czuxz-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'


        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not defined in environment variables');
        }

        super({
            datasources: {
                db: {
                    url: databaseUrl,
                },
            },
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}

