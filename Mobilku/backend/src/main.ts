import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as http from 'http';

// Middleware to skip auth for webhook endpoints
const webhookBypassMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip auth for webhook endpoints
  if (req.path.startsWith('/webhooks/')) {
    // Mark as public route
    (req as any).isPublic = true;
  }
  next();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Webhook bypass middleware (must be before CORS)
  app.use(webhookBypassMiddleware);
  
  // Enable CORS first - before helmet
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-callback-token'],
  });
  
  // Security middleware with CORS-friendly config
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  
  // Custom CORS middleware for static files
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // Serve static files
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter - catches all unhandled exceptions
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('🚗 Online Shop Mobil API')
    .setDescription('API documentation for Online Shop Mobil System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  const port = process.env.PORT || 3001;
  const httpServer = app.getHttpServer() as any;
  
  // Wait longer for OS to fully release the port
  await new Promise(r => setTimeout(r, 3000));
  
  // Try to listen with exponential backoff
  let lastError: any;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await app.listen(port);
      console.log(`
  🚀 Application is running on: http://localhost:${port}
  📚 API Documentation: http://localhost:${port}/api-docs
  🔧 Health Check: http://localhost:${port}/health
  💾 Database: MySQL at ${process.env.DATABASE_URL?.split('@')[1] || 'localhost'}
      `);
      return;
    } catch (err: any) {
      lastError = err;
      if (err.code === 'EADDRINUSE') {
        if (attempt < 5) {
          const delay = attempt * 2000; // 2s, 4s, 6s, 8s, 10s
          console.warn(`⚠️  Port ${port} in use. Waiting ${delay}ms before retry (attempt ${attempt}/5)...`);
          await new Promise(r => setTimeout(r, delay));
        }
      } else {
        throw err;
      }
    }
  }
  
  // All retries exhausted
  console.error(`❌ Failed to bind port ${port} after 5 attempts`);
  throw lastError;
}

bootstrap();