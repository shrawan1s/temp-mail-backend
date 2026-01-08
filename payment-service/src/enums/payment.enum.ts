/**
 * Plan keys enum.
 * Used for plan identification across the service.
 */
export enum PlanKey {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
}

/**
 * Billing cycle enum.
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

/**
 * Payment status enum.
 */
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * Subscription status enum.
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Currency enum.
 */
export enum Currency {
  INR = 'INR',
  USD = 'USD',
}
