import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { MailboxController } from './mailbox.controller';
import { MailboxService } from './mailbox.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MAILBOX_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'mailbox',
          protoPath: join(__dirname, '../../../../proto/mailbox.proto'),
          url: process.env.MAILBOX_SERVICE_URL,
        },
      },
    ]),
  ],
  controllers: [MailboxController],
  providers: [MailboxService],
  exports: [ClientsModule],
})
export class MailboxModule {}
