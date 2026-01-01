/**
 * Payment service interfaces for gRPC request/response types.
 * These interfaces define the contract for payment-related operations.
 */

// ============= Plan Interfaces =============

export interface IPlan {
  id: string;
  key: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  isPopular: boolean;
}

export interface IGetPlansResponse {
  plans: IPlan[];
}

// ============= Order Interfaces =============

export interface ICreateOrderRequest {
  userId: string;
  planId: string;
  billingCycle: string;
}

export interface ICreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}

// ============= Payment Verification Interfaces =============

export interface IVerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  userId: string;
}

export interface IVerifyPaymentResponse {
  success: boolean;
  message: string;
  planKey?: string;
  expiresAt?: string;
}

// ============= Subscription Interfaces =============

export interface IGetSubscriptionRequest {
  userId: string;
}

export interface ISubscriptionResponse {
  planKey: string;
  planName: string;
  status: string;
  billingCycle: string;
  expiresAt: string;
}

// ============= Internal Types =============

/** Tier order for plan comparison */
export const PLAN_TIER_ORDER: Record<string, number> = {
  free: 0,
  pro: 1,
  business: 2,
};
