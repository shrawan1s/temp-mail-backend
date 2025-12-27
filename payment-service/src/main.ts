import 'dotenv/config';
import 'newrelic';

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'payment',
      protoPath: join(__dirname, 'proto/payment.proto'),
      url: configService.get<string>('app.grpcUrl'),
    },
  });

  await app.startAllMicroservices();

  const port = configService.get<number>('app.port', 5004);
  await app.listen(port);
  console.log(`🚀 Payment service running on port ${port} (HTTP) and ${configService.get('app.grpcUrl')} (gRPC)`);
}
bootstrap();
