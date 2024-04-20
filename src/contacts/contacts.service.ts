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

  async findAll(user: User) {
    const contacts = await this.contactsRepository.find({
      where: {
        owner: {
          id: user.id,
        },
      },
    });
    return contacts;
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

    return handleError(HttpStatus.NOT_FOUND, errors);
  }

  async update(user: User, id: number, updateContactDto: UpdateContactDto) {
    await this.findOne(user, id);

    const tags = updateContactDto.tags;

    if (tags && tags.length) {
      for (let i = 0; i <= tags.length - 1; i++) {
        await this.tagsService.findOne(user, tags[i].id);
      }
    }

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

    return contact;
  }
}
