import { registerAs } from '@nestjs/config';
import Redis from 'ioredis';

export default registerAs('redis', () => {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is not set in environment variables');

    return {
        url,
    };
});

// Optional: Redis provider for injection
export const redisProvider = {
    provide: 'REDIS_CLIENT',
    useFactory: () => {
        const url = process.env.REDIS_URL;
        return new Redis(url!);
    },
};
