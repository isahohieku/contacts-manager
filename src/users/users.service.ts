import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Repository, FindOptionsWhere } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';
import { handleError } from '../utils/handlers/error.handler';
import { genericFindManyWithPagination } from '../utils/infinity-pagination';
import { ERROR_MESSAGES } from '../utils/constants/generic/errors';
import { UserErrorCodes } from '../utils/constants/users/errors';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createProfileDto: CreateUserDto) {
    return this.usersRepository.save(
      this.usersRepository.create(createProfileDto),
    );
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

  async findOne(fields: FindOptionsWhere<User>) {
    const user = await this.usersRepository.findOne({
      where: fields,
    });

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
