import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Gateway');
  
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // For Stripe/Razorpay webhooks
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 5000);
  const corsOrigin = configService.get<string>('app.corsOrigin');

  // CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API Prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(port);
  logger.log(`🚀 Gateway is running on http://localhost:${port}`);
  logger.log(`📚 API available at http://localhost:${port}/api/v1`);
}

bootstrap();
