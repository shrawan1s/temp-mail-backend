import { Controller, Get, Post, Body, OnModuleInit, Inject, Request } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Public } from '../../common/decorators';

interface PaymentService {
  GetPlans(data: {}): Observable<any>;
  CreateOrder(data: any): Observable<any>;
  VerifyPayment(data: any): Observable<any>;
  GetSubscription(data: any): Observable<any>;
}

@Controller('payment')
export class PaymentController implements OnModuleInit {
  private paymentService: PaymentService;

  constructor(@Inject('PAYMENT_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentService>('PaymentService');
  }

  /** GET /payment/plans - Get all available plans (public) */
  @Public()
  @Get('plans')
  getPlans() {
    return this.paymentService.GetPlans({});
  }

  /** POST /payment/create-order - Create a Razorpay order */
  @Post('create-order')
  createOrder(@Body() body: { userId: string; planId: string; billingCycle: string }) {
    return this.paymentService.CreateOrder(body);
  }

  /** POST /payment/verify - Verify payment after Razorpay checkout */
  @Post('verify')
  verifyPayment(@Body() body: { orderId: string; paymentId: string; signature: string; userId: string }) {
    return this.paymentService.VerifyPayment(body);
  }

  /** GET /payment/subscription - Get user's subscription (uses userId from JWT token) */
  @Get('subscription')
  getSubscription(@Request() req: any) {
    const userId = req.user?.userId;
    return this.paymentService.GetSubscription({ userId });
  }
}
