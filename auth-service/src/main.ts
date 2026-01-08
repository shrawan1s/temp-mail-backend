import 'dotenv/config';
import 'newrelic';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AuthService');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.httpPort', 3001);

  // Enable CORS for gateway communication
  app.enableCors({
    origin: '*',
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-api-key'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(port, '0.0.0.0');
  logger.log(`🔐 Auth Service running on http://0.0.0.0:${port}`);
  logger.log(`🩺 Health endpoint: http://0.0.0.0:${port}/health`);
}

bootstrap();
