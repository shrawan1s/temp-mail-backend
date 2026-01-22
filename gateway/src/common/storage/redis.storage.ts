import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      username: this.configService.get<string>('REDIS_USERNAME'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const totalHits = await this.redis.incr(key);

    if (totalHits === 1) {
      await this.redis.pexpire(key, ttl);
    }

    const timeToExpire = await this.redis.pttl(key);

    return {
      totalHits,
      timeToExpire: Math.ceil(timeToExpire / 1000),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
