import * as dotenv from 'dotenv';
dotenv.config();

import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { API_CONFIG, LOG_MESSAGES } from './common/constants';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Trust Proxy for Render (Load Balancer)
  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 5000);
  const corsOrigin = configService.get<string>('app.corsOrigin');

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

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

  app.setGlobalPrefix(API_CONFIG.PREFIX);

  await app.listen(port);
  logger.log(LOG_MESSAGES.SERVER_STARTED(port));
  logger.log(LOG_MESSAGES.API_AVAILABLE(port, API_CONFIG.PREFIX));
}

void bootstrap();
