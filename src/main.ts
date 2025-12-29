// Load .env file FIRST, before any other imports
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env') });

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
      'http://localhost:19006',  // Expo web default
      'http://localhost:19000',   // Expo web alternative
      'http://10.0.2.2:3000',     // Android emulator
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']

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
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
