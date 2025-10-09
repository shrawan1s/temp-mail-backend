import * as dotenv from 'dotenv';

// Load env file first
dotenv.config();

export const appConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: Number(process.env.PORT),
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    newRelicAppName: process.env.NEW_RELIC_APP_NAME,
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development',
};
