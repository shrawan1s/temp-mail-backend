import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import { Public, CurrentUser, ICurrentUser } from '../../common/decorators';
import { CreateOrderDto, VerifyPaymentDto } from './dto';

/**
 * Payment Controller
 * Handles payment and subscription endpoints.
 */
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Get all available plans (public).
   */
  @Public()
  @Get('plans')
  async getPlans() {
    return this.paymentService.getPlans();
  }

  /**
   * Create Razorpay order (authenticated).
   */
  @Post('create-order')
  async createOrder(
    @CurrentUser() user: ICurrentUser,
    @Body() data: CreateOrderDto,
  ) {
    return this.paymentService.createOrder(
      user.userId,
      data.planId,
      data.billingCycle,
    );
  }

  /**
   * Verify payment (authenticated).
   * Skip throttle for payment callbacks.
   */
  @SkipThrottle()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @CurrentUser() user: ICurrentUser,
    @Body() data: VerifyPaymentDto,
  ) {
    return this.paymentService.verifyPayment(
      data.orderId,
      data.paymentId,
      data.signature,
      user.userId,
    );
  }

  /**
   * Get user's subscription (authenticated).
   */
  @Get('subscription')
  async getSubscription(@CurrentUser() user: ICurrentUser) {
    return this.paymentService.getSubscription(user.userId);
  }
}
