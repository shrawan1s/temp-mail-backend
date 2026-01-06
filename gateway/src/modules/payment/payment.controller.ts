import { Controller, Get, Post, Body, OnModuleInit, Inject, Request } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Public } from '../../common/decorators';
import { CreateOrderDto, VerifyPaymentDto } from './dto';
import { GrpcClientService } from '../../grpc';
import {
  RazorpayPaymentServiceClient,
  RazorpayGetPlansResponse,
  RazorpayCreateOrderResponse,
  RazorpayVerifyPaymentResponse,
  RazorpaySubscriptionResponse,
} from '../../grpc/interfaces';

/**
 * REST API controller for payment endpoints.
 * Routes are prefixed with /api/v1/payment
 * Handles Razorpay payment integration for subscription management.
 */
@Controller('payment')
export class PaymentController implements OnModuleInit {
  private paymentService: RazorpayPaymentServiceClient;

  constructor(
    @Inject('PAYMENT_PACKAGE') private client: ClientGrpc,
    private readonly grpcClientService: GrpcClientService,
  ) {}

  onModuleInit() {
    this.paymentService =
      this.client.getService<RazorpayPaymentServiceClient>('PaymentService');
  }

  /**
   * GET /payment/plans - Get all available subscription plans.
   * Public endpoint - no authentication required.
   * @returns List of active plans with pricing details
   */
  @Public()
  @Get('plans')
  async getPlans(): Promise<RazorpayGetPlansResponse> {
    return firstValueFrom(
      this.paymentService.GetPlans({}, this.grpcClientService.getMetadata()),
    );
  }

  /**
   * POST /payment/create-order - Create a Razorpay order.
   * Requires authentication.
   * @param body - Order details (userId, planId, billingCycle)
   * @returns Order ID and Razorpay key for checkout
   */
  @Post('create-order')
  async createOrder(@Body() body: CreateOrderDto): Promise<RazorpayCreateOrderResponse> {
    return firstValueFrom(
      this.paymentService.CreateOrder(body, this.grpcClientService.getMetadata()),
    );
  }

  /**
   * POST /payment/verify - Verify Razorpay payment after checkout.
   * Requires authentication.
   * @param body - Payment verification details (orderId, paymentId, signature, userId)
   * @returns Verification result with updated subscription details
   */
  @Post('verify')
  async verifyPayment(@Body() body: VerifyPaymentDto): Promise<RazorpayVerifyPaymentResponse> {
    return firstValueFrom(
      this.paymentService.VerifyPayment(body, this.grpcClientService.getMetadata()),
    );
  }

  /**
   * GET /payment/subscription - Get user's current subscription.
   * Requires authentication. Uses userId from JWT token.
   * @returns Current subscription details or free plan if none exists
   */
  @Get('subscription')
  async getSubscription(@Request() req: { user?: { userId?: string } }): Promise<RazorpaySubscriptionResponse> {
    const userId = req.user?.userId || '';
    return firstValueFrom(
      this.paymentService.GetSubscription({ userId }, this.grpcClientService.getMetadata()),
    );
  }
}
