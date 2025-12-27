import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Service URLs (gRPC)
  authServiceUrl: process.env.AUTH_SERVICE_URL || '0.0.0.0:5001',
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || '0.0.0.0:5004',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Rate Limiting
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));
