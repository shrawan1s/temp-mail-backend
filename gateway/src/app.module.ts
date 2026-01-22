import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { appConfig, throttleConfig } from './config';
import { GlobalExceptionFilter } from './common/filters';
import { JwtAuthGuard, ProxyAwareThrottlerGuard } from './common/guards';
import { RedisThrottlerStorage } from './common/storage/redis.storage';
import { AuthModule } from './modules/auth/auth.module';
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
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: configService.get<number>('throttle.ttl', 60) * 1000,
          limit: configService.get<number>('throttle.limit', 100),
        }],
        storage: new RedisThrottlerStorage(configService),
      }),
    }),

    // Feature Modules
    AuthModule,
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
    // Global Rate Limiting Guard (proxy-aware for Render)
    {
      provide: APP_GUARD,
      useClass: ProxyAwareThrottlerGuard,
    },
  ],
})
export class AppModule { }
