import * as dotenv from 'dotenv';
import { toNumber, toStringArray } from 'src/utils/functions';
dotenv.config();

export const appConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: toNumber(process.env.PORT, 3003),

    // New Relic (optional)
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
    newRelicAppName: process.env.NEW_RELIC_APP_NAME || 'logger-service',

    // environment helpers
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development',

    // service & logger
    serviceName: process.env.SERVICE_NAME || 'logger-service',
    logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

    // Resend / alerts
    resendApiKey: process.env.RESEND_API_KEY || '',
    alertFromEmail: process.env.ALERT_FROM_EMAIL || 'no-reply@example.com',
    // always expose as array for easier send logic
    alertToEmail: toStringArray(process.env.ALERT_TO_EMAIL || 'shrawanthakur0962@gmail.com'),

    // alerting thresholds
    errorThreshold: toNumber(process.env.ERROR_THRESHOLD, 5),
    errorTimeWindow: toNumber(process.env.ERROR_TIME_WINDOW, 60 * 1000),

    // optional: allowing other services to call this logger via HTTP
    loggerServiceUrl: process.env.LOGGER_SERVICE_URL || 'http://localhost:3003',
} as const;
