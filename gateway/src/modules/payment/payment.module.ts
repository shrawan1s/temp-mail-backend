import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { credentials } from '@grpc/grpc-js';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_PACKAGE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const isProduction = configService.get('app.nodeEnv') === 'production';
          return {
            transport: Transport.GRPC,
            options: {
              package: 'payment',
              protoPath: join(__dirname, '../../proto/payment.proto'),
              url: configService.get('app.paymentServiceUrl'),
              // Use SSL for production (public URLs), insecure for local development
              credentials: isProduction
                ? credentials.createSsl()
                : credentials.createInsecure(),
              loader: {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
