import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  httpPort: parseInt(process.env.PORT || '3001', 10),
  grpcUrl: process.env.AUTH_GRPC_URL || '0.0.0.0:5001',
  internalApiKey: process.env.INTERNAL_API_KEY || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  
  // Brevo (Email)
  brevoApiKey: process.env.BREVO_API_KEY || '',
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@temp-email.com',
  senderName: process.env.SENDER_NAME || '',
  
  // OAuth - Google
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // OAuth - GitHub
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  
  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
