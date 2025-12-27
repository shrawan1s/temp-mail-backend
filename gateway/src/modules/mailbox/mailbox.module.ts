import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailboxController } from './mailbox.controller';
import { MailboxService } from './mailbox.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'MAILBOX_PACKAGE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'mailbox',
            protoPath: join(__dirname, '../../proto/mailbox.proto'),
            url: configService.get<string>('app.mailboxServiceUrl'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MailboxController],
  providers: [MailboxService],
  exports: [ClientsModule],
})
export class MailboxModule {}
