import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { handleError } from '../utils/handlers/error.handler';
import { ContactErrorCodes } from '../utils/constants/contacts/errors';
import { TagsService } from '../tags/tags.service';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { genericFindManyWithPagination } from '../utils/infinity-pagination';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    private tagsService: TagsService,
  ) {}

  async create(user: User, createContactDto: CreateContactDto) {
    const contact = await this.contactsRepository.save(
      this.contactsRepository.create({
        ...createContactDto,
        owner: user,
      }),
    );
    return contact;
  }

  async findAllWithPagination(options: IPaginationOptions, user: User) {
    const baseQuery = {
      where: {
        owner: {
          id: user.id,
        },
      },
    };

    return genericFindManyWithPagination(
      this.contactsRepository,
      baseQuery,
      options,
    );
  }

  async findOne(user: User, id: number) {
    const contact = await this.contactsRepository.findOne({
      where: {
        id,
        owner: {
          id: user.id,
        },
      },
    });

    if (contact) {
      return contact;
    }

    const errors = {
      contact: ContactErrorCodes.NOT_FOUND,
    };

    throw handleError(
      HttpStatus.NOT_FOUND,
      `Contact with id ${id} could not be found`,
      errors,
    );
  }

  async update(user: User, id: number, updateContactDto: UpdateContactDto) {
    await this.findOne(user, id);

    const tags = updateContactDto.tags;

    if (tags && tags.length) {
      for (let i = 0; i <= tags.length - 1; i++) {
        await this.tagsService.findOne(user, tags[i].id);
      }
    }

    // TODO: Remove avatar from S3 before update if avatar is part of the update object
    await this.contactsRepository.save(
      this.contactsRepository.create({
        id,
        ...updateContactDto,
      }),
    );
    return this.findOne(user, id);
  }

  async remove(user: User, id: number) {
    const contact = await this.findOne(user, id);

    await this.contactsRepository.softDelete(id);
    // TODO: Remove avatar from S3 before removing contact if contact has an avatar
    // TODO: Cascade removal of all emails, phone numbers, and addresses after deletion
    return contact;
  }
}
