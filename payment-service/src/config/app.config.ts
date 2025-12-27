import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    port: parseInt(process.env.PORT || '5004', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    grpcUrl: process.env.PAYMENT_GRPC_URL || '0.0.0.0:5004',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
}));
