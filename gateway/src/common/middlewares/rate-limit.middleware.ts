import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
    private rateLimiter: RateLimiterRedis;

    constructor(
        @Inject('REDIS_CLIENT') private redisClient: Redis,
        private configService: ConfigService,
    ) {
        const appConfig = this.configService.get('app');

        if (!appConfig) {
            throw new Error('App configuration not found');
        }

        const points = appConfig.rateLimit.rateLimitPoints;
        const duration = appConfig.rateLimit.rateLimitDuration;
        const blockDuration = appConfig.rateLimit.rateLimitBlockDuration;

        this.rateLimiter = new RateLimiterRedis({
            storeClient: this.redisClient,
            keyPrefix: 'middleware',
            points,
            duration,
            blockDuration,
        });
    }

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            const key = req.ip || 'unknown-ip';
            await this.rateLimiter.consume(key);
            next();
        } catch {
            res.status(429).json({ message: 'Too many requests' });
        }
    }
}
