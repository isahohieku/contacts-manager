import stream from 'stream';

import { Parser } from '@json2csv/plainjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import set from 'lodash/set';
import { CsvParser, ParsedData } from 'nest-csv-parser';
import { FindManyOptions, ILike, Repository } from 'typeorm';

import { ContactErrorCodes } from '@contactApp/shared/utils/constants/contacts/errors';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import {
  detectSeparator,
  processContactCleanup,
} from '@contactApp/shared/utils/contact/contact-cleaning-helper';
import {
  allProperties,
  searchTypes,
} from '@contactApp/shared/utils/contact/helper';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import {
  genericFindManyWithPagination,
  IPaginationResult,
} from '@contactApp/shared/utils/infinity-pagination';
import { SearchTypes } from '@contactApp/shared/utils/types/contacts.type';
import { IPaginationOptions } from '@contactApp/shared/utils/types/pagination-options';

import { CacheService } from '../../common/services/cache.service';
import { FilesService } from '../files/files.service';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entity/user.entity';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class ContactsService {
  /**
   * Initializes a new instance of the ContactsService class.
   *
   * @param {Repository<Contact>} contactsRepository - The repository for contacts.
   * @param {TagsService} tagsService - The service for tags.
   * @param {FilesService} fileService - The service for files.
   * @param {CsvParser} csvParser - The parser for CSV data.
   */
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    private readonly tagsService: TagsService,
    private readonly fileService: FilesService,
    private readonly csvParser: CsvParser,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Creates a new contact in the database.
   *
   * @param {User} user - The user who owns the contact.
   * @param {CreateContactDto} createContactDto - The data transfer object containing the contact's details.
   * @return {Promise<Contact>} The newly created contact.
   */
  async create(
    user: User,
    createContactDto: CreateContactDto,
  ): Promise<Contact> {
    const contact = await this.contactsRepository.save(
      this.contactsRepository.create({
        ...createContactDto,
        owner: user,
      }),
    );

    // Invalidate contacts cache for this user
    await this.cacheService.invalidateContactsCache(user.id);

    return contact;
  }

  /**
   * Retrieves a list of contacts with pagination, filtered by the provided search term and type.
   *
   * @param options - The pagination options.
   * @param search - The search term to filter contacts by.
   * @param type - The type of search to perform.
   * @param user - The user who owns the contacts.
   * @return The paginated list of contacts matching the search criteria.
   */
  async findAllWithPagination(
    options: IPaginationOptions,
    search: string,
    type: SearchTypes,
    user: User,
  ): Promise<IPaginationResult<Contact>> {
    // Generate cache key
    const cacheKey = this.cacheService.generateContactsCacheKey(
      user.id,
      options.page,
      options.limit,
      search,
      type,
    );

    // Try to get from cache first
    const cachedResult =
      await this.cacheService.get<IPaginationResult<Contact>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const baseQuery: FindManyOptions<Contact> = {
      where: {
        owner: {
          id: user.id,
        },
      },
      relations: ['phone_numbers', 'emails', 'addresses', 'tags', 'avatar'], // Optimize relations loading
    };

    // TODO: Improve search performance with database indexes
    // TODO: Add sorting feature
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

    const result = await genericFindManyWithPagination(
      this.contactsRepository,
      baseQuery,
      options,
    );

    // Cache the result for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Retrieves a single contact by its ID, belonging to the specified user.
   *
   * @param {User} user - The user who owns the contact.
   * @param {number} id - The ID of the contact to retrieve.
   * @returns {Contact | undefined} The contact if found, or undefined if not found.
   * @throws {Error} If the contact is not found, with a NOT_FOUND status code.
   */
  async findOne(user: User, id: number): Promise<Contact> {
    // Generate cache key
    const cacheKey = this.cacheService.generateContactCacheKey(id);

    // Try to get from cache first
    const cachedContact = await this.cacheService.get<Contact>(cacheKey);
    if (cachedContact) {
      return cachedContact;
    }

    const contact = await this.contactsRepository.findOne({
      where: {
        id,
        owner: {
          id: user.id,
        },
      },
      relations: ['phone_numbers', 'emails', 'addresses', 'tags', 'avatar'],
    });

    if (contact) {
      // Cache the contact for 10 minutes
      await this.cacheService.set(cacheKey, contact, 600);
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

  /**
   * Updates a single contact by its ID, belonging to the specified user.
   *
   * @param {User} user - The user who owns the contact.
   * @param {number} id - The ID of the contact to update.
   * @param {UpdateContactDto} updateContactDto - The updated contact data.
   * @returns {Promise<Contact | undefined>} The updated contact if found, or undefined if not found.
   */
  async update(
    user: User,
    id: number,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    const existingContact = await this.findOne(user, id);
    const tags = updateContactDto.tags;

    // Validate and fetch full tag entities if tags are being updated
    let validatedTags: Tag[] | undefined;
    if (tags?.length) {
      validatedTags = await Promise.all(
        updateContactDto.tags?.map((tag) =>
          this.tagsService.findOne(user, tag.id),
        ) || [],
      );
    }

    if (
      updateContactDto.avatar &&
      existingContact.avatar?.id !== updateContactDto.avatar.id
    ) {
      if (existingContact.avatar) {
        await this.fileService.removeFile(user, existingContact.avatar.path);
      }
    }

    // Merge the existing contact with the update data
    const updateData = { ...updateContactDto };

    // If tags were validated, use the full tag entities instead of just IDs
    if (validatedTags) {
      updateData.tags = validatedTags;
    }

    const updatedContact = this.contactsRepository.merge(
      existingContact,
      updateData,
    );

    await this.contactsRepository.save(updatedContact);

    return this.findOne(user, id);
  }

  /**
   * Removes a single contact by its ID, belonging to the specified user.
   *
   * @param {User} user - The user who owns the contact.
   * @param {number} id - The ID of the contact to remove.
   * @return {Contact | undefined} The removed contact if found, or undefined if not found.
   */
  async remove(user: User, id: number): Promise<Contact> {
    const contact = await this.findOne(user, id);

    await this.contactsRepository.softDelete(id);
    // TODO: Remove avatar from S3 before removing contact if contact has an avatar
    // TODO: Cascade removal of all emails, phone numbers, and addresses after deletion
    return contact;
  }

  /**
   * Export contacts as a CSV string
   *
   * This function takes a user (the owner of the contacts) and an optional contact ID.
   * If the contact ID is provided, only that contact will be exported.
   * If the contact ID is not provided, all contacts belonging to the user will be exported.
   *
   * @param {User} owner - The user who owns the contacts to export
   * @param {number} [contactId] - Optional: The ID of the contact to export. If not provided,
   *                              all contacts belonging to the user will be exported.
   * @return {string} The CSV string containing the exported contacts
   */
  async exportContacts(owner: User, contactId?: number): Promise<string> {
    const query: FindManyOptions<Contact> = {
      // This where clause is used to filter the contacts to export.
      // It will only export contacts that belong to the specified user.
      where: {
        // The user who owns the contact
        owner: { id: owner.id },
      },
    };

    if (contactId) {
      // If a contact ID is provided, update the where clause to only export that contact
      query.where = {
        // The contact ID to export
        id: contactId,
        // The owner of the contact must match the original where clause
        ...query.where,
      };
    }

    const contacts = await this.contactsRepository.find(query);

    try {
      // Create a new parser with the default options
      const parser = new Parser({});

      // Parse the contacts into a CSV string
      const csv = parser.parse(contacts);

      // Return the CSV string
      return csv;
    } catch {
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

  /**
   * Asynchronously imports contacts from a CSV file and associates them with a user.
   *
   * @throws {Error} If there is an error importing the contacts.
   */
  async importContacts(
    user: User,
    file: MulterFile | Buffer,
  ): Promise<{ message: string }> {
    // Creates an initial buffer stream for separator detection
    const bufferStreamForSeparator = new stream.PassThrough();
    bufferStreamForSeparator.end(file instanceof Buffer ? file : file.buffer);

    // Creates a second buffer stream for CSV parsing
    const bufferStreamForParser = new stream.PassThrough();
    bufferStreamForParser.end(file instanceof Buffer ? file : file.buffer);

    try {
      const separator = await detectSeparator(bufferStreamForSeparator);

      const { list: contacts }: ParsedData<Contact> =
        await this.csvParser.parse(
          bufferStreamForParser,
          Contact,
          undefined,
          undefined,
          {
            separator,
          },
        );

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
    } catch {
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
