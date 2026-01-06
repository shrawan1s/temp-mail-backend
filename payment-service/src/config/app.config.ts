import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  httpPort: parseInt(process.env.PORT || '3002', 10),
  grpcUrl: process.env.PAYMENT_GRPC_URL || '0.0.0.0:5002',
  internalApiKey: process.env.INTERNAL_API_KEY || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
}));
