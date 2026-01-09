import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../../common/constants';
import { HttpMethod } from '../../common/enums';
import { ENDPOINTS } from '../../config';
import {
  RazorpayGetPlansResponse,
  RazorpayCreateOrderRequest,
  RazorpayCreateOrderResponse,
  RazorpayVerifyPaymentRequest,
  RazorpayVerifyPaymentResponse,
  RazorpayGetSubscriptionRequest,
  RazorpaySubscriptionResponse,
} from '../../common/interfaces';

/**
 * Gateway service for payment operations.
 * Proxies HTTP requests to the Payment Service via HTTP.
 * Uses ConfigService for base URLs, ENDPOINTS for paths.
 */
@Injectable()
export class PaymentService {
  private readonly paymentServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(private configService: ConfigService) {
    this.paymentServiceUrl = this.configService.get<string>('app.paymentServiceUrl') || '';
    this.internalApiKey = this.configService.get<string>('app.internalApiKey') || '';
  }

  private async httpRequest<T>(endpoint: string, method: HttpMethod, body?: unknown): Promise<T> {
    const url = `${this.paymentServiceUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': this.internalApiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data: any;
    const responseText = await response.text();

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: responseText || response.statusText };
    }

    if (!response.ok) {
      throw new HttpException(data.message || ERROR_MESSAGES.PAYMENT_SERVICE_ERROR, response.status);
    }

    return data as T;
  }

  /** Get all available subscription plans */
  async getPlans(): Promise<RazorpayGetPlansResponse> {
    return this.httpRequest<RazorpayGetPlansResponse>(ENDPOINTS.payment.plans, HttpMethod.GET);
  }

  /** Create a Razorpay order */
  async createOrder(data: RazorpayCreateOrderRequest): Promise<RazorpayCreateOrderResponse> {
    return this.httpRequest<RazorpayCreateOrderResponse>(ENDPOINTS.payment.createOrder, HttpMethod.POST, data);
  }

  /** Verify Razorpay payment */
  async verifyPayment(data: RazorpayVerifyPaymentRequest): Promise<RazorpayVerifyPaymentResponse> {
    return this.httpRequest<RazorpayVerifyPaymentResponse>(ENDPOINTS.payment.verify, HttpMethod.POST, data);
  }

  /** Get user's subscription */
  async getSubscription(data: RazorpayGetSubscriptionRequest): Promise<RazorpaySubscriptionResponse> {
    return this.httpRequest<RazorpaySubscriptionResponse>(ENDPOINTS.payment.subscription, HttpMethod.POST, data);
  }

  /** Health check - proxy to payment service */
  async health() {
    return this.httpRequest(ENDPOINTS.payment.health, HttpMethod.GET);
  }

  /** Readiness check - proxy to payment service */
  async healthReady() {
    return this.httpRequest(ENDPOINTS.payment.healthReady, HttpMethod.GET);
  }

  /** Liveness check - proxy to payment service */
  async healthLive() {
    return this.httpRequest(ENDPOINTS.payment.healthLive, HttpMethod.GET);
  }
}
