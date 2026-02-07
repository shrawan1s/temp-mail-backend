import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Plan ID (UUID) to purchase', example: 'uuid-here' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ description: 'Billing cycle', example: 'monthly', enum: ['monthly', 'annual'] })
  @IsString()
  @IsNotEmpty()
  billingCycle: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay order ID', example: 'order_xxxxx' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Razorpay payment ID', example: 'pay_xxxxx' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ description: 'Razorpay HMAC signature' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
