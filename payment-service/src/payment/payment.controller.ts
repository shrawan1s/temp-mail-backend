import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  ICreateOrderRequest,
  ICreateOrderResponse,
  IGetPlansResponse,
  IGetSubscriptionRequest,
  ISubscriptionResponse,
  IVerifyPaymentRequest,
  IVerifyPaymentResponse,
} from '../interfaces';
import { InternalApiKeyGuard } from '../guards';

/**
 * HTTP controller for payment operations.
 * Exposes endpoints for plan management, order creation, payment verification, and subscriptions.
 * Called by the Gateway service.
 * Protected by InternalApiKeyGuard to ensure only authorized services can call.
 */
@Controller('payment')
@UseGuards(InternalApiKeyGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * GET /payment/plans - Get all available subscription plans.
   * @returns List of active plans sorted by display order
   */
  @Get('plans')
  async getPlans(): Promise<IGetPlansResponse> {
    return this.paymentService.getPlans();
  }

  /**
   * POST /payment/create-order - Create a Razorpay order for plan subscription.
   * @param data - Order creation request with userId, planId, billingCycle
   * @returns Order details including orderId and razorpayKeyId
   */
  @Post('create-order')
  async createOrder(@Body() data: ICreateOrderRequest): Promise<ICreateOrderResponse> {
    return this.paymentService.createOrder(data.userId, data.planId, data.billingCycle);
  }

  /**
   * POST /payment/verify - Verify Razorpay payment after checkout.
   * Creates subscription and updates user plan on success.
   * @param data - Payment verification request with orderId, paymentId, signature, userId
   * @returns Verification result with new plan details if successful
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() data: IVerifyPaymentRequest): Promise<IVerifyPaymentResponse> {
    return this.paymentService.verifyPayment(
      data.orderId,
      data.paymentId,
      data.signature,
      data.userId,
    );
  }

  /**
   * POST /payment/subscription - Get user's current subscription details.
   * @param data - Request with userId
   * @returns Subscription details or free plan if none exists
   */
  @Post('subscription')
  @HttpCode(HttpStatus.OK)
  async getSubscription(@Body() data: IGetSubscriptionRequest): Promise<ISubscriptionResponse> {
    return this.paymentService.getSubscription(data.userId);
  }
}
