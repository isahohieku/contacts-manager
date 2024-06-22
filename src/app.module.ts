import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import databaseConfig from './configs/database.config';
import authConfig from './configs/auth.config';
import mailConfig from './configs/mail.config';
import appConfig from './configs/app.config';
import fileConfig from './configs/file.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { AuthModule } from './auth/auth.module';
import { MailConfigService } from './mail/mail-config.service';
import { ForgotModule } from './forgot/forgot.module';
import { MailModule } from './mail/mail.module';
import { PhonesModule } from './phones/phones.module';
import { EmailsModule } from './emails/emails.module';
import { AddressesModule } from './addresses/addresses.module';
import { TagsModule } from './tags/tags.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig, mailConfig, fileConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    MailerModule.forRootAsync({
      useClass: MailConfigService,
    }),
    AddressesModule,
    AuthModule,
    ContactsModule,
    EmailsModule,
    FilesModule,
    ForgotModule,
    MailModule,
    PhonesModule,
    TagsModule,
    UsersModule,
  ],
})
export class AppModule {}
