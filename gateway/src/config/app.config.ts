import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  internalApiKey: process.env.INTERNAL_API_KEY || '',
  
  // Service Base URLs
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5002',
  
  // Redis
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisUsername: process.env.REDIS_USERNAME || '',
  redisPassword: process.env.REDIS_PASSWORD || '',

  // Rate Limiting
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));
