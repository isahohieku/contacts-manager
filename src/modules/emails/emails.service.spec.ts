import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ContactsService } from '../contacts/contacts.service';
import { EmailErrorCodes } from '@contactApp/shared/utils/constants/emails/errors';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import { mockUser, mockContact } from '../../../test/utils/test-helpers';

import { EmailsService } from './emails.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { Email } from './entities/email.entity';
import { EmailType } from '../email-types/entities/email-type.entity';

// Mock handleError
jest.mock('@contactApp/shared/utils/handlers/error.handler');

// Mock EmailType.find
jest.mock('../email-types/entities/email-type.entity', () => ({
  EmailType: {
    find: jest.fn(),
  },
}));

describe('EmailsService', () => {
  let service: EmailsService;
  let emailRepository: Repository<Email>;
  let contactsService: ContactsService;

  const mockEmail = {
    id: 1,
    email_address: 'test@example.com',
    email_type: { id: 1, name: 'Work' },
    contact: mockContact,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockEmailRepository = {
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    })),
  };

  const mockContactsService = {
    findOne: jest.fn(),
  };

  const mockEmailTypes = [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Personal' },
    { id: 3, name: 'Other' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        {
          provide: getRepositoryToken(Email),
          useValue: mockEmailRepository,
        },
        {
          provide: ContactsService,
          useValue: mockContactsService,
        },
      ],
    }).compile();

    service = module.get<EmailsService>(EmailsService);
    emailRepository = module.get<Repository<Email>>(getRepositoryToken(Email));
    contactsService = module.get<ContactsService>(ContactsService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createEmailDto: CreateEmailDto = {
      email_address: 'test@example.com',
      email_type: { id: 1 },
      contact: { id: 1 } as any,
    };

    it('should create an email successfully', async () => {
      const expectedEmail = { ...mockEmail, ...createEmailDto };

      mockContactsService.findOne.mockResolvedValue(mockContact);
      mockEmailRepository.create.mockReturnValue(expectedEmail);
      mockEmailRepository.save.mockResolvedValue(expectedEmail);

      const result = await service.create(mockUser, createEmailDto);

      expect(mockContactsService.findOne).toHaveBeenCalledWith(mockUser, createEmailDto.contact.id);
      expect(mockEmailRepository.create).toHaveBeenCalledWith(createEmailDto);
      expect(mockEmailRepository.save).toHaveBeenCalledWith(expectedEmail);
      expect(result).toEqual(expectedEmail);
    });

    it('should throw error when contact is not found', async () => {
      const mockError = new Error('Contact not found');
      mockContactsService.findOne.mockRejectedValue(mockError);

      await expect(service.create(mockUser, createEmailDto)).rejects.toThrow(mockError);

      expect(mockContactsService.findOne).toHaveBeenCalledWith(mockUser, createEmailDto.contact.id);
      expect(mockEmailRepository.create).not.toHaveBeenCalled();
      expect(mockEmailRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const emailId = 1;

    it('should return email when found', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockEmail),
      };
      
      mockEmailRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findOne(mockUser, emailId);

      expect(mockEmailRepository.createQueryBuilder).toHaveBeenCalledWith('email');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('email.contact', 'contact');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('email.email_type', 'email_type');
      expect(queryBuilder.where).toHaveBeenCalledWith('email.id = :id', { id: emailId });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('contact.owner.id = :userId', { userId: mockUser.id });
      expect(queryBuilder.select).toHaveBeenCalledWith(['email', 'contact.id', 'email_type']);
      expect(result).toEqual(mockEmail);
    });

    it('should throw error when email not found', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      
      mockEmailRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      const mockError = new Error('Email not found');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(service.findOne(mockUser, emailId)).rejects.toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_FOUND('Email', emailId),
        {
          email: EmailErrorCodes.NOT_FOUND,
        },
      );
    });
  });

  describe('update', () => {
    const emailId = 1;
    const updateEmailDto: UpdateEmailDto = {
      email_address: 'updated@example.com',
      email_type: { id: 2 },
    };

    it('should update email successfully', async () => {
      const updatedEmail = { ...mockEmail, ...updateEmailDto };

      // Mock findOne calls
      service.findOne = jest.fn()
        .mockResolvedValueOnce(mockEmail) // First call in update method
        .mockResolvedValueOnce(updatedEmail); // Second call to return updated email

      mockEmailRepository.create.mockReturnValue({ id: emailId, ...updateEmailDto });
      mockEmailRepository.save.mockResolvedValue(updatedEmail);

      const result = await service.update(mockUser, emailId, updateEmailDto);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, emailId);
      expect(mockEmailRepository.create).toHaveBeenCalledWith({
        id: emailId,
        ...updateEmailDto,
      });
      expect(mockEmailRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedEmail);
    });

    it('should throw error when email not found for update', async () => {
      const mockError = new Error('Email not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(service.update(mockUser, emailId, updateEmailDto)).rejects.toThrow(mockError);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, emailId);
      expect(mockEmailRepository.create).not.toHaveBeenCalled();
      expect(mockEmailRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const emailId = 1;

    it('should remove email successfully', async () => {
      service.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockEmailRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(mockUser, emailId);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, emailId);
      expect(mockEmailRepository.softDelete).toHaveBeenCalledWith(emailId);
      expect(result).toEqual(mockEmail);
    });

    it('should throw error when email not found for removal', async () => {
      const mockError = new Error('Email not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(service.remove(mockUser, emailId)).rejects.toThrow(mockError);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, emailId);
      expect(mockEmailRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getEmailTypes', () => {
    it('should return all email types', async () => {
      (EmailType.find as jest.Mock).mockResolvedValue(mockEmailTypes);

      const result = await service.getEmailTypes();

      expect(EmailType.find).toHaveBeenCalled();
      expect(result).toEqual(mockEmailTypes);
    });

    it('should handle empty email types', async () => {
      (EmailType.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getEmailTypes();

      expect(EmailType.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
