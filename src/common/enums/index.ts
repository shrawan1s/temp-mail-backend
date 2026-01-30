// AUTH ENUMS
export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}

// PAYMENT ENUMS
export enum PlanKey {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum Currency {
  INR = 'INR',
  USD = 'USD',
}

export const PLAN_TIER_ORDER: Record<string, number> = {
  [PlanKey.FREE]: 0,
  [PlanKey.PRO]: 1,
  [PlanKey.BUSINESS]: 2,
};
