import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';
import { verificationCodeTemplate, passwordResetTemplate } from './templates';
import { LOG_MESSAGES, EMAIL_SUBJECTS } from '../constants';

/**
 * Service for sending transactional emails via Brevo (formerly Sendinblue).
 * Falls back to logging in development mode if BREVO_API_KEY is not configured.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiInstance: Brevo.TransactionalEmailsApi | null = null;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.brevoApiKey');
    
    if (apiKey) {
      this.apiInstance = new Brevo.TransactionalEmailsApi();
      this.apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    }

    this.senderEmail = this.configService.get<string>('app.brevoSenderEmail', '');
    this.senderName = this.configService.get<string>('app.senderName', '');
  }

  /**
   * Send a 6-digit verification code email to the user.
   * @param to - Recipient email address
   * @param name - Recipient name for personalization
   * @param code - 6-digit verification code
   * @returns true if sent successfully
   */
  async sendVerificationCode(to: string, name: string, code: string): Promise<boolean> {
    if (!this.apiInstance) {
      this.logger.warn(LOG_MESSAGES.BREVO_NOT_CONFIGURED);
      this.logger.log(LOG_MESSAGES.DEV_VERIFICATION_CODE(to, code));
      return true;
    }

    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: this.senderEmail, name: this.senderName };
      sendSmtpEmail.to = [{ email: to, name }];
      sendSmtpEmail.subject = EMAIL_SUBJECTS.VERIFICATION;
      sendSmtpEmail.htmlContent = verificationCodeTemplate(name, code);

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(LOG_MESSAGES.VERIFICATION_EMAIL_SENT(to));
      return true;
    } catch (error) {
      this.logger.error(LOG_MESSAGES.EMAIL_SEND_FAILED(to), error);
      return false;
    }
  }

  /**
   * Send a password reset email with a secure link.
   * @param to - Recipient email address
   * @param name - Recipient name for personalization
   * @param resetLink - Password reset URL (includes token)
   * @returns true if sent successfully
   */
  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<boolean> {
    if (!this.apiInstance) {
      this.logger.warn(LOG_MESSAGES.BREVO_NOT_CONFIGURED);
      this.logger.log(LOG_MESSAGES.DEV_PASSWORD_RESET_LINK(to, resetLink));
      return true;
    }

    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: this.senderEmail, name: this.senderName };
      sendSmtpEmail.to = [{ email: to, name }];
      sendSmtpEmail.subject = EMAIL_SUBJECTS.PASSWORD_RESET;
      sendSmtpEmail.htmlContent = passwordResetTemplate(name, resetLink);

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(LOG_MESSAGES.PASSWORD_RESET_EMAIL_SENT(to));
      return true;
    } catch (error) {
      this.logger.error(LOG_MESSAGES.EMAIL_SEND_FAILED(to), error);
      return false;
    }
  }
}
