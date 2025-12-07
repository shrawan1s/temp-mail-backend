import { Observable } from 'rxjs';

// Mailbox Service Interfaces
export interface MailboxServiceClient {
  createMailbox(data: CreateMailboxRequest): Observable<MailboxResponse>;
  getMailbox(data: GetMailboxRequest): Observable<MailboxResponse>;
  listMailboxes(data: ListMailboxesRequest): Observable<ListMailboxesResponse>;
  deleteMailbox(data: DeleteMailboxRequest): Observable<DeleteMailboxResponse>;
  listEmails(data: ListEmailsRequest): Observable<ListEmailsResponse>;
  getEmail(data: GetEmailRequest): Observable<EmailResponse>;
  deleteEmail(data: DeleteEmailRequest): Observable<DeleteEmailResponse>;
  markEmailRead(data: MarkEmailReadRequest): Observable<EmailResponse>;
  storeEmail(data: StoreEmailRequest): Observable<StoreEmailResponse>;
  extendMailboxExpiry(data: ExtendExpiryRequest): Observable<MailboxResponse>;
  getMailboxByAddress(data: GetMailboxByAddressRequest): Observable<MailboxResponse>;
}

export interface CreateMailboxRequest {
  userId: string;
  customName?: string;
  domain?: string;
  ttlMinutes?: number;
}

export interface MailboxResponse {
  success: boolean;
  message: string;
  mailbox?: Mailbox;
}

export interface Mailbox {
  id: string;
  userId: string;
  emailAddress: string;
  domain: string;
  emailCount: number;
  unreadCount: number;
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
}

export interface GetMailboxRequest {
  mailboxId: string;
  userId: string;
}

export interface GetMailboxByAddressRequest {
  emailAddress: string;
}

export interface ListMailboxesRequest {
  userId: string;
  limit?: number;
  offset?: number;
  includeExpired?: boolean;
}

export interface ListMailboxesResponse {
  success: boolean;
  message: string;
  mailboxes: Mailbox[];
  total: number;
}

export interface DeleteMailboxRequest {
  mailboxId: string;
  userId: string;
}

export interface DeleteMailboxResponse {
  success: boolean;
  message: string;
}

export interface ListEmailsRequest {
  mailboxId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

export interface ListEmailsResponse {
  success: boolean;
  message: string;
  emails: EmailSummary[];
  total: number;
}

export interface EmailSummary {
  id: string;
  mailboxId: string;
  from: string;
  subject: string;
  preview: string;
  isRead: boolean;
  hasAttachments: boolean;
  receivedAt: string;
}

export interface GetEmailRequest {
  emailId: string;
  userId: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  email?: EmailDetail;
}

export interface EmailDetail {
  id: string;
  mailboxId: string;
  from: string;
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  attachments: AttachmentInfo[];
  isRead: boolean;
  receivedAt: string;
}

export interface AttachmentInfo {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface DeleteEmailRequest {
  emailId: string;
  userId: string;
}

export interface DeleteEmailResponse {
  success: boolean;
  message: string;
}

export interface MarkEmailReadRequest {
  emailId: string;
  userId: string;
}

export interface StoreEmailRequest {
  mailboxId: string;
  from: string;
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  attachments: AttachmentData[];
  receivedAt: string;
}

export interface AttachmentData {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface StoreEmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

export interface ExtendExpiryRequest {
  mailboxId: string;
  userId: string;
  additionalMinutes: number;
}
