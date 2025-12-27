import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

@Injectable()
export class RazorpayService {
  private razorpay: InstanceType<typeof Razorpay>;
  private keySecret: string;

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('app.razorpayKeyId');
    this.keySecret = this.configService.get<string>('app.razorpayKeySecret') || '';
    
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: this.keySecret,
    });
  }

  async createOrder(amount: number, currency: string = 'INR') {
    const options = {
      amount, // in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };
    return this.razorpay.orders.create(options);
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }
}
