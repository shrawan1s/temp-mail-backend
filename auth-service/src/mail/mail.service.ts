import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';
import { appConfig } from '../config/app.config';

@Injectable()
export class MailService {
  private apiInstance: Brevo.TransactionalEmailsApi;

  constructor(private configService: ConfigService) {
    this.apiInstance = new Brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      appConfig.brevoApiKey || '',
    );
  }

  async sendVerificationEmail(email: string, token: string) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = 'Verify your email';
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.htmlContent = `
      <h1>Verify your email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${appConfig.frontendUrl}/verify?token=${token}">Verify Email</a>
    `;
    sendSmtpEmail.sender = { name: 'Temp Email', email: appConfig.brevoSenderEmail };

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send verification email');
    }
  }
}
