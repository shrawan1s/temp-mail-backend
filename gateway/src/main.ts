import * as dotenv from 'dotenv';
dotenv.config();

import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { API_CONFIG, LOG_MESSAGES } from './common/constants';

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

  // API Prefix from constants
  app.setGlobalPrefix(API_CONFIG.PREFIX);

  await app.listen(port);
  logger.log(LOG_MESSAGES.GATEWAY_STARTED(port));
  logger.log(LOG_MESSAGES.API_AVAILABLE(port, API_CONFIG.PREFIX));
}

bootstrap();
