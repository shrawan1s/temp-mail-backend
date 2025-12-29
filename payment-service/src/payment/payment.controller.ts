import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod('PaymentService', 'GetPlans')
  async getPlans() {
    return this.paymentService.getPlans();
  }

  @GrpcMethod('PaymentService', 'CreateOrder')
  async createOrder(data: { userId: string; planId: string; billingCycle: string }) {
    return this.paymentService.createOrder(data.userId, data.planId, data.billingCycle);
  }

  @GrpcMethod('PaymentService', 'VerifyPayment')
  async verifyPayment(data: { orderId: string; paymentId: string; signature: string; userId: string }) {
    return this.paymentService.verifyPayment(data.orderId, data.paymentId, data.signature, data.userId);
  }

  @GrpcMethod('PaymentService', 'GetSubscription')
  async getSubscription(data: { userId: string }) {
    return this.paymentService.getSubscription(data.userId);
  }
}
