import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { SearchTypes } from '@contactApp/shared/utils/types/contacts.type';

import { User } from '../users/entity/user.entity';

import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

describe('ContactsController', () => {
  let controller: ContactsController;
  let contactsService: ContactsService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  } as User;

  const mockContact = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    organization: 'Test Company',
    job_title: 'Developer',
    owner: mockUser,
    phone_numbers: [],
    emails: [],
    addresses: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as any;

  const mockContactsService = {
    create: jest.fn(),
    findAllWithPagination: jest.fn(),
    exportContacts: jest.fn(),
    importContacts: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: mockContactsService,
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    contactsService = module.get<ContactsService>(ContactsService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new contact', async () => {
      const createContactDto: CreateContactDto = {
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Test Company',
        job_title: 'Developer',
      };

      const request = { user: mockUser };
      mockContactsService.create.mockResolvedValue(mockContact);

      const result = await controller.create(request, createContactDto);

      expect(mockContactsService.create).toHaveBeenCalledWith(
        mockUser,
        createContactDto,
      );
      expect(result).toBe(mockContact);
    });

    it('should handle create with minimal data', async () => {
      const createContactDto: CreateContactDto = {
        firstName: 'Jane',
      };

      const request = { user: mockUser };
      const expectedContact = {
        ...mockContact,
        firstName: 'Jane',
        lastName: null,
      };
      mockContactsService.create.mockResolvedValue(expectedContact);

      const result = await controller.create(request, createContactDto);

      expect(mockContactsService.create).toHaveBeenCalledWith(
        mockUser,
        createContactDto,
      );
      expect(result).toBe(expectedContact);
    });

    it('should handle create with all optional fields', async () => {
      const createContactDto: CreateContactDto = {
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Test Company',
        job_title: 'Senior Developer',
        birthday: new Date('1990-01-01'),
        anniversary: new Date('2020-06-15'),
        notes: 'Important client contact',
      };

      const request = { user: mockUser };
      const expectedContact = { ...mockContact, ...createContactDto };
      mockContactsService.create.mockResolvedValue(expectedContact);

      const result = await controller.create(request, createContactDto);

      expect(mockContactsService.create).toHaveBeenCalledWith(
        mockUser,
        createContactDto,
      );
      expect(result).toBe(expectedContact);
    });
  });

  describe('findAll', () => {
    it('should return paginated contacts with default parameters', async () => {
      const request = { user: mockUser };
      const expectedResult = {
        data: [mockContact],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockContactsService.findAllWithPagination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAll(
        request,
        1,
        10,
        '',
        undefined as any,
      );

      expect(mockContactsService.findAllWithPagination).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        '',
        undefined,
        mockUser,
      );
      expect(result).toBe(expectedResult);
    });

    it('should return paginated contacts with search term', async () => {
      const request = { user: mockUser };
      const searchTerm = 'John';
      const expectedResult = {
        data: [mockContact],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockContactsService.findAllWithPagination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAll(
        request,
        1,
        10,
        searchTerm,
        undefined as any,
      );

      expect(mockContactsService.findAllWithPagination).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        searchTerm,
        undefined,
        mockUser,
      );
      expect(result).toBe(expectedResult);
    });

    it('should return paginated contacts with search type', async () => {
      const request = { user: mockUser };
      const searchType = SearchTypes.EMAIL;
      const expectedResult = {
        data: [mockContact],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockContactsService.findAllWithPagination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAll(request, 1, 10, '', searchType);

      expect(mockContactsService.findAllWithPagination).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        '',
        searchType,
        mockUser,
      );
      expect(result).toBe(expectedResult);
    });

    it('should limit page size to maximum of 50', async () => {
      const request = { user: mockUser };
      const expectedResult = {
        data: [mockContact],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 50,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockContactsService.findAllWithPagination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAll(
        request,
        1,
        100,
        '',
        undefined as any,
      );

      expect(mockContactsService.findAllWithPagination).toHaveBeenCalledWith(
        { page: 1, limit: 50 }, // Should be capped at 50
        '',
        undefined,
        mockUser,
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle custom page and limit', async () => {
      const request = { user: mockUser };
      const expectedResult = {
        data: [mockContact],
        meta: {
          totalItems: 25,
          itemCount: 20,
          itemsPerPage: 20,
          totalPages: 2,
          currentPage: 2,
        },
      };

      mockContactsService.findAllWithPagination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAll(
        request,
        2,
        20,
        '',
        undefined as any,
      );

      expect(mockContactsService.findAllWithPagination).toHaveBeenCalledWith(
        { page: 2, limit: 20 },
        '',
        undefined,
        mockUser,
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle search with type and term', async () => {
      const request = { user: mockUser };
      const searchTerm = 'john@example.com';
      const searchType = SearchTypes.EMAIL;
      const expectedResult = {
        data: [mockContact],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockContactsService.findAllWithPagination.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAll(
        request,
        1,
        10,
        searchTerm,
        searchType,
      );

      expect(mockContactsService.findAllWithPagination).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        searchTerm,
        searchType,
        mockUser,
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe('exportContacts', () => {
    it('should export all contacts when no ID provided', async () => {
      const request = { user: mockUser };
      const response = {
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const csvData = 'firstName,lastName,organization\nJohn,Doe,Test Company';
      mockContactsService.exportContacts.mockResolvedValue(csvData);

      await controller.exportContacts(request, response, undefined);

      expect(mockContactsService.exportContacts).toHaveBeenCalledWith(
        mockUser,
        undefined,
      );
      expect(response.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(response.attachment).toHaveBeenCalledWith('contacts.csv');
      expect(response.send).toHaveBeenCalledWith(csvData);
    });

    it('should export specific contact when ID provided', async () => {
      const request = { user: mockUser };
      const response = {
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const contactId = '1';
      const csvData = 'firstName,lastName,organization\nJohn,Doe,Test Company';
      mockContactsService.exportContacts.mockResolvedValue(csvData);

      await controller.exportContacts(request, response, contactId);

      expect(mockContactsService.exportContacts).toHaveBeenCalledWith(
        mockUser,
        +contactId,
      );
      expect(response.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(response.attachment).toHaveBeenCalledWith('contacts.csv');
      expect(response.send).toHaveBeenCalledWith(csvData);
    });
  });

  describe('importContacts', () => {
    it('should import contacts from uploaded file', async () => {
      const request = { user: mockUser };
      const file = {
        buffer: Buffer.from('firstName,lastName\nJohn,Doe'),
        originalname: 'contacts.csv',
        mimetype: 'text/csv',
      };

      const expectedResult = {
        message: 'Contacts imported successfully',
      };

      mockContactsService.importContacts.mockResolvedValue(expectedResult);

      const result = await controller.importContacts(request, file);

      expect(mockContactsService.importContacts).toHaveBeenCalledWith(
        mockUser,
        file,
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle import with different file types', async () => {
      const request = { user: mockUser };
      const file = {
        buffer: Buffer.from('firstName;lastName\nJane;Smith'),
        originalname: 'contacts.csv',
        mimetype: 'text/csv',
      };

      const expectedResult = {
        message: 'Contacts imported successfully',
      };

      mockContactsService.importContacts.mockResolvedValue(expectedResult);

      const result = await controller.importContacts(request, file);

      expect(mockContactsService.importContacts).toHaveBeenCalledWith(
        mockUser,
        file,
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a specific contact by ID', async () => {
      const request = { user: mockUser };
      const contactId = '1';

      mockContactsService.findOne.mockResolvedValue(mockContact);

      const result = await controller.findOne(request, contactId);

      expect(mockContactsService.findOne).toHaveBeenCalledWith(
        mockUser,
        +contactId,
      );
      expect(result).toBe(mockContact);
    });

    it('should handle string ID conversion to number', async () => {
      const request = { user: mockUser };
      const contactId = '123';

      mockContactsService.findOne.mockResolvedValue(mockContact);

      const result = await controller.findOne(request, contactId);

      expect(mockContactsService.findOne).toHaveBeenCalledWith(mockUser, 123);
      expect(result).toBe(mockContact);
    });
  });

  describe('update', () => {
    it('should update a contact', async () => {
      const request = { user: mockUser };
      const contactId = '1';
      const updateContactDto: UpdateContactDto = {
        firstName: 'Jane',
        organization: 'Updated Company',
      };

      const updatedContact = { ...mockContact, ...updateContactDto };
      mockContactsService.update.mockResolvedValue(updatedContact);

      const result = await controller.update(
        request,
        contactId,
        updateContactDto,
      );

      expect(mockContactsService.update).toHaveBeenCalledWith(
        mockUser,
        +contactId,
        updateContactDto,
      );
      expect(result).toBe(updatedContact);
    });

    it('should handle partial updates', async () => {
      const request = { user: mockUser };
      const contactId = '1';
      const updateContactDto: UpdateContactDto = {
        job_title: 'Senior Developer',
      };

      const updatedContact = { ...mockContact, job_title: 'Senior Developer' };
      mockContactsService.update.mockResolvedValue(updatedContact);

      const result = await controller.update(
        request,
        contactId,
        updateContactDto,
      );

      expect(mockContactsService.update).toHaveBeenCalledWith(
        mockUser,
        +contactId,
        updateContactDto,
      );
      expect(result).toBe(updatedContact);
    });

    it('should handle updates with tags', async () => {
      const request = { user: mockUser };
      const contactId = '1';
      const updateContactDto: UpdateContactDto = {
        firstName: 'John',
        tags: [{ id: 1, name: 'Important' } as any],
      };

      const updatedContact = { ...mockContact, ...updateContactDto };
      mockContactsService.update.mockResolvedValue(updatedContact);

      const result = await controller.update(
        request,
        contactId,
        updateContactDto,
      );

      expect(mockContactsService.update).toHaveBeenCalledWith(
        mockUser,
        +contactId,
        updateContactDto,
      );
      expect(result).toBe(updatedContact);
    });
  });

  describe('remove', () => {
    it('should remove a contact', async () => {
      const request = { user: mockUser };
      const contactId = '1';

      const expectedResult = { message: 'Contact deleted successfully' };
      mockContactsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(request, contactId);

      expect(mockContactsService.remove).toHaveBeenCalledWith(
        mockUser,
        +contactId,
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle string ID conversion for removal', async () => {
      const request = { user: mockUser };
      const contactId = '456';

      const expectedResult = { message: 'Contact deleted successfully' };
      mockContactsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(request, contactId);

      expect(mockContactsService.remove).toHaveBeenCalledWith(mockUser, 456);
      expect(result).toBe(expectedResult);
    });
  });
});
