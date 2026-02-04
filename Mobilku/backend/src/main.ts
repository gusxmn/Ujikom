import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security middleware
  app.use(helmet());
  
  // Enable CORS - lebih permisif untuk development
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Serve static files
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('🚗 Online Shop Mobil API')
    .setDescription('API documentation for Online Shop Mobil System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`
  🚀 Application is running on: http://localhost:${port}
  📚 API Documentation: http://localhost:${port}/api-docs
  🔧 Health Check: http://localhost:${port}/health
  💾 Database: MySQL at ${process.env.DATABASE_URL?.split('@')[1] || 'localhost'}
  `);
}

bootstrap();