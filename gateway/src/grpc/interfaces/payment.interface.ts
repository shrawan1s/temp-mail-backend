import { Observable } from 'rxjs';

// Payment Service Interfaces
export interface PaymentServiceClient {
  getPlans(data: GetPlansRequest): Observable<GetPlansResponse>;
  getSubscription(data: GetSubscriptionRequest): Observable<SubscriptionResponse>;
  createCheckoutSession(data: CreateCheckoutRequest): Observable<CreateCheckoutResponse>;
  cancelSubscription(data: CancelSubscriptionRequest): Observable<CancelSubscriptionResponse>;
  resumeSubscription(data: ResumeSubscriptionRequest): Observable<SubscriptionResponse>;
  changePlan(data: ChangePlanRequest): Observable<SubscriptionResponse>;
  getBillingHistory(data: GetBillingHistoryRequest): Observable<GetBillingHistoryResponse>;
  getInvoice(data: GetInvoiceRequest): Observable<InvoiceResponse>;
  handleStripeWebhook(data: WebhookRequest): Observable<WebhookResponse>;
  handleRazorpayWebhook(data: WebhookRequest): Observable<WebhookResponse>;
  createPortalSession(data: CreatePortalSessionRequest): Observable<CreatePortalSessionResponse>;
}

export interface GetPlansRequest {
  currency?: string;
}

export interface GetPlansResponse {
  success: boolean;
  message: string;
  plans: Plan[];
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: string;
  features: string[];
  maxMailboxes: number;
  maxEmailsPerMailbox: number;
  mailboxTtlHours: number;
  customDomain: boolean;
  emailForwarding: boolean;
}

export interface GetSubscriptionRequest {
  userId: string;
}

export interface SubscriptionResponse {
  success: boolean;
  message: string;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider: string;
  createdAt: string;
}

export interface CreateCheckoutRequest {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
  paymentProvider: string;
}

export interface CreateCheckoutResponse {
  success: boolean;
  message: string;
  checkoutUrl?: string;
  sessionId?: string;
}

export interface CancelSubscriptionRequest {
  userId: string;
  immediate: boolean;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  cancelledAt?: string;
}

export interface ResumeSubscriptionRequest {
  userId: string;
}

export interface ChangePlanRequest {
  userId: string;
  newPlanId: string;
  prorate: boolean;
}

export interface GetBillingHistoryRequest {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GetBillingHistoryResponse {
  success: boolean;
  message: string;
  invoices: InvoiceSummary[];
  total: number;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export interface GetInvoiceRequest {
  invoiceId: string;
  userId: string;
}

export interface InvoiceResponse {
  success: boolean;
  message: string;
  invoice?: Invoice;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  amountCents: number;
  currency: string;
  status: string;
  description: string;
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
  createdAt: string;
  paidAt?: string;
}

export interface WebhookRequest {
  payload: string;
  signature: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
}

export interface CreatePortalSessionRequest {
  userId: string;
  returnUrl: string;
}

export interface CreatePortalSessionResponse {
  success: boolean;
  message: string;
  portalUrl?: string;
}
