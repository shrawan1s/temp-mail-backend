import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { credentials } from '@grpc/grpc-js';
import { appConfig, throttleConfig } from './config';
import { GlobalExceptionFilter } from './common/filters';
import { JwtAuthGuard } from './common/guards';
import { AuthModule } from './modules/auth/auth.module';
import { MailboxModule } from './modules/mailbox/mailbox.module';
import { PaymentModule } from './modules/payment/payment.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, throttleConfig],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ([{
        ttl: configService.get<number>('throttle.ttl', 60) * 1000,
        limit: configService.get<number>('throttle.limit', 100),
      }]),
    }),

    // Auth gRPC Client (for JWT Guard - used globally)
    ClientsModule.registerAsync([
      {
        name: 'AUTH_PACKAGE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: join(__dirname, '../../proto/auth.proto'),
            url: configService.get<string>('AUTH_SERVICE_URL'),
            credentials: credentials.createInsecure(),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
          },
        }),
      },
    ]),

    // Feature Modules
    AuthModule,
    MailboxModule,
    PaymentModule,
    HealthModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
