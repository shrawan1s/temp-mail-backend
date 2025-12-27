import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentController } from './payment.controller';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PAYMENT_PACKAGE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'payment',
            protoPath: join(__dirname, '../../proto/payment.proto'),
            url: configService.get('app.paymentServiceUrl'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
