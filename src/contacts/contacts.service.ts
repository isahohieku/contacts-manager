import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import set from 'lodash/set';
import { Parser } from '@json2csv/plainjs';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { handleError } from '../utils/handlers/error.handler';
import { ContactErrorCodes } from '../utils/constants/contacts/errors';
import { TagsService } from '../tags/tags.service';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { genericFindManyWithPagination } from '../utils/infinity-pagination';
import { ERROR_MESSAGES } from '../utils/constants/generic/errors';
import { SearchTypes } from '../utils/types/contacts.type';
import { FilesService } from '../files/files.service';

// TODO: Bulk import and export of contacts

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    private tagsService: TagsService,
    private fileService: FilesService,
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

  async findAllWithPagination(
    options: IPaginationOptions,
    search: string,
    type: SearchTypes,
    user: User,
  ) {
    // TODO: Move this properties to utils
    const contactProperties = [
      'firstName',
      'job_title',
      'lastName',
      'notes',
      'organization',
    ];

    const addressProperties = [
      'addresses.address_type.name',
      'addresses.city',
      'addresses.street',
      'addresses.country.code',
    ];

    const emailProperties = ['emails.email_address', 'emails.email_type.name'];

    const phoneProperties = [
      'phone_numbers.phone_number',
      'phone_numbers.phone_type.name',
    ];

    const tagProperties = ['tags.name'];

    const searchTypes = {
      [SearchTypes.CONTACT]: contactProperties,
      [SearchTypes.ADDRESS]: addressProperties,
      [SearchTypes.EMAIL]: emailProperties,
      [SearchTypes.PHONE_NUMBER]: phoneProperties,
      [SearchTypes.TAG]: tagProperties,
    };

    const baseQuery: FindManyOptions<Contact> = {
      where: {
        owner: {
          id: user.id,
        },
      },
    };

    if (search && !type) {
      const allProperties = [
        ...contactProperties,
        ...addressProperties,
        ...emailProperties,
        ...phoneProperties,
        ...tagProperties,
      ];

      baseQuery.where = [
        ...allProperties.map((property) => {
          const query = {
            owner: { id: user.id },
          };
          set(query, property, ILike(`%${search}%`));
          return query;
        }),
      ];
    }

    if (search && type) {
      baseQuery.where = [
        ...[...searchTypes[type]].map((property) => {
          const query = {
            owner: { id: user.id },
          };
          set(query, property, ILike(`%${search}%`));
          return query;
        }),
      ];
    }

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
      ERROR_MESSAGES.NOT_FOUND('Contact', id),
      errors,
    );
  }

  async update(user: User, id: number, updateContactDto: UpdateContactDto) {
    await this.findOne(user, id);

    const tags = updateContactDto.tags;

    if (tags?.length) {
      await Promise.all(
        updateContactDto.tags.map((tag) =>
          this.tagsService.findOne(user, tag.id),
        ),
      );
    }

    // TODO: Remove avatar from S3 before update if avatar is part of the update object
    if (updateContactDto.avatar) {
      const existingContact = await this.findOne(user, id);
      if (
        existingContact.avatar &&
        existingContact.avatar !== updateContactDto.avatar
      ) {
        await this.fileService.removeFile(existingContact.avatar);
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
    // TODO: Remove avatar from S3 before removing contact if contact has an avatar
    // TODO: Cascade removal of all emails, phone numbers, and addresses after deletion
    return contact;
  }

  async exportContacts(user: User, id?: number) {
    const query: FindManyOptions<Contact> = {
      where: {
        owner: {
          id: user.id,
        },
      },
    };

    if (id) {
      query.where = {
        id,
        ...query.where,
      };
    }

    const contacts = await this.contactsRepository.find({
      ...query,
    });

    try {
      const opts = {};
      const parser = new Parser(opts);
      const csv = parser.parse(contacts);

      return csv;
    } catch (error) {
      const errors = {
        contact: ContactErrorCodes.CSV_GENERATION_FAILED,
      };
      throw handleError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        errors,
      );
    }
  }
}
