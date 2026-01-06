import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { GrpcClientService } from '../../grpc';
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

  constructor(
    @Inject('PAYMENT_PACKAGE') private client: ClientGrpc,
    private readonly grpcClientService: GrpcClientService,
  ) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentServiceClient>('PaymentService');
  }

  async getPlans(data: GetPlansRequest): Promise<GetPlansResponse> {
    return firstValueFrom(this.paymentService.getPlans(data, this.grpcClientService.getMetadata()));
  }

  async getSubscription(data: GetSubscriptionRequest): Promise<SubscriptionResponse> {
    return firstValueFrom(this.paymentService.getSubscription(data, this.grpcClientService.getMetadata()));
  }

  async createCheckoutSession(data: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
    return firstValueFrom(this.paymentService.createCheckoutSession(data, this.grpcClientService.getMetadata()));
  }

  async cancelSubscription(data: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
    return firstValueFrom(this.paymentService.cancelSubscription(data, this.grpcClientService.getMetadata()));
  }

  async resumeSubscription(data: ResumeSubscriptionRequest): Promise<SubscriptionResponse> {
    return firstValueFrom(this.paymentService.resumeSubscription(data, this.grpcClientService.getMetadata()));
  }

  async changePlan(data: ChangePlanRequest): Promise<SubscriptionResponse> {
    return firstValueFrom(this.paymentService.changePlan(data, this.grpcClientService.getMetadata()));
  }

  async getBillingHistory(data: GetBillingHistoryRequest): Promise<GetBillingHistoryResponse> {
    return firstValueFrom(this.paymentService.getBillingHistory(data, this.grpcClientService.getMetadata()));
  }

  async getInvoice(data: GetInvoiceRequest): Promise<InvoiceResponse> {
    return firstValueFrom(this.paymentService.getInvoice(data, this.grpcClientService.getMetadata()));
  }

  async handleStripeWebhook(data: WebhookRequest): Promise<WebhookResponse> {
    return firstValueFrom(this.paymentService.handleStripeWebhook(data, this.grpcClientService.getMetadata()));
  }

  async handleRazorpayWebhook(data: WebhookRequest): Promise<WebhookResponse> {
    return firstValueFrom(this.paymentService.handleRazorpayWebhook(data, this.grpcClientService.getMetadata()));
  }

  async createPortalSession(data: CreatePortalSessionRequest): Promise<CreatePortalSessionResponse> {
    return firstValueFrom(this.paymentService.createPortalSession(data, this.grpcClientService.getMetadata()));
  }
}
