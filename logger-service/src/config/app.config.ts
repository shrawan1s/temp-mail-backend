import * as dotenv from 'dotenv';

// Load env file first
dotenv.config();

export const appConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: Number(process.env.PORT),
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    newRelicAppName: process.env.NEW_RELIC_APP_NAME,
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development',
};
