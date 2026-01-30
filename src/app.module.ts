import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { JwtService } from '@nestjs/jwt';
import {
  appConfig,
  jwtConfig,
  redisConfig,
  oauthConfig,
  razorpayConfig,
  throttleConfig,
  emailConfig,
} from './config';
import { PrismaModule } from './prisma';
import { RedisModule, RedisService } from './redis';
import { GlobalExceptionFilter } from './common/filters';
import { JwtAuthGuard } from './common/guards';
import { AuthModule } from './modules/auth';
import { PaymentModule } from './modules/payment';
import { HealthModule } from './modules/health';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        jwtConfig,
        redisConfig,
        oauthConfig,
        razorpayConfig,
        throttleConfig,
        emailConfig,
      ],
    }),

    // Rate Limiting with Redis storage
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, RedisService],
      useFactory: (
        configService: ConfigService,
        redisService: RedisService,
      ) => ({
        throttlers: [
          {
            ttl: configService.get<number>('throttle.ttl', 60000),
            limit: configService.get<number>('throttle.limit', 100),
          },
        ],
        storage: new ThrottlerStorageRedisService(redisService.getClient()),
      }),
    }),

    // Core Modules
    PrismaModule,
    RedisModule,

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
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // JWT Service needed by JwtAuthGuard
    JwtService,
  ],
})
export class AppModule {}
