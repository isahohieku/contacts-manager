import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { ForgotModule } from '../forgot/forgot.module';
import { MailModule } from '../mail/mail.module';
import { AuthProvider } from './entities/auth-providers.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthProvidersService } from './auth-providers.service';

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
