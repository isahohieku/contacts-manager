import * as crypto from 'crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { ERROR_MESSAGES } from '../../shared/utils/constants/generic/errors';
import { UserErrorCodes } from '../../shared/utils/constants/users/errors';
import { handleError } from '../../shared/utils/handlers/error.handler';
import { genericFindManyWithPagination } from '../../shared/utils/infinity-pagination';
import { IPaginationOptions } from '../../shared/utils/types/pagination-options';
import { MailService } from '../mail/mail.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailService: MailService,
  ) {}

  async create(createProfileDto: CreateUserDto) {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const user = await this.usersRepository.save(
      this.usersRepository.create({ ...createProfileDto, hash }),
    );

    await this.mailService.userSignUp({
      to: user.email,
      data: {
        hash,
      },
    });

    return user;
  }

  findManyWithPagination(options: IPaginationOptions) {
    const baseQuery = {
      where: {},
    };

    return genericFindManyWithPagination(
      this.usersRepository,
      baseQuery,
      options,
    );
  }

  async findOne(fields: FindOptionsWhere<User>, throwError = true) {
    const user = await this.usersRepository.findOne({
      where: fields,
    });

    if (!throwError) return user;

    if (user) {
      return user;
    }

    const errors = {
      user: UserErrorCodes.NOT_FOUND,
    };

    throw handleError(
      HttpStatus.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND('User', fields.id),
      errors,
    );
  }

  async update(id: number, updateProfileDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw handleError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.NOT_FOUND('User', id),
        {
          user: UserErrorCodes.NOT_FOUND,
        },
      );
    }

    Object.assign(user, updateProfileDto);
    return this.usersRepository.save(user);
  }

  async softDelete(id: number): Promise<void> {
    await this.usersRepository.softDelete(id);
  }
}
