import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';
import { RazorpayService } from './razorpay.service';
import {
  ICreateOrderResponse,
  IGetPlansResponse,
  ISubscriptionResponse,
  IVerifyPaymentResponse,
  PLAN_TIER_ORDER,
} from '../interfaces';
import {
  PlanKey,
  BillingCycle,
  PaymentStatus,
  SubscriptionStatus,
  Currency,
} from '../enums';
import { PAYMENT_MESSAGES } from '../constants';

/**
 * Service for managing payment operations.
 * Handles plans, orders, payment verification, and subscriptions.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
    private configService: ConfigService,
  ) { }

  /**
   * Fetch all active subscription plans.
   * Returns plans sorted by sortOrder for consistent display.
   */
  async getPlans(): Promise<IGetPlansResponse> {
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

  /**
   * Create a Razorpay order for plan subscription.
   * Validates plan exists, checks for downgrades, and creates payment record.
   * @param userId - The ID of the user making the purchase
   * @param planId - The ID of the plan to subscribe to
   * @param billingCycle - 'monthly' or 'annual' billing cycle
   */
  async createOrder(
    userId: string,
    planId: string,
    billingCycle: string,
  ): Promise<ICreateOrderResponse> {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new Error(PAYMENT_MESSAGES.PLAN_NOT_FOUND);
    }

    const amount = billingCycle === BillingCycle.ANNUAL ? plan.priceAnnual : plan.priceMonthly;
    if (amount === 0) {
      throw new Error(PAYMENT_MESSAGES.ORDER_FREE_PLAN_ERROR);
    }

    // Check if user already has active subscription for same or higher tier plan
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
      const currentPlan = existingSubscription.plan;
      const currentTier = PLAN_TIER_ORDER[currentPlan.key] ?? 0;
      const newTier = PLAN_TIER_ORDER[plan.key] ?? 0;

      if (newTier <= currentTier) {
        throw new Error(
          `${PAYMENT_MESSAGES.ORDER_ALREADY_SUBSCRIBED} ${currentPlan.name}. ${PAYMENT_MESSAGES.ORDER_DOWNGRADE_NOT_ALLOWED}`,
        );
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
        status: PaymentStatus.PENDING,
      },
    });

    this.logger.log(
      `${PAYMENT_MESSAGES.ORDER_CREATED}: ${order.id} for user ${userId}, plan ${plan.key}`,
    );

    return {
      orderId: order.id,
      amount,
      currency: Currency.INR,
      razorpayKeyId: this.configService.get<string>('app.razorpayKeyId') || '',
    };
  }

  /**
   * Verify Razorpay payment after checkout completion.
   * Creates/updates subscription and updates user plan on success.
   * @param orderId - Razorpay order ID
   * @param paymentId - Razorpay payment ID
   * @param signature - Razorpay signature for verification
   * @param userId - ID of the user who made the payment
   */
  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    userId: string,
  ): Promise<IVerifyPaymentResponse> {
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
      this.logger.warn(
        `${PAYMENT_MESSAGES.PAYMENT_USER_MISMATCH}: expected ${payment.userId}, got ${userId}`,
      );
      return { success: false, message: PAYMENT_MESSAGES.PAYMENT_USER_MISMATCH };
    }

    // Check if payment was already verified
    if (payment.status === PaymentStatus.SUCCESS) {
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
    if (payment.billingCycle === BillingCycle.ANNUAL) {
      expiresAt.setDate(expiresAt.getDate() + 365);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // Use transaction to ensure data consistency
    await this.prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { razorpayOrderId: orderId },
        data: { razorpayPayId: paymentId, status: PaymentStatus.SUCCESS },
      });

      // Create or update subscription (upsert)
      await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          planId: payment.planId,
          billingCycle: payment.billingCycle,
          status: SubscriptionStatus.ACTIVE,
          startedAt: now,
          expiresAt,
        },
        update: {
          planId: payment.planId,
          billingCycle: payment.billingCycle,
          status: SubscriptionStatus.ACTIVE,
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

    this.logger.log(
      `${PAYMENT_MESSAGES.PAYMENT_VERIFIED}: ${orderId}, User ${userId} upgraded to ${plan.key}`,
    );

    return {
      success: true,
      message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
      planKey: plan.key,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Get user's current subscription details.
   * Returns free plan if no subscription exists.
   * @param userId - The ID of the user
   */
  async getSubscription(userId: string): Promise<ISubscriptionResponse> {
    // Return free plan if no userId provided
    if (!userId) {
      return {
        planKey: PlanKey.FREE,
        planName: 'Free',
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        expiresAt: '',
      };
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        planKey: PlanKey.FREE,
        planName: 'Free',
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        expiresAt: '',
      };
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
