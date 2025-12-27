import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
    private configService: ConfigService,
  ) {}

  async getPlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        key: plan.key,
        name: plan.name,
        description: plan.description || '',
        priceMonthly: plan.priceMonthly,
        priceAnnual: plan.priceAnnual,
        features: plan.features,
        isPopular: plan.isPopular,
      })),
    };
  }

  async createOrder(userId: string, planId: string, billingCycle: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new Error('Plan not found');
    }

    const amount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
    if (amount === 0) {
      throw new Error('Cannot create order for free plan');
    }

    const order = await this.razorpayService.createOrder(amount);

    await this.prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        amount,
        status: 'pending',
      },
    });

    return {
      orderId: order.id,
      amount,
      currency: 'INR',
      razorpayKeyId: this.configService.get<string>('app.razorpayKeyId'),
    };
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string, userId: string) {
    const isValid = this.razorpayService.verifySignature(orderId, paymentId, signature);
    if (!isValid) {
      return { success: false, message: 'Invalid signature' };
    }

    await this.prisma.payment.update({
      where: { razorpayOrderId: orderId },
      data: { razorpayPayId: paymentId, status: 'success' },
    });

    return { success: true, message: 'Payment verified successfully' };
  }

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return { planKey: 'free', planName: 'Free', status: 'active', expiresAt: '' };
    }

    return {
      planKey: subscription.plan.key,
      planName: subscription.plan.name,
      status: subscription.status,
      expiresAt: subscription.expiresAt.toISOString(),
    };
  }
}
