import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Headers,
    RawBodyRequest,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators';
import {
    CreateCheckoutDto,
    CancelSubscriptionDto,
    ChangePlanDto,
    BillingHistoryQueryDto,
    CreatePortalSessionDto,
} from './dto';

@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Public()
    @Get('plans')
    async getPlans(@Query('currency') currency?: string) {
        return this.paymentService.getPlans({ currency });
    }

    @Get('subscription')
    async getSubscription(@CurrentUser() user: CurrentUserData) {
        return this.paymentService.getSubscription({
            userId: user.userId,
        });
    }

    @Post('checkout')
    async createCheckout(
        @CurrentUser() user: CurrentUserData,
        @Body() dto: CreateCheckoutDto,
    ) {
        return this.paymentService.createCheckoutSession({
            userId: user.userId,
            planId: dto.planId,
            successUrl: dto.successUrl,
            cancelUrl: dto.cancelUrl,
            paymentProvider: dto.paymentProvider,
        });
    }

    @Post('subscription/cancel')
    @HttpCode(HttpStatus.OK)
    async cancelSubscription(
        @CurrentUser() user: CurrentUserData,
        @Body() dto: CancelSubscriptionDto,
    ) {
        return this.paymentService.cancelSubscription({
            userId: user.userId,
            immediate: dto.immediate ?? false,
        });
    }

    @Post('subscription/resume')
    @HttpCode(HttpStatus.OK)
    async resumeSubscription(@CurrentUser() user: CurrentUserData) {
        return this.paymentService.resumeSubscription({
            userId: user.userId,
        });
    }

    @Post('subscription/change-plan')
    @HttpCode(HttpStatus.OK)
    async changePlan(
        @CurrentUser() user: CurrentUserData,
        @Body() dto: ChangePlanDto,
    ) {
        return this.paymentService.changePlan({
            userId: user.userId,
            newPlanId: dto.newPlanId,
            prorate: dto.prorate ?? true,
        });
    }

    @Get('billing-history')
    async getBillingHistory(
        @CurrentUser() user: CurrentUserData,
        @Query() query: BillingHistoryQueryDto,
    ) {
        return this.paymentService.getBillingHistory({
            userId: user.userId,
            limit: query.limit,
            offset: query.offset,
        });
    }

    @Get('invoices/:invoiceId')
    async getInvoice(
        @CurrentUser() user: CurrentUserData,
        @Param('invoiceId') invoiceId: string,
    ) {
        return this.paymentService.getInvoice({
            invoiceId,
            userId: user.userId,
        });
    }

    @Post('portal')
    async createPortalSession(
        @CurrentUser() user: CurrentUserData,
        @Body() dto: CreatePortalSessionDto,
    ) {
        return this.paymentService.createPortalSession({
            userId: user.userId,
            returnUrl: dto.returnUrl,
        });
    }

    @Public()
    @Post('webhooks/stripe')
    @HttpCode(HttpStatus.OK)
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        const payload = req.rawBody?.toString() || '';
        return this.paymentService.handleStripeWebhook({
            payload,
            signature,
        });
    }

    @Public()
    @Post('webhooks/razorpay')
    @HttpCode(HttpStatus.OK)
    async handleRazorpayWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        const payload = req.rawBody?.toString() || '';
        return this.paymentService.handleRazorpayWebhook({
            payload,
            signature,
        });
    }
}
