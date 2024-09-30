import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ForgotModule } from '../forgot/forgot.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

import { AuthProvidersService } from './auth-providers.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthProvider } from './entities/auth-providers.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    ForgotModule,
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {
          expiresIn: configService.get('auth.expires'),
        },
      }),
    }),
    TypeOrmModule.forFeature([AuthProvider]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthProvidersService],
  exports: [AuthService, AuthProvidersService],
})
export class AuthModule {}
