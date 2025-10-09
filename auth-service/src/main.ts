import * as dotenv from 'dotenv';
dotenv.config();

import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSettings } from './config/appSettings';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port: number = appSettings.port;
  await app.listen(port);
  console.log(`🚀 Auth service running on port ${port}`);
}
bootstrap();
