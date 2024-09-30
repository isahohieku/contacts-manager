import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { ERROR_MESSAGES } from '../../shared/utils/constants/generic/errors';
import { UserErrorCodes } from '../../shared/utils/constants/users/errors';
import { handleError } from '../../shared/utils/handlers/error.handler';
import { User } from '../users/entity/user.entity';

import { AuthProvidersEnum } from './auth-providers.enum';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';

@Injectable()
export class AuthProvidersService {
  constructor(private jwtService: JwtService) {}

  async handleLogin(
    provider: AuthProvidersEnum,
  ): Promise<
    (
      user: User,
      loginDto: AuthEmailLoginDto,
    ) => Promise<{ token: string; user: User }>
  > {
    switch (provider) {
      case AuthProvidersEnum.EMAIL:
        return this.loginWithEmail.bind(this);
    }
  }

  async loginWithEmail(user: User, loginDto: AuthEmailLoginDto) {
    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (isValidPassword) {
      const token = await this.jwtService.sign({
        id: user.id,
        role: user.role,
        status: user.status,
      });

      return { token, user };
    } else {
      const errors = {
        password: UserErrorCodes.INCORRECT_PASSWORD,
      };
      throw handleError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.INCORRECT_PASSWORD,
        errors,
      );
    }
  }
}
