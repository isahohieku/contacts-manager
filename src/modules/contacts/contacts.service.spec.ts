import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CsvParser } from 'nest-csv-parser';

import {
  createMockRepository,
  createMockCacheService,
  mockUser,
  mockContact,
} from '../../../test/utils/test-helpers';
import { CacheService } from '../../common/services/cache.service';
import { SearchTypes } from '../../shared/utils/types/contacts.type';
import { FilesService } from '../files/files.service';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/entity/user.entity';

import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

describe('ContactsService', () => {
  let service: ContactsService;

  const mockContactRepository = createMockRepository<Contact>();
  const mockCacheService = createMockCacheService();
  const mockTagsService = {
    findByIds: jest.fn(),
    create: jest.fn(),
  };
  const mockFilesService = {
    findOne: jest.fn(),
  };
  const mockCsvParser = {
    parse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(Contact),
          useValue: mockContactRepository,
        },
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: CsvParser,
          useValue: mockCsvParser,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a contact successfully', async () => {
      const createContactDto: CreateContactDto = {
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Test Company',
        job_title: 'Developer',
      };

      const savedContact = { ...mockContact, ...createContactDto };
      (mockContactRepository.create as jest.Mock).mockReturnValue(savedContact);
      (mockContactRepository.save as jest.Mock).mockResolvedValue(savedContact);

      const result = await service.create(
        mockUser as unknown as User,
        createContactDto,
      );

      expect(mockContactRepository.create).toHaveBeenCalledWith({
        ...createContactDto,
        owner: mockUser,
      });
      expect(mockContactRepository.save).toHaveBeenCalledWith(savedContact);
      expect(mockCacheService.invalidateContactsCache).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual(savedContact);
    });
  });

  describe('findAllWithPagination', () => {
    it('should return cached results if available', async () => {
      const page = 1;
      const limit = 10;
      const search = '';
      const type = SearchTypes.CONTACT;
      const cachedResult = {
        data: [mockContact],
        metadata: {
          page,
          items_per_page: limit,
          total_items: 1,
          total_pages: 1,
          hasNextPage: false,
        },
      };

      (mockCacheService.get as jest.Mock).mockResolvedValue(cachedResult);

      const result = await service.findAllWithPagination(
        { page, limit },
        search,
        type,
        mockUser as unknown as User,
      );

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should fetch from database and cache results when cache miss', async () => {
      const page = 1;
      const limit = 10;
      const search = '';
      const type = SearchTypes.CONTACT;
      const contacts = [mockContact];
      const total = 1;
      const mockResult = {
        data: contacts,
        metadata: {
          page,
          items_per_page: limit,
          total_items: total,
          total_pages: 1,
          hasNextPage: false,
        },
      };

      (mockCacheService.get as jest.Mock).mockResolvedValue(null);
      (mockContactRepository.count as jest.Mock).mockResolvedValue(total);
      (mockContactRepository.find as jest.Mock).mockResolvedValue(contacts);

      const result = await service.findAllWithPagination(
        { page, limit },
        search,
        type,
        mockUser as unknown as User,
      );

      expect(mockCacheService.set).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return cached contact if available', async () => {
      const contactId = 1;
      (mockCacheService.get as jest.Mock).mockResolvedValue(mockContact);

      const result = await service.findOne(
        mockUser as unknown as User,
        contactId,
      );

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(result).toEqual(mockContact);
    });

    it('should fetch from database and cache when cache miss', async () => {
      const contactId = 1;
      (mockCacheService.get as jest.Mock).mockResolvedValue(null);
      (mockContactRepository.findOne as jest.Mock).mockResolvedValue(
        mockContact,
      );

      const result = await service.findOne(
        mockUser as unknown as User,
        contactId,
      );

      expect(mockContactRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: contactId,
          owner: {
            id: mockUser.id,
          },
        },
        relations: ['phone_numbers', 'emails', 'addresses', 'tags', 'avatar'],
      });
      expect(mockCacheService.set).toHaveBeenCalled();
      expect(result).toEqual(mockContact);
    });

    it('should throw error when contact not found', async () => {
      const contactId = 999;
      (mockCacheService.get as jest.Mock).mockResolvedValue(null);
      (mockContactRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findOne(mockUser as unknown as User, contactId),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a contact successfully', async () => {
      const contactId = 1;
      const updateContactDto: UpdateContactDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const existingContact = {
        ...mockContact,
      } as unknown as Contact;

      const updatedContact = {
        ...existingContact,
        ...updateContactDto,
        tags: updateContactDto.tags || [],
      } as unknown as Contact;

      // Mock findOne to return the existing contact (called twice - once in update, once at the end)
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existingContact) // First call in update method
        .mockResolvedValueOnce(updatedContact); // Second call at the end of update method

      (mockContactRepository.merge as jest.Mock).mockReturnValue(
        updatedContact,
      );
      (mockContactRepository.save as jest.Mock).mockResolvedValue(
        updatedContact,
      );

      const result = await service.update(
        mockUser as unknown as User,
        contactId,
        updateContactDto,
      );

      expect(mockContactRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedContact);
    });

    it('should throw error when contact not found', async () => {
      const contactId = 999;
      const updateContactDto: UpdateContactDto = { firstName: 'Jane' };

      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new Error('Contact not found'));

      await expect(
        service.update(
          mockUser as unknown as User,
          contactId,
          updateContactDto,
        ),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove a contact successfully', async () => {
      const contactId = 1;
      const existingContact = {
        ...mockContact,
      } as unknown as Contact;

      jest.spyOn(service, 'findOne').mockResolvedValue(existingContact);
      (mockContactRepository.softDelete as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await service.remove(
        mockUser as unknown as User,
        contactId,
      );

      expect(mockContactRepository.softDelete).toHaveBeenCalledWith(contactId);
      expect(result).toEqual(existingContact);
    });

    it('should throw error when contact not found', async () => {
      const contactId = 999;

      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new Error('Contact not found'));

      await expect(
        service.remove(mockUser as unknown as User, contactId),
      ).rejects.toThrow();
    });
  });
});
