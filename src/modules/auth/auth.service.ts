import { HttpStatus, Injectable } from '@nestjs/common';
import { User } from '../users/entity/user.entity';
import * as bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../../shared/utils/types/statuses.type';
import * as crypto from 'crypto';
import { plainToClass } from 'class-transformer';
import { Status } from '../statuses/entities/status.entity';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { UsersService } from '../users/users.service';
import { ForgotService } from '../forgot/forgot.service';
import { MailService } from '../mail/mail.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserErrorCodes } from '../../shared/utils/constants/users/errors';
import { handleError } from '../../shared/utils/handlers/error.handler';
import { ERROR_MESSAGES } from '../../shared/utils/constants/generic/errors';
import { AuthProvider } from './entities/auth-providers.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthProvidersService } from './auth-providers.service';

// TODO: Generate documentations

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthProvider)
    private readonly authProviderssRepository: Repository<AuthProvider>,
    private usersService: UsersService,
    private forgotService: ForgotService,
    private mailService: MailService,
    private authProvidersService: AuthProvidersService,
  ) {}

  /**
   * Retrieves a list of active authentication providers.
   *
   * @return {AuthProvider[]} A list of active authentication providers.
   */
  async getProviders() {
    return this.authProviderssRepository.find({ where: { active: true } });
  }

  /**
   * Validates a user's login credentials and returns a JWT token and user object if successful.
   *
   * @param {AuthEmailLoginDto} loginDto - The login credentials including email and provider.
   * @param {boolean} onlyAdmin - Whether the user must be an admin or not.
   * @return {Promise<{ token: string; user: User }>} A promise that resolves to an object containing the JWT token and user object.
   * @throws {HttpException} If the user is not found, the user is not active, or the provider is invalid.
   */
  async validateLogin(
    loginDto: AuthEmailLoginDto,
    onlyAdmin: boolean,
  ): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findOne(
      { email: loginDto.email },
      false,
    );

    if (!user || (onlyAdmin && user.role.id !== RoleEnum.admin)) {
      const errors = {
        user: UserErrorCodes.NOT_FOUND,
      };

      throw handleError(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_EXIST('User'),
        errors,
      );
    }

    if (user.status.id !== StatusEnum.active) {
      const errors = {
        provider: UserErrorCodes.UNVERIFIED_USER,
      };

      throw handleError(
        HttpStatus.UNAUTHORIZED,
        ERROR_MESSAGES.UNVERIFIED_USER,
        errors,
      );
    }

    const provider = await this.authProviderssRepository.findOne({
      where: { id: loginDto.provider.id, active: true },
    });

    if (!provider || user.provider.id !== loginDto.provider.id) {
      const errors = {
        provider: UserErrorCodes.INVALID_PROVIDER,
      };

      throw handleError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.INVALID_PROVIDER,
        errors,
      );
    }

    const providerHandler = this.authProvidersService.handleLogin(
      provider.name,
    );

    return (await providerHandler)(user, loginDto);
  }

  /**
   * Registers a new user using the provided registration data.
   *
   * @param {AuthRegisterLoginDto} dto - The registration data for the new user.
   * @return {Promise<User>} The newly created user.
   */
  async register(dto: AuthRegisterLoginDto): Promise<User> {
    const user = await this.usersService.create({
      ...dto,
      email: dto.email,
    } as CreateUserDto);

    return user;
  }

  /**
   * Confirms a user's email by verifying the provided hash and updating the user's status.
   *
   * @param {string} hash - The verification hash to confirm the user's email.
   * @return {Promise<void>} A promise that resolves when the email confirmation is successful.
   */
  async confirmEmail(hash: string): Promise<void> {
    const user = await this.usersService.findOne(
      {
        hash,
      },
      false,
    );

    if (!user) {
      const errors = {
        hash: UserErrorCodes.HASH_NOT_FOUND,
      };
      throw handleError(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.HASH_NOT_FOUND,
        errors,
      );
    }

    user.hash = null;
    user.status = plainToClass(Status, {
      id: StatusEnum.active,
    });

    await user.save();
  }

  /**
   * Sends a password reset email to the user with the specified email address.
   *
   * @param {string} email - The email address of the user who wants to reset their password.
   * @return {Promise<void>} A promise that resolves when the password reset email is sent successfully.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne(
      {
        email,
      },
      false,
    );

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await this.forgotService.create({
      hash,
      user,
    });

    await this.mailService.forgotPassword({
      to: email,
      data: {
        hash,
      },
    });
  }

  /**
   * Resets a user's password using a provided hash.
   *
   * @param {string} hash - The hash used to identify the password reset request.
   * @param {string} password - The new password for the user.
   * @return {Promise<void>} A promise that resolves when the password reset is successful.
   */
  async resetPassword(hash: string, password: string): Promise<void> {
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });

    if (!forgot) {
      const errors = {
        hash: UserErrorCodes.HASH_NOT_FOUND,
      };
      throw handleError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.HASH_NOT_FOUND,
        errors,
      );
    }

    const user = forgot.user;
    user.password = password;
    await user.save();
    await this.forgotService.softDelete(forgot.id);
  }

  /**
   * Retrieves the current user's data.
   *
   * @param {User} user - The currently authenticated user.
   * @return {Promise<User>} The user's data.
   */
  async me(user: User): Promise<User> {
    return this.usersService.findOne(
      {
        id: user.id,
      },
      false,
    );
  }

  /**
   * Updates a user's account information.
   *
   * @param {User} user - The user whose account is being updated.
   * @param {AuthUpdateDto} userDto - The updated user information.
   * @return {Promise<User>} The updated user object.
   */
  async update(user: User, userDto: AuthUpdateDto): Promise<User> {
    if (userDto.password) {
      if (userDto.oldPassword) {
        const currentUser = await this.usersService.findOne(
          {
            id: user.id,
          },
          false,
        );

        const isValidOldPassword = await bcrypt.compare(
          userDto.oldPassword,
          currentUser.password,
        );

        if (!isValidOldPassword) {
          const errors = {
            oldPassword: UserErrorCodes.INCORRECT_PASSWORD,
          };
          throw handleError(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ERROR_MESSAGES.INCORRECT_PASSWORD,
            errors,
          );
        }
      } else {
        const errors = {
          oldPassword: UserErrorCodes.MISSING_PASSWORD,
        };

        throw handleError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ERROR_MESSAGES.MISSING_PASSWORD,
          errors,
        );
      }
    }

    await this.usersService.update(user.id, userDto as UpdateUserDto);

    return this.usersService.findOne(
      {
        id: user.id,
      },
      false,
    );
  }

  /**
   * Soft deletes a user's account.
   *
   * @param {User} user - The user whose account is being soft deleted.
   * @return {Promise<void>} A promise that resolves when the user has been soft deleted.
   */
  async softDelete(user: User): Promise<void> {
    await this.usersService.softDelete(user.id);
  }
}
