import 'dotenv/config';
import 'newrelic';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LOG_MESSAGES, CORS_METHODS } from './constants';

async function bootstrap() {
  const logger = new Logger('PaymentService');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.httpPort', 5002);

  // Enable CORS for gateway communication
  app.enableCors({
    origin: '*',
    methods: CORS_METHODS,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-api-key'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(port);
  logger.log(LOG_MESSAGES.SERVICE_STARTED(port));
  logger.log(LOG_MESSAGES.HEALTH_ENDPOINT(port));
}

bootstrap();
