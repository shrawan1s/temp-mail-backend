import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { RazorpayService } from './razorpay.service';
import { PAYMENT_MESSAGES, LOG_MESSAGES } from '../../common/constants';
import {
  BillingCycle,
  Currency,
  PaymentStatus,
  PLAN_TIER_ORDER,
  PlanKey,
  SubscriptionStatus,
} from '../../common/enums';
import {
  IApiResponse,
  IOrderData,
  IPlansData,
  ISubscriptionData,
  IVerifyPaymentData,
} from '../../common/types';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
    private configService: ConfigService,
  ) {}

  async getPlans(): Promise<IApiResponse<IPlansData>> {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      success: true,
      message: PAYMENT_MESSAGES.PLANS_FETCHED,
      data: {
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
      },
    };
  }

  async createOrder(
    userId: string,
    planId: string,
    billingCycle: string,
  ): Promise<IApiResponse<IOrderData | null>> {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return {
        success: false,
        message: PAYMENT_MESSAGES.PLAN_NOT_FOUND,
        data: null,
      };
    }

    const amount =
      billingCycle === (BillingCycle.ANNUAL as string)
        ? plan.priceAnnual
        : plan.priceMonthly;
    if (amount === 0) {
      return {
        success: false,
        message: PAYMENT_MESSAGES.ORDER_FREE_PLAN_ERROR,
        data: null,
      };
    }

    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (
      existingSubscription &&
      existingSubscription.status === (SubscriptionStatus.ACTIVE as string)
    ) {
      const currentPlan = existingSubscription.plan;
      const currentTier = PLAN_TIER_ORDER[currentPlan.key] ?? 0;
      const newTier = PLAN_TIER_ORDER[plan.key] ?? 0;

      if (newTier <= currentTier) {
        return {
          success: false,
          message: `${PAYMENT_MESSAGES.ORDER_ALREADY_SUBSCRIBED} ${currentPlan.name}. ${PAYMENT_MESSAGES.ORDER_DOWNGRADE_NOT_ALLOWED}`,
          data: null,
        };
      }
    }

    const order = await this.razorpayService.createOrder(amount);

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

    this.logger.log(LOG_MESSAGES.ORDER_CREATED(order.id, userId, plan.key));

    return {
      success: true,
      message: PAYMENT_MESSAGES.ORDER_CREATED,
      data: {
        orderId: order.id,
        amount,
        currency: Currency.INR,
        razorpayKeyId: this.configService.get<string>('razorpay.keyId') || '',
      },
    };
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    userId: string,
  ): Promise<IApiResponse<IVerifyPaymentData | null>> {
    const isValid = this.razorpayService.verifySignature(
      orderId,
      paymentId,
      signature,
    );
    if (!isValid) {
      this.logger.warn(LOG_MESSAGES.PAYMENT_INVALID_SIGNATURE(orderId));
      return {
        success: false,
        message: PAYMENT_MESSAGES.PAYMENT_INVALID_SIGNATURE,
        data: null,
      };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!payment) {
      return {
        success: false,
        message: PAYMENT_MESSAGES.PAYMENT_RECORD_NOT_FOUND,
        data: null,
      };
    }

    if (payment.userId !== userId) {
      this.logger.warn(
        LOG_MESSAGES.PAYMENT_USER_MISMATCH(payment.userId, userId),
      );
      return {
        success: false,
        message: PAYMENT_MESSAGES.PAYMENT_USER_MISMATCH,
        data: null,
      };
    }

    if (payment.status === (PaymentStatus.SUCCESS as string)) {
      return {
        success: false,
        message: PAYMENT_MESSAGES.PAYMENT_ALREADY_VERIFIED,
        data: null,
      };
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: payment.planId },
    });

    if (!plan) {
      return {
        success: false,
        message: PAYMENT_MESSAGES.PLAN_NOT_FOUND,
        data: null,
      };
    }

    const now = new Date();
    const expiresAt = new Date(now);
    if (payment.billingCycle === (BillingCycle.ANNUAL as string)) {
      expiresAt.setDate(expiresAt.getDate() + 365);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { razorpayOrderId: orderId },
        data: { razorpayPayId: paymentId, status: PaymentStatus.SUCCESS },
      });

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

      await tx.user.update({
        where: { id: userId },
        data: { plan: plan.key },
      });
    });

    this.logger.log(LOG_MESSAGES.PAYMENT_VERIFIED(orderId, userId, plan.key));

    return {
      success: true,
      message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
      data: {
        planKey: plan.key,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  async getSubscription(
    userId: string,
  ): Promise<IApiResponse<ISubscriptionData>> {
    if (!userId) {
      return {
        success: true,
        message: PAYMENT_MESSAGES.SUBSCRIPTION_FETCHED,
        data: {
          planKey: PlanKey.FREE,
          planName: 'Free',
          status: SubscriptionStatus.ACTIVE,
          billingCycle: BillingCycle.MONTHLY,
          expiresAt: '',
        },
      };
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        success: true,
        message: PAYMENT_MESSAGES.SUBSCRIPTION_FETCHED,
        data: {
          planKey: PlanKey.FREE,
          planName: 'Free',
          status: SubscriptionStatus.ACTIVE,
          billingCycle: BillingCycle.MONTHLY,
          expiresAt: '',
        },
      };
    }

    return {
      success: true,
      message: PAYMENT_MESSAGES.SUBSCRIPTION_FETCHED,
      data: {
        planKey: subscription.plan.key,
        planName: subscription.plan.name,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        expiresAt: subscription.expiresAt.toISOString(),
      },
    };
  }
}
