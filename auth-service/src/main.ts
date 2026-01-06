import 'dotenv/config';
import 'newrelic';

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AuthService');

  // Create HTTP app for health checks (Render requires an HTTP port)
  const httpApp = await NestFactory.create(AppModule);
  const configService = httpApp.get(ConfigService);
  
  const httpPort = configService.get<number>('app.httpPort', 3001);
  const grpcUrl = configService.get<string>('app.grpcUrl');

  // Start HTTP server for health checks
  await httpApp.listen(httpPort, '0.0.0.0');
  logger.log(`🩺 Health endpoint available at http://0.0.0.0:${httpPort}/health`);

  // Connect gRPC microservice to the same app
  httpApp.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, 'proto/auth.proto'),
      url: grpcUrl,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  await httpApp.startAllMicroservices();
  logger.log(`🔐 Auth Service running on ${grpcUrl} (gRPC)`);
}

bootstrap();
