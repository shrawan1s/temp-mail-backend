import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';
import { verificationCodeTemplate, passwordResetTemplate } from './templates';
import { LOG_MESSAGES } from '../../common/constants';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiInstance: Brevo.TransactionalEmailsApi | null = null;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.brevoApiKey');

    if (apiKey) {
      this.apiInstance = new Brevo.TransactionalEmailsApi();
      this.apiInstance.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        apiKey,
      );
    }

    this.senderEmail = this.configService.get<string>('email.senderEmail', '');
    this.senderName = this.configService.get<string>('email.senderName', '');
  }

  async sendVerificationCode(
    to: string,
    name: string,
    code: string,
  ): Promise<boolean> {
    if (!this.apiInstance) {
      this.logger.warn(LOG_MESSAGES.EMAIL_NOT_CONFIGURED);
      this.logger.log(LOG_MESSAGES.EMAIL_DEV_VERIFICATION(to, code));
      return true;
    }

    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: this.senderEmail, name: this.senderName };
      sendSmtpEmail.to = [{ email: to, name }];
      sendSmtpEmail.subject = 'Verify your email - TempMail';
      sendSmtpEmail.htmlContent = verificationCodeTemplate(name, code);

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(LOG_MESSAGES.EMAIL_VERIFICATION_SENT(to));
      return true;
    } catch (error) {
      this.logger.error(LOG_MESSAGES.EMAIL_SEND_FAILED(to), error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetLink: string,
  ): Promise<boolean> {
    if (!this.apiInstance) {
      this.logger.warn(LOG_MESSAGES.EMAIL_NOT_CONFIGURED);
      this.logger.log(LOG_MESSAGES.EMAIL_DEV_RESET(to, resetLink));
      return true;
    }

    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: this.senderEmail, name: this.senderName };
      sendSmtpEmail.to = [{ email: to, name }];
      sendSmtpEmail.subject = 'Reset your password - TempMail';
      sendSmtpEmail.htmlContent = passwordResetTemplate(name, resetLink);

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(LOG_MESSAGES.EMAIL_RESET_SENT(to));
      return true;
    } catch (error) {
      this.logger.error(LOG_MESSAGES.EMAIL_SEND_FAILED(to), error);
      return false;
    }
  }
}
