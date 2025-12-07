import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.logger.log('Disconnected from Redis');
  }

  getClient(): Redis {
    return this.client;
  }

  // Token blacklist operations
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    await this.client.setex(`blacklist:${token}`, expiresInSeconds, '1');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`blacklist:${token}`);
    return result === '1';
  }

  // Session operations
  async setSession(userId: string, sessionId: string, data: string, expiresInSeconds: number): Promise<void> {
    await this.client.setex(`session:${userId}:${sessionId}`, expiresInSeconds, data);
  }

  async getSession(userId: string, sessionId: string): Promise<string | null> {
    return this.client.get(`session:${userId}:${sessionId}`);
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await this.client.del(`session:${userId}:${sessionId}`);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const keys = await this.client.keys(`session:${userId}:*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Rate limiting
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const current = await this.client.incr(`ratelimit:${key}`);
    if (current === 1) {
      await this.client.expire(`ratelimit:${key}`, windowSeconds);
    }
    return current;
  }

  async getRateLimit(key: string): Promise<number> {
    const result = await this.client.get(`ratelimit:${key}`);
    return result ? parseInt(result, 10) : 0;
  }
}
