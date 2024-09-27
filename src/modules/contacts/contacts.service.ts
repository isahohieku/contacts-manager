import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import set from 'lodash/set';
import stream from 'stream';
import { Parser } from '@json2csv/plainjs';
import { CsvParser, ParsedData } from 'nest-csv-parser';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { handleError } from '../../shared/utils/handlers/error.handler';
import { ContactErrorCodes } from '../../shared/utils/constants/contacts/errors';
import { TagsService } from '../tags/tags.service';
import { IPaginationOptions } from '../../shared/utils/types/pagination-options';
import { genericFindManyWithPagination } from '../../shared/utils/infinity-pagination';
import { ERROR_MESSAGES } from '../../shared/utils/constants/generic/errors';
import { SearchTypes } from '../../shared/utils/types/contacts.type';
import { FilesService } from '../files/files.service';
import { allProperties, searchTypes } from '../../shared/utils/contact/helper';
import {
  detectSeparator,
  processContactCleanup,
} from '../../shared/utils/contact/contact-cleaning-helper';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    private readonly tagsService: TagsService,
    private readonly fileService: FilesService,
    private readonly csvParser: CsvParser,
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
    const baseQuery: FindManyOptions<Contact> = {
      where: {
        owner: {
          id: user.id,
        },
      },
    };

    // TODO: Improve search performance
    if (search && !type) {
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
    const existingContact = await this.findOne(user, id);

    const tags = updateContactDto.tags;

    if (tags?.length) {
      await Promise.all(
        updateContactDto.tags.map((tag) =>
          this.tagsService.findOne(user, tag.id),
        ),
      );
    }

    if (
      updateContactDto.avatar &&
      existingContact.avatar &&
      existingContact.avatar.id !== updateContactDto.avatar.id
    ) {
      await this.fileService.removeFile(user, existingContact.avatar.path);
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

  async importContacts(user: User, file) {
    // Creates an initial buffer stream for separator detection
    const bufferStreamForSeparator = new stream.PassThrough();
    bufferStreamForSeparator.end(file instanceof Buffer ? file : file.buffer);

    // Creates a second buffer stream for CSV parsing
    const bufferStreamForParser = new stream.PassThrough();
    bufferStreamForParser.end(file instanceof Buffer ? file : file.buffer);

    try {
      const separator = await detectSeparator(bufferStreamForSeparator);

      const { list: contacts }: ParsedData<Contact> =
        await this.csvParser.parse(bufferStreamForParser, Contact, null, null, {
          separator,
        });

      const parsedContacts = processContactCleanup<Contact[]>(contacts);

      const contactsWithOwner = parsedContacts.map((contact) => ({
        ...contact,
        owner: user,
      }));

      // TODO: Improve bulk insert performance by queueing multiple inserts and sending done feedback via SSE
      await this.contactsRepository
        .createQueryBuilder()
        .insert()
        .into(Contact)
        .values(contactsWithOwner[contactsWithOwner.length - 1])
        .orIgnore()
        .execute();

      return {
        message: 'Contacts imported successfully',
      };
    } catch (error) {
      const errors = {
        contact: ContactErrorCodes.CSV_IMPORT_FAILED,
      };
      throw handleError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        errors,
      );
    }
  }
}
