import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entity/user.entity';
import * as bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../utils/types/statuses.type';
import * as crypto from 'crypto';
import { plainToClass } from 'class-transformer';
import { Status } from '../statuses/entities/status.entity';
import { Role } from '../roles/entities/role.entity';
import { AuthProvidersEnum } from './auth-providers.enum';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { UsersService } from '../users/users.service';
import { ForgotService } from '../forgot/forgot.service';
import { MailService } from '../mail/mail.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserErrorCodes } from '../utils/constants/users/errors';
import { handleError } from '../utils/handlers/error.handler';
import { ERROR_MESSAGES } from '../utils/constants/generic/errors';

// TODO: Add refresh token
// TODO: Generate documentations

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private forgotService: ForgotService,
    private mailService: MailService,
  ) {}

  async validateLogin(
    loginDto: AuthEmailLoginDto,
    onlyAdmin: boolean,
  ): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findOne(
      {
        email: loginDto.email,
      },
      false,
    );

    if (
      !user ||
      (user &&
        !(onlyAdmin ? [RoleEnum.admin] : [RoleEnum.user]).includes(
          user.role.id,
        ))
    ) {
      const errors = {
        user: UserErrorCodes.NOT_FOUND,
      };

      throw handleError(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_EXIST('User'),
        errors,
      );
    }

    if (user.provider !== AuthProvidersEnum.email) {
      const errors = {
        provider: UserErrorCodes.INVALID_PROVIDER,
      };

      throw handleError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.INVALID_PROVIDER,
        errors,
      );
    }

    if (user.status.id !== StatusEnum.active) {
      const errors = {
        provider: UserErrorCodes.INVALID_PROVIDER,
      };

      throw handleError(
        HttpStatus.UNAUTHORIZED,
        ERROR_MESSAGES.UNVERIFIED_USER,
        errors,
      );
    }

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

  async register(dto: AuthRegisterLoginDto): Promise<User> {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const found = await this.usersService.findOne({ email: dto.email }, false);

    if (found) {
      const errors = {
        email: UserErrorCodes.ALREADY_EXISTS,
      };
      throw handleError(
        HttpStatus.CONFLICT,
        ERROR_MESSAGES.ALREADY_EXIST('User', 'email'),
        errors,
      );
    }

    const user = await this.usersService.create({
      ...dto,
      email: dto.email,
      role: {
        id: RoleEnum.user,
      } as Role,
      status: {
        id: StatusEnum.inactive,
      } as Status,
      hash,
    } as CreateUserDto);

    await this.mailService.userSignUp({
      to: user.email,
      data: {
        hash,
      },
    });

    return user;
  }

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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne(
      {
        email,
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
    } else {
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
  }

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

  async me(user: User): Promise<User> {
    return this.usersService.findOne(
      {
        id: user.id,
      },
      false,
    );
  }

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

  async softDelete(user: User): Promise<void> {
    await this.usersService.softDelete(user.id);
  }
}
