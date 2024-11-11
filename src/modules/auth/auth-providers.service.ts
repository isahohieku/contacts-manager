import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { UserErrorCodes } from '@contactApp/shared/utils/constants/users/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/entity/user.entity';

import { AuthProvidersEnum } from './auth-providers.enum';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';

@Injectable()
export class AuthProvidersService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Handles the login process with the specified provider.
   *
   * This method returns a promise that resolves to a function that takes a user and login DTO
   * and returns a promise that resolves to an object containing the JWT token and user.
   *
   * The function returned by this method is called the "provider handler". It's called the provider
   * handler because it's the function that actually handles the login process with the specified
   * provider.
   *
   * The provider handler is called with two arguments: the user and the login DTO. The provider
   * handler then uses the user and login DTO to generate a JWT token and return it along with the
   * user object.
   *
   * @param {AuthProvidersEnum} provider - The provider to use for the login process.
   * @return {Promise<Function>} A promise that resolves to a function that takes a user and login DTO
   * and returns a promise that resolves to an object containing the JWT token and user.
   */
  async handleLogin(
    provider: AuthProvidersEnum,
  ): Promise<
    (
      user: User,
      loginDto: AuthEmailLoginDto,
    ) => Promise<{ token: string; user: User }>
  > {
    switch (provider) {
      // If the provider is the email provider, return the loginWithEmail function
      // as the provider handler. This function will be called with a user and a
      // login DTO, and it will return a promise that resolves to an object
      // containing the JWT token and user.
      case AuthProvidersEnum.EMAIL:
        return this.loginWithEmail.bind(this);
    }
  }

  /**
   * Logs in a user using the email provider.
   *
   * @param {User} user - The user to log in.
   * @param {AuthEmailLoginDto} loginDto - The login credentials.
   * @return {Promise<{ token: string; user: User }>} A promise that resolves to an object containing
   * the JWT token and user object if the login is successful.
   * @throws {HttpException} If the password is incorrect.
   *
   * This function first checks if the provided password is valid by comparing it to the user's
   * password in the database. If the password is valid, it generates a JWT token with the user's
   * ID, role, and status. If the password is invalid, it throws a 422 error with an appropriate
   * error message.
   */
  async loginWithEmail(user: User, loginDto: AuthEmailLoginDto) {
    // Compare the provided password with the user's password in the database
    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    // If the password is valid, generate a JWT token
    if (isValidPassword) {
      const token = await this.jwtService.sign({
        id: user.id,
        role: user.role,
        status: user.status,
      });

      // Return the JWT token and user object
      return { token, user };
    } else {
      // If the password is invalid, throw a 422 error with an appropriate error message
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
