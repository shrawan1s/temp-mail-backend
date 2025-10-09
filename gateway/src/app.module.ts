import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProxyModule } from './modules/proxy/proxy.module';
import { RedisModule } from './modules/redis/redis.module';
import { RateLimitMiddleware } from './common/middlewares/rate-limit.middleware';
import { AppController } from './app.controller';
import redisConfig from './config/redis.config';
import servicesConfig from './config/services.config';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [redisConfig, servicesConfig, appConfig] }),
    RedisModule,
    ProxyModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
