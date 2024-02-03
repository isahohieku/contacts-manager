import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailData } from './interfaces/mail-data.interface';

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
      template: '/activation',
      context: {
        title: 'Comfirm email address',
        url: `${this.configService.get('app.frontendDomain')}/confirm-email/${
          mailData.data.hash
        }`,
        actionTitle: 'Comfirm email address',
        app_name: this.configService.get('app.name'),
        // text1: await this.i18n.t('confirm-email.text1'),
        // text2: await this.i18n.t('confirm-email.text2'),
        // text3: await this.i18n.t('confirm-email.text3'),
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
      template: '/reset-password',
      context: {
        title: 'Reset Password',
        url: `${this.configService.get('app.frontendDomain')}/password-change/${
          mailData.data.hash
        }`,
        actionTitle: 'Reset Password',
        app_name: this.configService.get('app.name'),
        // text1: await this.i18n.t('reset-password.text1'),
        // text2: await this.i18n.t('reset-password.text2'),
        // text3: await this.i18n.t('reset-password.text3'),
        // text4: await this.i18n.t('reset-password.text4'),
      },
    });
  }
}
