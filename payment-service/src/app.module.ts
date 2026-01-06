import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config';
import { PrismaModule } from './prisma';
import { PaymentModule } from './payment';
import { HealthModule } from './health';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    PaymentModule,
    HealthModule,
  ],
})
export class AppModule {}
