import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
    const isProd = process.env.NODE_ENV === 'production';

    return {
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        isProd,
        isDev: !isProd,

        // Frontend Origin
        frontendUrl: isProd
            ? process.env.FRONTEND_URL || 'https://tempmail-pro.svinfocraft.com'
            : process.env.FRONTEND_URL || 'http://localhost:3000',

        // RateLimiting
        rateLimit: {
            rateLimitPoints: process.env.RATE_LIMIT_POINTS ? parseInt(process.env.RATE_LIMIT_POINTS) : 5,
            rateLimitDuration: process.env.RATE_LIMIT_DURATION ? parseInt(process.env.RATE_LIMIT_DURATION) : 60,
            rateLimitBlockDuration: process.env.RATE_LIMIT_BLOCK_DURATION
                ? parseInt(process.env.RATE_LIMIT_BLOCK_DURATION)
                : 60,
        },

        // Redis
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    };
});

import * as dotenv from 'dotenv';

// Load env file first
dotenv.config();

export const appSettings = {
    nodeEnv: process.env.NODE_ENV,
    port: Number(process.env.PORT),
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    newRelicAppName: process.env.NEW_RELIC_APP_NAME,
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development',
};
