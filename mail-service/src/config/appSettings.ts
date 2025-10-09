import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load env file first
dotenv.config();

// Validate env variables
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3003'),
    NEW_RELIC_LICENSE_KEY: z.string(),
    NEW_RELIC_APP_NAME: z.string(),
});

const parsedEnv = envSchema.parse(process.env);

export const appSettings = {
    nodeEnv: parsedEnv.NODE_ENV,
    port: Number(parsedEnv.PORT),
    newRelicLicenseKey: parsedEnv.NEW_RELIC_LICENSE_KEY,
    newRelicAppName: parsedEnv.NEW_RELIC_APP_NAME,
    isProd: parsedEnv.NODE_ENV === 'production',
    isDev: parsedEnv.NODE_ENV === 'development',
};
