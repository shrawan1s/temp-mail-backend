import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('grpc', () => ({
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'localhost:50051',
    package: 'auth',
    protoPath: join(__dirname, '../../../proto/auth.proto'),
  },
  mail: {
    url: process.env.MAIL_SERVICE_URL || 'localhost:50052',
    package: 'mail',
    protoPath: join(__dirname, '../../../proto/mail.proto'),
  },
  mailbox: {
    url: process.env.MAILBOX_SERVICE_URL || 'localhost:50053',
    package: 'mailbox',
    protoPath: join(__dirname, '../../../proto/mailbox.proto'),
  },
  payment: {
    url: process.env.PAYMENT_SERVICE_URL || 'localhost:50054',
    package: 'payment',
    protoPath: join(__dirname, '../../../proto/payment.proto'),
  },
}));
