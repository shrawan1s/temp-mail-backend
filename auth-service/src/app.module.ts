import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, jwtConfig, redisConfig, oauthConfig } from './config';
import { PrismaModule } from './prisma';
import { RedisModule } from './redis';
import { AuthModule } from './auth';
import { UserModule } from './user';
import { TokenModule } from './token';
import { OAuthModule } from './oauth';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig, oauthConfig],
    }),

    // Core
    PrismaModule,
    RedisModule,

    // Features
    UserModule,
    TokenModule,
    OAuthModule,
    AuthModule,
  ],
})
export class AppModule {}
