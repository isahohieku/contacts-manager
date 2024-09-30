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
  /**
   * Initializes a new instance of the AuthService class.
   *
   * @param {Repository<AuthProvider>} authProviderssRepository - The repository for authentication providers.
   * @param {UsersService} usersService - The service for user operations.
   * @param {ForgotService} forgotService - The service for forgot password operations.
   * @param {MailService} mailService - The service for sending emails.
   * @param {AuthProvidersService} authProvidersService - The service for authentication providers.
   */
  constructor(
    @InjectRepository(AuthProvider)
    private readonly authProviderssRepository: Repository<AuthProvider>,
    private readonly usersService: UsersService,
    private readonly forgotService: ForgotService,
    private readonly mailService: MailService,
    private readonly authProvidersService: AuthProvidersService,
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
   * This method is used to validate a user's login credentials and return a JWT token and user object if the validation is successful.
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
    // Step 1: Find the user by email
    // We don't want to throw an error if the user doesn't exist, so we use findOne() with the second argument set to false
    const user = await this.usersService.findOne(
      { email: loginDto.email },
      false, // Don't throw an error if the user doesn't exist
    );

    // Step 2: Check if the user exists
    if (!user) {
      const errors = {
        user: UserErrorCodes.NOT_FOUND,
      };

      throw handleError(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_EXIST('User'),
        errors,
      );
    }

    // Step 3: Validate the user's status and role
    // If onlyAdmin is true, the user must be an admin
    // Otherwise, the user can be any role
    this.validateUserStatusAndRole(user, onlyAdmin);

    // Step 4: Validate the provider
    // Get the provider handler for the provider
    const providerHandler = this.validateProvider(
      loginDto.provider.id,
      user.provider.id,
    );

    // Step 5: Call the provider handler and return the result
    // Call the provider handler with the user and loginDto as arguments
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
   * @param hash The hash used to identify the password reset request.
   * @param newPassword The new password for the user.
   * @returns A promise that resolves when the password reset is successful.
   */
  async resetPassword(hash: string, newPassword: string): Promise<void> {
    const forgotPassword = await this.forgotService.findOne({
      where: { hash },
    });

    if (!forgotPassword) {
      throw handleError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.HASH_NOT_FOUND,
        { hash: UserErrorCodes.HASH_NOT_FOUND },
      );
    }

    const user = forgotPassword.user;
    user.password = newPassword;
    await user.save();
    await this.forgotService.softDelete(forgotPassword.id);
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
   * @param {User} existingUser - The user whose account is being updated.
   * @param {AuthUpdateDto} updateDto - The updated user information.
   * @return {Promise<User>} The updated user object.
   */
  async update(existingUser: User, updateDto: AuthUpdateDto): Promise<User> {
    const { password: newPassword, oldPassword } = updateDto;

    if (newPassword) {
      if (!oldPassword) {
        throw handleError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ERROR_MESSAGES.MISSING_PASSWORD,
          {
            oldPassword: UserErrorCodes.MISSING_PASSWORD,
          },
        );
      }

      const currentUser = await this.usersService.findOne(
        {
          id: existingUser.id,
        },
        false,
      );

      const isValidOldPassword = await bcrypt.compare(
        oldPassword,
        currentUser.password,
      );

      if (!isValidOldPassword) {
        throw handleError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ERROR_MESSAGES.INCORRECT_PASSWORD,
          {
            oldPassword: UserErrorCodes.INCORRECT_PASSWORD,
          },
        );
      }
    }

    await this.usersService.update(existingUser.id, updateDto as UpdateUserDto);

    return this.usersService.findOne(
      {
        id: existingUser.id,
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

  /**
   * Validates the status and role of a user.
   *
   * @param {User} user - The user to validate.
   * @param {boolean} onlyAdmin - Whether to only allow admin users.
   * @return {void}
   * @throws {HttpException} If the user is not active or not an admin (if onlyAdmin is true).
   */
  private validateUserStatusAndRole(user: User, onlyAdmin: boolean): void {
    // If the user is not active, throw a 401 error
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

    // If we want to only allow admins to log in, make sure the user is an admin
    if (onlyAdmin && user.role.id !== RoleEnum.admin) {
      const errors = {
        user: UserErrorCodes.FORBIDDEN_RESOURCE,
      };

      throw handleError(
        HttpStatus.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN_RESOURCE,
        errors,
      );
    }
  }

  /**
   * Validates a provider by checking if it exists and is active, and if its ID matches the user's provider ID.
   *
   * This method is used to validate a user's login credentials when they try to log in.
   *
   * @param {number} providerId - The ID of the provider to validate.
   * @param {number} userProviderId - The ID of the user's provider.
   * @return {Promise<void>} A promise that resolves when the provider is valid.
   */
  private async validateProvider(providerId: number, userProviderId: number) {
    // First, let's try to find the provider by ID
    const provider = await this.authProviderssRepository.findOne({
      where: { id: providerId, active: true },
    });

    // If the provider exists, let's check if its ID matches the user's provider ID
    if (userProviderId !== providerId) {
      const errors = {
        provider: UserErrorCodes.INVALID_PROVIDER,
      };

      throw handleError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.INVALID_PROVIDER,
        errors,
      );
    }

    // If we've made it this far, the provider is valid, so we call the provider's handler
    const providerHandler = this.authProvidersService.handleLogin(
      provider.name,
    );

    // We return the provider's handler as a promise
    return providerHandler;
  }
}
