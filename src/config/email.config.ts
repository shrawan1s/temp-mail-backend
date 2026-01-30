import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  brevoApiKey: process.env.BREVO_API_KEY,
  senderEmail: process.env.SENDER_EMAIL,
  senderName: process.env.SENDER_NAME,
}));
