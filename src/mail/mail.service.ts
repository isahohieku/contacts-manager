import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailData } from './interfaces/mail-data.interface';

import confirmEmail from '../translations/confirm-email.json';
import resetPassword from '../translations/reset-password.json';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async userSignUp(mailData: MailData<{ hash: string }>) {
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: 'Comfirm email address',
      text: `${this.configService.get('app.frontendDomain')}/confirm-email/${
        mailData.data.hash
      } Comfirm email address`,
      template: './activation',
      context: {
        title: 'Comfirm email address',
        url: `${this.configService.get('app.frontendDomain')}/confirm-email/${
          mailData.data.hash
        }`,
        actionTitle: 'Comfirm email address',
        app_name: this.configService.get('app.name'),
        text1: confirmEmail.text1,
        text2: confirmEmail.text2,
        text3: confirmEmail.text3,
      },
    });
  }

  async forgotPassword(mailData: MailData<{ hash: string }>) {
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: 'Reset Password',
      text: `${this.configService.get('app.frontendDomain')}/password-change/${
        mailData.data.hash
      } ${'Reset Password'}`,
      template: './reset-password',
      context: {
        title: 'Reset Password',
        url: `${this.configService.get('app.frontendDomain')}/password-change/${
          mailData.data.hash
        }`,
        actionTitle: 'Reset Password',
        app_name: this.configService.get('app.name'),
        text1: await resetPassword.text1,
        text2: await resetPassword.text2,
        text3: await resetPassword.text3,
        text4: await resetPassword.text4,
      },
    });
  }
}
