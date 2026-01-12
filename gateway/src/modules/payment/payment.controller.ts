import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
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

  /**
   * GET /payment/health - Health check for payment service.
   * Public endpoint for monitoring.
   * @returns Health status from payment service
   */
  @Public()
  @SkipThrottle()
  @Get('health')
  async health() {
    return this.paymentService.health();
  }

  /**
   * GET /payment/health/ready - Readiness check for payment service.
   * Public endpoint for monitoring.
   */
  @Public()
  @SkipThrottle()
  @Get('health/ready')
  async healthReady() {
    return this.paymentService.healthReady();
  }

  /**
   * GET /payment/health/live - Liveness check for payment service.
   * Public endpoint for monitoring.
   */
  @Public()
  @SkipThrottle()
  @Get('health/live')
  async healthLive() {
    return this.paymentService.healthLive();
  }
}
