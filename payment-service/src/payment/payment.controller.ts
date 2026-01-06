import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import { InternalKeyGuard } from '../common';
import {
  ICreateOrderRequest,
  ICreateOrderResponse,
  IGetPlansResponse,
  IGetSubscriptionRequest,
  ISubscriptionResponse,
  IVerifyPaymentRequest,
  IVerifyPaymentResponse,
} from '../interfaces';

/**
 * gRPC controller for payment operations.
 * Exposes methods for plan management, order creation, payment verification, and subscriptions.
 * Called by the Gateway service.
 * Protected by InternalKeyGuard to ensure only authorized services can call.
 */
@Controller()
@UseGuards(InternalKeyGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  /**
   * Get all available subscription plans.
   * @returns List of active plans sorted by display order
   */
  @GrpcMethod('PaymentService', 'GetPlans')
  async getPlans(): Promise<IGetPlansResponse> {
    return this.paymentService.getPlans();
  }

  /**
   * Create a Razorpay order for plan subscription.
   * @param data - Order creation request with userId, planId, billingCycle
   * @returns Order details including orderId and razorpayKeyId
   */
  @GrpcMethod('PaymentService', 'CreateOrder')
  async createOrder(data: ICreateOrderRequest): Promise<ICreateOrderResponse> {
    return this.paymentService.createOrder(data.userId, data.planId, data.billingCycle);
  }

  /**
   * Verify Razorpay payment after checkout.
   * Creates subscription and updates user plan on success.
   * @param data - Payment verification request with orderId, paymentId, signature, userId
   * @returns Verification result with new plan details if successful
   */
  @GrpcMethod('PaymentService', 'VerifyPayment')
  async verifyPayment(data: IVerifyPaymentRequest): Promise<IVerifyPaymentResponse> {
    return this.paymentService.verifyPayment(
      data.orderId,
      data.paymentId,
      data.signature,
      data.userId,
    );
  }

  /**
   * Get user's current subscription details.
   * @param data - Request with userId
   * @returns Subscription details or free plan if none exists
   */
  @GrpcMethod('PaymentService', 'GetSubscription')
  async getSubscription(data: IGetSubscriptionRequest): Promise<ISubscriptionResponse> {
    return this.paymentService.getSubscription(data.userId);
  }
}
