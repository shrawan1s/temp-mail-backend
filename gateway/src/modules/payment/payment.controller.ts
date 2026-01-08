import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { PaymentService } from './payment.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto';
import {
  RazorpayGetPlansResponse,
  RazorpayCreateOrderResponse,
  RazorpayVerifyPaymentResponse,
  RazorpaySubscriptionResponse,
} from '../../common/interfaces';

/**
 * REST API controller for payment endpoints.
 * Routes are prefixed with /api/v1/payment
 * Handles Razorpay payment integration for subscription management.
 */
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * GET /payment/plans - Get all available subscription plans.
   * Public endpoint - no authentication required.
   * @returns List of active plans with pricing details
   */
  @Public()
  @Get('plans')
  async getPlans(): Promise<RazorpayGetPlansResponse> {
    return this.paymentService.getPlans();
  }

  /**
   * POST /payment/create-order - Create a Razorpay order.
   * Requires authentication.
   * @param body - Order details (userId, planId, billingCycle)
   * @returns Order ID and Razorpay key for checkout
   */
  @Post('create-order')
  async createOrder(@Body() body: CreateOrderDto): Promise<RazorpayCreateOrderResponse> {
    return this.paymentService.createOrder(body);
  }

  /**
   * POST /payment/verify - Verify Razorpay payment after checkout.
   * Requires authentication.
   * @param body - Payment verification details (orderId, paymentId, signature, userId)
   * @returns Verification result with updated subscription details
   */
  @Post('verify')
  async verifyPayment(@Body() body: VerifyPaymentDto): Promise<RazorpayVerifyPaymentResponse> {
    return this.paymentService.verifyPayment(body);
  }

  /**
   * GET /payment/subscription - Get user's current subscription.
   * Requires authentication. Uses userId from JWT token.
   * @returns Current subscription details or free plan if none exists
   */
  @Get('subscription')
  async getSubscription(@Request() req: { user?: { userId?: string } }): Promise<RazorpaySubscriptionResponse> {
    const userId = req.user?.userId || '';
    return this.paymentService.getSubscription({ userId });
  }
}
