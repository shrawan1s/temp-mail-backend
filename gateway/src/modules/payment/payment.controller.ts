import { Controller, Get, Post, Body, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

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

  @Get('plans')
  getPlans() {
    return this.paymentService.GetPlans({});
  }

  @Post('create-order')
  createOrder(@Body() body: { userId: string; planId: string; billingCycle: string }) {
    return this.paymentService.CreateOrder(body);
  }

  @Post('verify')
  verifyPayment(@Body() body: { orderId: string; paymentId: string; signature: string; userId: string }) {
    return this.paymentService.VerifyPayment(body);
  }

  @Get('subscription')
  getSubscription(@Body() body: { userId: string }) {
    return this.paymentService.GetSubscription(body);
  }
}
