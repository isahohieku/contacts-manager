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
  ) {}

  /**
   * Creates a new contact in the database.
   *
   * @param {User} user - The user who owns the contact.
   * @param {CreateContactDto} createContactDto - The data transfer object containing the contact's details.
   * @return {Promise<Contact>} The newly created contact.
   */
  async create(user: User, createContactDto: CreateContactDto) {
    const contact = await this.contactsRepository.save(
      this.contactsRepository.create({
        ...createContactDto,
        owner: user,
      }),
    );
    return contact;
  }

  /**
   * Retrieves a list of contacts with pagination, filtered by the provided search term and type.
   *
   * @param {IPaginationOptions} options - The pagination options.
   * @param {string} search - The search term to filter contacts by.
   * @param {SearchTypes} type - The type of search to perform.
   * @param {User} user - The user who owns the contacts.
   * @return {Promise<Contact[]>} The list of contacts matching the search criteria.
   */
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

  /**
   * Retrieves a single contact by its ID, belonging to the specified user.
   *
   * @param {User} user - The user who owns the contact.
   * @param {number} id - The ID of the contact to retrieve.
   * @returns {Contact | undefined} The contact if found, or undefined if not found.
   * @throws {Error} If the contact is not found, with a NOT_FOUND status code.
   */
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

  /**
   * Updates a single contact by its ID, belonging to the specified user.
   *
   * @param {User} user - The user who owns the contact.
   * @param {number} id - The ID of the contact to update.
   * @param {UpdateContactDto} updateContactDto - The updated contact data.
   * @returns {Promise<Contact | undefined>} The updated contact if found, or undefined if not found.
   */
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
      existingContact.avatar?.id !== updateContactDto.avatar.id
    ) {
      if (existingContact.avatar) {
        await this.fileService.removeFile(user, existingContact.avatar.path);
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

  /**
   * Removes a single contact by its ID, belonging to the specified user.
   *
   * @param {User} user - The user who owns the contact.
   * @param {number} id - The ID of the contact to remove.
   * @return {Contact | undefined} The removed contact if found, or undefined if not found.
   */
  async remove(user: User, id: number) {
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

  /**
   * Asynchronously imports contacts from a CSV file and associates them with a user.
   *
   * @param {User} user - The user to associate the imported contacts with.
   * @param {Buffer|File} file - The CSV file containing the contacts to import.
   * @return {Promise<{message: string}>} A promise that resolves to an object with a success message.
   * @throws {Error} If there is an error importing the contacts.
   */
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
