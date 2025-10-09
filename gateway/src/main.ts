import * as dotenv from 'dotenv';
dotenv.config();

import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appConfig = configService.get('app');

  if (!appConfig) {
    throw new Error('App configuration not found');
  }

  const isProd: boolean = appConfig.isProd;
  const frontendOrigin: string = appConfig.frontendUrl;

  // 🛡 Helmet with CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", frontendOrigin],
          styleSrc: ["'self'", "'unsafe-inline'", frontendOrigin],
          imgSrc: ["'self'", 'data:', frontendOrigin],
          connectSrc: ["'self'", frontendOrigin],
          fontSrc: ["'self'", 'https:', 'data:'],
        },
      },
      crossOriginEmbedderPolicy: isProd, // disable in dev for local debugging
    }),
  );

  // 🍪 Core middlewares
  app.use(compression());
  app.use(cookieParser());

  // 🧹 Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips extra fields
      transform: true, // converts payloads to DTOs
      forbidNonWhitelisted: true, // throws on unknown fields
    }),
  );

  // 🚨 Global error filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 🌐 Enable strict CORS
  app.enableCors({
    origin: [frontendOrigin],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 🚀 Start gateway
  const port: number = appConfig.port;
  await app.listen(port);
  console.log(`🚀 API Gateway running on port ${port}`);
}
bootstrap();
