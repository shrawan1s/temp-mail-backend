import 'dotenv/config';
import 'newrelic';

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('PaymentService');

  // Create app context first to get ConfigService
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);
  const grpcUrl = configService.get<string>('app.grpcUrl');
  await appContext.close();

  // Create gRPC-only microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'payment',
      protoPath: join(__dirname, 'proto/payment.proto'),
      url: grpcUrl,
    },
  });

  await app.listen();
  logger.log(`💳 Payment Service running on ${grpcUrl} (gRPC)`);
}

bootstrap();
