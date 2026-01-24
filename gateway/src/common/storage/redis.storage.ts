import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';
import { LOG_MESSAGES } from '../constants/messages';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
    private readonly redis: Redis;
    private readonly logger = new Logger(RedisThrottlerStorage.name);
    private isConnected = false;

    constructor(private readonly configService: ConfigService) {
        const redisHost = this.configService.get<string>('app.redisHost', 'localhost');
        const redisPort = this.configService.get<number>('app.redisPort', 6379);

        this.logger.log(LOG_MESSAGES.REDIS_CONNECTING(redisHost, redisPort));

        this.redis = new Redis({
            host: redisHost,
            port: redisPort,
            username: this.configService.get<string>('app.redisUsername'),
            password: this.configService.get<string>('app.redisPassword'),
            retryStrategy: (times) => {
                const delay = Math.min(times * 100, 3000);
                this.logger.warn(LOG_MESSAGES.REDIS_RETRY(times, delay));
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        // Connection event handlers for debugging
        this.redis.on('connect', () => {
            this.logger.log(LOG_MESSAGES.REDIS_CONNECTED);
            this.isConnected = true;
        });

        this.redis.on('ready', () => {
            this.logger.log(LOG_MESSAGES.REDIS_READY);
        });

        this.redis.on('error', (err) => {
            this.logger.error(LOG_MESSAGES.REDIS_ERROR(err.message));
            this.isConnected = false;
        });

        this.redis.on('close', () => {
            this.logger.warn(LOG_MESSAGES.REDIS_CLOSED);
            this.isConnected = false;
        });

        this.redis.on('reconnecting', () => {
            this.logger.log(LOG_MESSAGES.REDIS_RECONNECTING);
        });
    }

    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string,
    ): Promise<ThrottlerStorageRecord> {
        try {
            const totalHits = await this.redis.incr(key);

            if (totalHits === 1) {
                await this.redis.pexpire(key, ttl);
                this.logger.log(LOG_MESSAGES.RATE_LIMIT_KEY_CREATED(key, ttl, limit));
            }

            const timeToExpire = await this.redis.pttl(key);

            // Log when approaching or exceeding limit
            if (totalHits >= limit - 5) {
                this.logger.warn(LOG_MESSAGES.RATE_LIMIT_WARNING(key, totalHits, limit, timeToExpire));
            }

            return {
                totalHits,
                timeToExpire: timeToExpire,
                isBlocked: false,
                timeToBlockExpire: 0,
            };
        } catch (error) {
            this.logger.error(LOG_MESSAGES.REDIS_INCREMENT_ERROR(key, error.message));
            // Return a value that won't trigger rate limiting on Redis errors
            return {
                totalHits: 1,
                timeToExpire: ttl,
                isBlocked: false,
                timeToBlockExpire: 0,
            };
        }
    }

    onModuleDestroy() {
        this.redis.disconnect();
    }
}
