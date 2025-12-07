import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCheckoutDto {
  @IsString()
  planId: string;

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;

  @IsString()
  paymentProvider: string; // 'stripe' or 'razorpay'
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}

export class ChangePlanDto {
  @IsString()
  newPlanId: string;

  @IsOptional()
  @IsBoolean()
  prorate?: boolean;
}

export class BillingHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class CreatePortalSessionDto {
  @IsString()
  returnUrl: string;
}
