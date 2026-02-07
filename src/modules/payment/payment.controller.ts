import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { Public, CurrentUser, ICurrentUser } from '../../common/decorators';
import { CreateOrderDto, VerifyPaymentDto } from './dto';

/**
 * Payment Controller
 * Handles payment and subscription endpoints.
 */
@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Get all available plans (public).
   */
  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get subscription plans', description: 'Returns all available subscription plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async getPlans() {
    return this.paymentService.getPlans();
  }

  /**
   * Create Razorpay order (authenticated).
   */
  @Post('create-order')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create payment order', description: 'Creates a Razorpay order for subscription purchase' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid plan or already subscribed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify payment', description: 'Verifies Razorpay payment and activates subscription' })
  @ApiResponse({ status: 200, description: 'Payment verified, subscription activated' })
  @ApiResponse({ status: 400, description: 'Invalid signature or order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get subscription', description: 'Returns current user subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscription(@CurrentUser() user: ICurrentUser) {
    return this.paymentService.getSubscription(user.userId);
  }
}
