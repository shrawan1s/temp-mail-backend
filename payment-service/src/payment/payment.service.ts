import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

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

    // Store planId and billingCycle for subscription creation after verification
    await this.prisma.payment.create({
      data: {
        userId,
        planId,
        billingCycle,
        razorpayOrderId: order.id,
        amount,
        status: 'pending',
      },
    });

    this.logger.log(`Order created: ${order.id} for user ${userId}, plan ${plan.key}`);

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
      this.logger.warn(`Invalid payment signature for order ${orderId}`);
      return { success: false, message: 'Invalid signature' };
    }

    // Get the payment record to retrieve planId and billingCycle
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!payment) {
      return { success: false, message: 'Payment record not found' };
    }

    // Get the plan details
    const plan = await this.prisma.plan.findUnique({
      where: { id: payment.planId },
    });

    if (!plan) {
      return { success: false, message: 'Plan not found' };
    }

    // Calculate subscription expiry date
    const now = new Date();
    const expiresAt = new Date(now);
    if (payment.billingCycle === 'annual') {
      expiresAt.setDate(expiresAt.getDate() + 365);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // Use transaction to ensure data consistency
    await this.prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { razorpayOrderId: orderId },
        data: { razorpayPayId: paymentId, status: 'success' },
      });

      // Create or update subscription (upsert)
      await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          planId: payment.planId,
          billingCycle: payment.billingCycle,
          status: 'active',
          startedAt: now,
          expiresAt,
        },
        update: {
          planId: payment.planId,
          billingCycle: payment.billingCycle,
          status: 'active',
          startedAt: now,
          expiresAt,
        },
      });

      // Update user's plan field for consistency
      await tx.user.update({
        where: { id: userId },
        data: { plan: plan.key },
      });
    });

    this.logger.log(`Payment verified: ${orderId}, User ${userId} upgraded to ${plan.key}`);

    return { 
      success: true, 
      message: 'Payment verified successfully',
      planKey: plan.key,
      expiresAt: expiresAt.toISOString(),
    };
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
