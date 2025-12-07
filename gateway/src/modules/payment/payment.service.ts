import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  PaymentServiceClient,
  GetPlansRequest,
  GetPlansResponse,
  GetSubscriptionRequest,
  SubscriptionResponse,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  ResumeSubscriptionRequest,
  ChangePlanRequest,
  GetBillingHistoryRequest,
  GetBillingHistoryResponse,
  GetInvoiceRequest,
  InvoiceResponse,
  WebhookRequest,
  WebhookResponse,
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
} from '../../grpc/interfaces';

@Injectable()
export class PaymentService implements OnModuleInit {
  private paymentService: PaymentServiceClient;

  constructor(@Inject('PAYMENT_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentServiceClient>('PaymentService');
  }

  async getPlans(data: GetPlansRequest): Promise<GetPlansResponse> {
    return firstValueFrom(this.paymentService.getPlans(data));
  }

  async getSubscription(data: GetSubscriptionRequest): Promise<SubscriptionResponse> {
    return firstValueFrom(this.paymentService.getSubscription(data));
  }

  async createCheckoutSession(data: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
    return firstValueFrom(this.paymentService.createCheckoutSession(data));
  }

  async cancelSubscription(data: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
    return firstValueFrom(this.paymentService.cancelSubscription(data));
  }

  async resumeSubscription(data: ResumeSubscriptionRequest): Promise<SubscriptionResponse> {
    return firstValueFrom(this.paymentService.resumeSubscription(data));
  }

  async changePlan(data: ChangePlanRequest): Promise<SubscriptionResponse> {
    return firstValueFrom(this.paymentService.changePlan(data));
  }

  async getBillingHistory(data: GetBillingHistoryRequest): Promise<GetBillingHistoryResponse> {
    return firstValueFrom(this.paymentService.getBillingHistory(data));
  }

  async getInvoice(data: GetInvoiceRequest): Promise<InvoiceResponse> {
    return firstValueFrom(this.paymentService.getInvoice(data));
  }

  async handleStripeWebhook(data: WebhookRequest): Promise<WebhookResponse> {
    return firstValueFrom(this.paymentService.handleStripeWebhook(data));
  }

  async handleRazorpayWebhook(data: WebhookRequest): Promise<WebhookResponse> {
    return firstValueFrom(this.paymentService.handleRazorpayWebhook(data));
  }

  async createPortalSession(data: CreatePortalSessionRequest): Promise<CreatePortalSessionResponse> {
    return firstValueFrom(this.paymentService.createPortalSession(data));
  }
}
