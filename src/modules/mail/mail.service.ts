import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

import confirmEmail from '@contactApp/shared/translations/confirm-email.json';
import resetPassword from '@contactApp/shared/translations/reset-password.json';

import { MailData } from './interfaces/mail-data.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    try {
      const confirmUrl = `${this.configService.get('app.frontendDomain')}/confirm-email/${mailData.data.hash}`;

      await this.mailerService.sendMail({
        to: mailData.to,
        subject: 'Confirm email address',
        text: `${confirmUrl} Confirm email address`,
        template: 'activation',
        context: {
          title: 'Confirm email address',
          url: confirmUrl,
          actionTitle: 'Confirm email address',
          app_name: this.configService.get('app.name'),
          text1: confirmEmail.text1,
          text2: confirmEmail.text2,
          text3: confirmEmail.text3,
        },
      });

      this.logger.log(`Confirmation email sent successfully to ${mailData.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send confirmation email to ${mailData.to}`,
        error.stack,
      );
      throw error;
    }
  }

  async forgotPassword(mailData: MailData<{ hash: string }>): Promise<void> {
    try {
      const resetUrl = `${this.configService.get('app.frontendDomain')}/password-change/${mailData.data.hash}`;

      await this.mailerService.sendMail({
        to: mailData.to,
        subject: 'Reset Password',
        text: `${resetUrl} Reset Password`,
        template: 'reset-password',
        context: {
          title: 'Reset Password',
          url: resetUrl,
          actionTitle: 'Reset Password',
          app_name: this.configService.get('app.name'),
          text1: resetPassword.text1,
          text2: resetPassword.text2,
          text3: resetPassword.text3,
          text4: resetPassword.text4,
        },
      });

      this.logger.log(
        `Password reset email sent successfully to ${mailData.to}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${mailData.to}`,
        error.stack,
      );
      throw error;
    }
  }
}
