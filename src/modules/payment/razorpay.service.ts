import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Currency } from '../../common/enums';
import { IRazorpayOrder } from 'src/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const Razorpay = require('razorpay');

@Injectable()
export class RazorpayService {
  private readonly razorpay: any;
  private readonly keySecret: string;

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('razorpay.keyId');
    this.keySecret = this.configService.get<string>('razorpay.keySecret') || '';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: this.keySecret,
    });
  }

  async createOrder(
    amount: number,
    currency: string = Currency.INR,
  ): Promise<IRazorpayOrder> {
    const options = {
      amount, // in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (await this.razorpay.orders.create(options)) as IRazorpayOrder;
  }

  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }
}
