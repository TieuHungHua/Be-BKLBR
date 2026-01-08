// Load .env file FIRST, before any other imports
import { config } from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

// Thử load .env từ nhiều vị trí có thể
const possiblePaths = [
  join(process.cwd(), '.env'), // Từ thư mục hiện tại (khi chạy npm start từ backend/)
  join(__dirname, '..', '..', '.env'), // Từ dist/src lùi 2 cấp về backend/
  join(__dirname, '..', '.env'), // Từ dist/src lùi 1 cấp về dist/
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    console.log('✅ Loaded .env from:', envPath);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  Không tìm thấy file .env ở các vị trí sau:');
  possiblePaths.forEach((path) => console.warn('  -', path));
  console.warn('Đang thử load từ process.env (có thể đã được set từ hệ thống)');
  config(); // Load từ process.env nếu có
}

// Debug: Kiểm tra các biến môi trường Cloudinary
console.log('🔍 Checking Cloudinary env vars:');
console.log(
  '  CLOUDINARY_CLOUD_NAME:',
  process.env.CLOUDINARY_CLOUD_NAME ? '✅ Found' : '❌ Missing',
);
console.log(
  '  CLOUDINARY_API_KEY:',
  process.env.CLOUDINARY_API_KEY ? '✅ Found' : '❌ Missing',
);
console.log(
  '  CLOUDINARY_API_SECRET:',
  process.env.CLOUDINARY_API_SECRET ? '✅ Found' : '❌ Missing',
);

// Now import NestJS modules
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://localhost:19006', // Expo web default
      'http://localhost:19000', // Expo web alternative
      'http://10.0.2.2:3000', // Android emulator
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Library Management System API')
    .setDescription('API documentation for Library Management System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('upload', 'File upload endpoints')
    .addTag('comments', 'Book comments endpoints')
    .addTag('books', 'Book management endpoints')
    .addTag('borrows', 'Borrow management endpoints')
    .addTag('rewards', 'Reward management endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('rooms', 'Meeting room endpoints')
    .addTag('bookings', 'Meeting room booking endpoints')
    .addTag('admin-bookings', 'Admin booking endpoints')
    .addTag('notifications', 'Push notification endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
