import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';
import { RazorpayService } from './razorpay.service';
import { PAYMENT_MESSAGES } from './constants';

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
      throw new Error(PAYMENT_MESSAGES.PLAN_NOT_FOUND);
    }

    const amount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
    if (amount === 0) {
      throw new Error(PAYMENT_MESSAGES.ORDER_FREE_PLAN_ERROR);
    }

    // Check if user already has active subscription for same or higher tier plan
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      const currentPlan = existingSubscription.plan;
      const tierOrder: Record<string, number> = { 'free': 0, 'pro': 1, 'business': 2 };

      if (tierOrder[plan.key] <= tierOrder[currentPlan.key]) {
        throw new Error(`${PAYMENT_MESSAGES.ORDER_ALREADY_SUBSCRIBED} ${currentPlan.name}. ${PAYMENT_MESSAGES.ORDER_DOWNGRADE_NOT_ALLOWED}`);
      }
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

    this.logger.log(`${PAYMENT_MESSAGES.ORDER_CREATED}: ${order.id} for user ${userId}, plan ${plan.key}`);

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
      this.logger.warn(`${PAYMENT_MESSAGES.PAYMENT_INVALID_SIGNATURE} for order ${orderId}`);
      return { success: false, message: PAYMENT_MESSAGES.PAYMENT_INVALID_SIGNATURE };
    }

    // Get the payment record to retrieve planId and billingCycle
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!payment) {
      return { success: false, message: PAYMENT_MESSAGES.PAYMENT_RECORD_NOT_FOUND };
    }

    // Validate that the payment belongs to the user verifying
    if (payment.userId !== userId) {
      this.logger.warn(`${PAYMENT_MESSAGES.PAYMENT_USER_MISMATCH}: expected ${payment.userId}, got ${userId}`);
      return { success: false, message: PAYMENT_MESSAGES.PAYMENT_USER_MISMATCH };
    }

    // Check if payment was already verified
    if (payment.status === 'success') {
      this.logger.warn(`${PAYMENT_MESSAGES.PAYMENT_ALREADY_VERIFIED}: ${orderId}`);
      return { success: false, message: PAYMENT_MESSAGES.PAYMENT_ALREADY_VERIFIED };
    }

    // Get the plan details
    const plan = await this.prisma.plan.findUnique({
      where: { id: payment.planId },
    });

    if (!plan) {
      return { success: false, message: PAYMENT_MESSAGES.PLAN_NOT_FOUND };
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

    this.logger.log(`${PAYMENT_MESSAGES.PAYMENT_VERIFIED}: ${orderId}, User ${userId} upgraded to ${plan.key}`);

    return {
      success: true,
      message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
      planKey: plan.key,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getSubscription(userId: string) {
    // Return free plan if no userId provided
    if (!userId) {
      return { planKey: 'free', planName: 'Free', status: 'active', billingCycle: 'monthly', expiresAt: '' };
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return { planKey: 'free', planName: 'Free', status: 'active', billingCycle: 'monthly', expiresAt: '' };
    }

    return {
      planKey: subscription.plan.key,
      planName: subscription.plan.name,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      expiresAt: subscription.expiresAt.toISOString(),
    };
  }
}
