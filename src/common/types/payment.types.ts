// PLAN TYPES
export interface IPlanDto {
  id: string;
  key: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  isPopular: boolean;
}

// PAYMENT DATA TYPES (for API responses)
export interface IPlansData {
  plans: IPlanDto[];
}

export interface IOrderData {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}

export interface IVerifyPaymentData {
  planKey: string;
  expiresAt: string;
}

export interface ISubscriptionData {
  planKey: string;
  planName: string;
  status: string;
  billingCycle: string;
  expiresAt: string;
}

export interface IRazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}
