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
