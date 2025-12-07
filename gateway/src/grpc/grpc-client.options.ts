import { ClientOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

// Proto file paths
const PROTO_PATH = join(__dirname, '../../proto');

export const authGrpcClientOptions: ClientOptions = {
    transport: Transport.GRPC,
    options: {
        package: 'auth',
        protoPath: join(PROTO_PATH, 'auth.proto'),
        url: process.env.AUTH_SERVICE_URL || 'localhost:50051',
    },
};

export const mailGrpcClientOptions: ClientOptions = {
    transport: Transport.GRPC,
    options: {
        package: 'mail',
        protoPath: join(PROTO_PATH, 'mail.proto'),
        url: process.env.MAIL_SERVICE_URL || 'localhost:50052',
    },
};

export const mailboxGrpcClientOptions: ClientOptions = {
    transport: Transport.GRPC,
    options: {
        package: 'mailbox',
        protoPath: join(PROTO_PATH, 'mailbox.proto'),
        url: process.env.MAILBOX_SERVICE_URL || 'localhost:50053',
    },
};

export const paymentGrpcClientOptions: ClientOptions = {
    transport: Transport.GRPC,
    options: {
        package: 'payment',
        protoPath: join(PROTO_PATH, 'payment.proto'),
        url: process.env.PAYMENT_SERVICE_URL || 'localhost:50054',
    },
};
