import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Repository, FindOptionsWhere } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';
import { handleError } from '../utils/handlers/error.handler';

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

  findManyWithPagination(paginationOptions: IPaginationOptions) {
    return this.usersRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });
  }

  findOne(fields: FindOptionsWhere<User>) {
    return this.usersRepository.findOne({
      where: fields,
    });
  }

  async update(id: number, updateProfileDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      // TODO: Handle error message
      throw handleError(HttpStatus.UNPROCESSABLE_ENTITY, '', {
        user: 'notFound',
      });
    }

    Object.assign(user, updateProfileDto);
    return this.usersRepository.save(user);
  }

  async softDelete(id: number): Promise<void> {
    await this.usersRepository.softDelete(id);
  }
}
