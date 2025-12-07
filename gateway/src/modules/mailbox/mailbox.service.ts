import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
    MailboxServiceClient,
    CreateMailboxRequest,
    MailboxResponse,
    GetMailboxRequest,
    ListMailboxesRequest,
    ListMailboxesResponse,
    DeleteMailboxRequest,
    DeleteMailboxResponse,
    ListEmailsRequest,
    ListEmailsResponse,
    GetEmailRequest,
    EmailResponse,
    DeleteEmailRequest,
    DeleteEmailResponse,
    MarkEmailReadRequest,
    ExtendExpiryRequest,
} from '../../grpc/interfaces';

@Injectable()
export class MailboxService implements OnModuleInit {
    private mailboxService: MailboxServiceClient;

    constructor(@Inject('MAILBOX_PACKAGE') private client: ClientGrpc) { }

    onModuleInit() {
        this.mailboxService = this.client.getService<MailboxServiceClient>('MailboxService');
    }

    async createMailbox(data: CreateMailboxRequest): Promise<MailboxResponse> {
        return firstValueFrom(this.mailboxService.createMailbox(data));
    }

    async getMailbox(data: GetMailboxRequest): Promise<MailboxResponse> {
        return firstValueFrom(this.mailboxService.getMailbox(data));
    }

    async listMailboxes(data: ListMailboxesRequest): Promise<ListMailboxesResponse> {
        return firstValueFrom(this.mailboxService.listMailboxes(data));
    }

    async deleteMailbox(data: DeleteMailboxRequest): Promise<DeleteMailboxResponse> {
        return firstValueFrom(this.mailboxService.deleteMailbox(data));
    }

    async listEmails(data: ListEmailsRequest): Promise<ListEmailsResponse> {
        return firstValueFrom(this.mailboxService.listEmails(data));
    }

    async getEmail(data: GetEmailRequest): Promise<EmailResponse> {
        return firstValueFrom(this.mailboxService.getEmail(data));
    }

    async deleteEmail(data: DeleteEmailRequest): Promise<DeleteEmailResponse> {
        return firstValueFrom(this.mailboxService.deleteEmail(data));
    }

    async markEmailRead(data: MarkEmailReadRequest): Promise<EmailResponse> {
        return firstValueFrom(this.mailboxService.markEmailRead(data));
    }

    async extendExpiry(data: ExtendExpiryRequest): Promise<MailboxResponse> {
        return firstValueFrom(this.mailboxService.extendMailboxExpiry(data));
    }
}
