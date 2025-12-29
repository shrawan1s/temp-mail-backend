import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config';
import { PrismaModule } from './prisma';
import { PaymentModule } from './payment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    PaymentModule,
  ],
})
export class AppModule {}
