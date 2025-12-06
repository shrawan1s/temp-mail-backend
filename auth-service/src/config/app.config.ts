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
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    brevoApiKey: process.env.BREVO_API_KEY,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
};
