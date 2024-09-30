import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';

import appConfig from './configs/app.config';
import authConfig from './configs/auth.config';
import databaseConfig from './configs/database.config';
import fileConfig from './configs/file.config';
import mailConfig from './configs/mail.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { EmailsModule } from './modules/emails/emails.module';
import { FileStorageModule } from './modules/file-storage/file-storage.module';
import { FilesModule } from './modules/files/files.module';
import { ForgotModule } from './modules/forgot/forgot.module';
import { MailConfigService } from './modules/mail/mail-config.service';
import { MailModule } from './modules/mail/mail.module';
import { PhonesModule } from './modules/phones/phones.module';
import { TagsModule } from './modules/tags/tags.module';
import { UsersModule } from './modules/users/users.module';

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
    FileStorageModule,
    ForgotModule,
    MailModule,
    PhonesModule,
    TagsModule,
    UsersModule,
  ],
})
export class AppModule {}
