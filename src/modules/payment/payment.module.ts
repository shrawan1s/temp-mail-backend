import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RazorpayService } from './razorpay.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayService],
  exports: [PaymentService],
})
export class PaymentModule {}
