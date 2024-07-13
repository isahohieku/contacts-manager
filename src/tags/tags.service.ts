import { User } from '../users/entity/user.entity';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Repository } from 'typeorm';
import { TagErrorCodes } from '../utils/constants/tags/errors';
import { handleError } from '../utils/handlers/error.handler';
import { ERROR_MESSAGES } from '../utils/constants/generic/errors';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  async create(user: User, createTagDto: CreateTagDto) {
    const tag = await this.tagsRepository.save(
      this.tagsRepository.create({
        ...createTagDto,
        owner: user,
      }),
    );
    return tag;
  }

  async findAll(user: User) {
    const tags = await this.tagsRepository.find({
      where: {
        owner: {
          id: user.id,
        },
      },
    });
    return tags;
  }

  async findOne(user: User, id: number) {
    const tag = await this.tagsRepository.findOne({
      where: {
        id,
        owner: {
          id: user.id,
        },
      },
    });

    if (tag) {
      return tag;
    }

    const errors = {
      tag: TagErrorCodes.NOT_FOUND,
    };

    throw handleError(
      HttpStatus.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND('Tag', id),
      errors,
    );
  }

  async update(user: User, id: number, updateTagDto: UpdateTagDto) {
    await this.findOne(user, id);

    await this.tagsRepository.save(
      this.tagsRepository.create({
        id,
        ...updateTagDto,
      }),
    );
    return this.findOne(user, id);
  }

  async remove(user: User, id: number) {
    const tag = await this.findOne(user, id);
    await this.tagsRepository.softDelete(id);
    return tag;
  }
}
