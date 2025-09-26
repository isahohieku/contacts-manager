import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';

import { CacheModule } from './common/cache/cache.module';
import { CommonModule } from './common/common.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import appConfig from './configs/app.config';
import authConfig from './configs/auth.config';
import cacheConfig from './configs/cache.config';
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
import { HealthModule } from './modules/health/health.module';
import { MailConfigService } from './modules/mail/mail-config.service';
import { MailModule } from './modules/mail/mail.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { PhonesModule } from './modules/phones/phones.module';
import { TagsModule } from './modules/tags/tags.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        cacheConfig,
      ],
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    MailerModule.forRootAsync({
      useClass: MailConfigService,
    }),
    CommonModule,
    CacheModule,
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
    HealthModule,
    MonitoringModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes('*')
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}
