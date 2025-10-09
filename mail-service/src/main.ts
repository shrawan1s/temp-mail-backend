import * as dotenv from 'dotenv';
dotenv.config();

import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port: number = appConfig.port;
  await app.listen(port);
  console.log(`🚀 Logger service running on port ${port}`);
}
bootstrap();
