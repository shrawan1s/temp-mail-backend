/**
 * Centralized response messages for the Payment Service.
 * Update messages here to change them across the entire service.
 */
export const PAYMENT_MESSAGES = {
  // Plans
  PLANS_FETCH_SUCCESS: 'Plans fetched successfully',
  PLANS_FETCH_FAILED: 'Failed to fetch plans',
  PLAN_NOT_FOUND: 'Plan not found',

  // Orders
  ORDER_CREATED: 'Order created successfully',
  ORDER_CREATION_FAILED: 'Failed to create order',
  ORDER_FREE_PLAN_ERROR: 'Cannot create order for free plan',
  ORDER_ALREADY_SUBSCRIBED: 'You already have an active subscription for this plan',
  ORDER_DOWNGRADE_NOT_ALLOWED: 'Downgrades are not supported. Please contact support.',

  // Payment Verification
  PAYMENT_VERIFIED: 'Payment verified successfully',
  PAYMENT_VERIFICATION_FAILED: 'Payment verification failed',
  PAYMENT_INVALID_SIGNATURE: 'Invalid payment signature',
  PAYMENT_RECORD_NOT_FOUND: 'Payment record not found',
  PAYMENT_USER_MISMATCH: 'Payment verification failed - user mismatch',
  PAYMENT_ALREADY_VERIFIED: 'Payment already verified',

  // Subscription
  SUBSCRIPTION_FETCH_SUCCESS: 'Subscription fetched successfully',
  SUBSCRIPTION_FETCH_FAILED: 'Failed to fetch subscription',
  SUBSCRIPTION_NOT_FOUND: 'No active subscription found',
  SUBSCRIPTION_CREATED: 'Subscription created successfully',
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully',
} as const;

export type PaymentMessageKey = keyof typeof PAYMENT_MESSAGES;
