import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';

import { CacheModule } from '@contactApp/common/cache/cache.module';
import { CommonModule } from '@contactApp/common/common.module';
import { RequestLoggingMiddleware } from '@contactApp/common/middleware/request-logging.middleware';
import { SecurityMiddleware } from '@contactApp/common/middleware/security.middleware';
import appConfig from '@contactApp/configs/app.config';
import authConfig from '@contactApp/configs/auth.config';
import cacheConfig from '@contactApp/configs/cache.config';
import databaseConfig from '@contactApp/configs/database.config';
import fileConfig from '@contactApp/configs/file.config';
import mailConfig from '@contactApp/configs/mail.config';
import { AddressesModule } from '@contactApp/modules/addresses/addresses.module';
import { AuthModule } from '@contactApp/modules/auth/auth.module';
import { ContactsModule } from '@contactApp/modules/contacts/contacts.module';
import { EmailsModule } from '@contactApp/modules/emails/emails.module';
import { FileStorageModule } from '@contactApp/modules/file-storage/file-storage.module';
import { FilesModule } from '@contactApp/modules/files/files.module';
import { ForgotModule } from '@contactApp/modules/forgot/forgot.module';
import { HealthModule } from '@contactApp/modules/health/health.module';
import { MailModule } from '@contactApp/modules/mail/mail.module';
import { MonitoringModule } from '@contactApp/modules/monitoring/monitoring.module';
import { PhonesModule } from '@contactApp/modules/phones/phones.module';
import { TagsModule } from '@contactApp/modules/tags/tags.module';
import { UsersModule } from '@contactApp/modules/users/users.module';

import { TestTypeOrmConfigService } from './test-typeorm-config.service';

/**
 * Test-specific AppModule that excludes the MailerModule to avoid
 * open handles from native modules like @css-inline/css-inline
 */
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
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60000,
            limit: 10,
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      useClass: TestTypeOrmConfigService,
    }),
    // Note: MailerModule is excluded to prevent open handles in tests
    CommonModule,
    CacheModule,
    AddressesModule,
    AuthModule,
    ContactsModule,
    EmailsModule,
    FileStorageModule,
    FilesModule,
    ForgotModule,
    HealthModule,
    MailModule, // This still includes MailService but not MailerModule
    MonitoringModule,
    PhonesModule,
    TagsModule,
    UsersModule,
  ],
  providers: [
    TestTypeOrmConfigService,
    // Mock MailerService to prevent open handles from native modules
    {
      provide: MailerService,
      useValue: {
        sendMail: jest.fn().mockResolvedValue(true),
      },
    },
  ],
})
export class TestAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityMiddleware).forRoutes('*');
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
