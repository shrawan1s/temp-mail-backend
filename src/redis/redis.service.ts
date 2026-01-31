import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LOG_MESSAGES, REDIS_PREFIXES } from '../common/constants';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAY_MS = 3000;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port');
    const username = this.configService.get<string>('redis.username');
    const password = this.configService.get<string>('redis.password');

    if (!host) {
      throw new Error('REDIS_HOST is required but not configured');
    }

    this.client = new Redis({
      host,
      port: port || 6379,
      username,
      password,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log(LOG_MESSAGES.REDIS_CONNECTED);
    });

    this.client.on('error', (error) => {
      this.logger.error(LOG_MESSAGES.REDIS_ERROR(error.message));
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn(LOG_MESSAGES.REDIS_CONNECTION_CLOSED);
    });

    this.client.on('reconnecting', () => {
      this.logger.log(LOG_MESSAGES.REDIS_RECONNECTING);
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.client.connect();
        await this.client.ping();
        this.isConnected = true;
        this.logger.log(LOG_MESSAGES.REDIS_CONNECTED_ATTEMPT(attempt));
        return;
      } catch (error) {
        this.logger.warn(
          LOG_MESSAGES.REDIS_CONNECTION_FAILED(
            attempt,
            this.MAX_RETRIES,
            (error as Error).message,
          ),
        );

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * attempt;
          this.logger.log(LOG_MESSAGES.REDIS_RETRY(delay));
          await this.sleep(delay);
        } else {
          this.logger.error(
            LOG_MESSAGES.REDIS_MAX_RETRIES_FAILED(this.MAX_RETRIES),
          );
          throw new Error(
            LOG_MESSAGES.REDIS_MAX_RETRIES_FAILED(this.MAX_RETRIES),
          );
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
      this.logger.log(LOG_MESSAGES.REDIS_DISCONNECTED);
    }
  }

  isAvailable(): boolean {
    return this.isConnected;
  }

  getClient(): Redis {
    return this.client;
  }

  // TOKEN BLACKLIST
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    await this.client.setex(
      `${REDIS_PREFIXES.BLACKLIST}${token}`,
      expiresInSeconds,
      '1',
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`${REDIS_PREFIXES.BLACKLIST}${token}`);
    return result === '1';
  }

  // SESSION MANAGEMENT
  async setSession(
    userId: string,
    sessionId: string,
    data: string,
    expiresInSeconds: number,
  ): Promise<void> {
    await this.client.setex(
      `${REDIS_PREFIXES.SESSION}${userId}:${sessionId}`,
      expiresInSeconds,
      data,
    );
  }

  async getSession(userId: string, sessionId: string): Promise<string | null> {
    return this.client.get(`${REDIS_PREFIXES.SESSION}${userId}:${sessionId}`);
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await this.client.del(`${REDIS_PREFIXES.SESSION}${userId}:${sessionId}`);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const keys = await this.client.keys(`${REDIS_PREFIXES.SESSION}${userId}:*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // RATE LIMITING
  async incrementRateLimit(
    key: string,
    windowSeconds: number,
  ): Promise<number> {
    const current = await this.client.incr(
      `${REDIS_PREFIXES.RATE_LIMIT}${key}`,
    );
    if (current === 1) {
      await this.client.expire(
        `${REDIS_PREFIXES.RATE_LIMIT}${key}`,
        windowSeconds,
      );
    }
    return current;
  }

  async getRateLimit(key: string): Promise<number> {
    const result = await this.client.get(`${REDIS_PREFIXES.RATE_LIMIT}${key}`);
    return result ? parseInt(result, 10) : 0;
  }
}
