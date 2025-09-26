import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { PhoneNumberErrorCodes } from '@contactApp/shared/utils/constants/phone-numbers/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import { validatePhoneNumber } from '@contactApp/shared/utils/validators/phone-number';

import { mockUser, mockContact } from '../../../test/utils/test-helpers';
import { ContactsService } from '../contacts/contacts.service';
import { Contact } from '../contacts/entities/contact.entity';
import { PhoneType } from '../phone-types/entities/phone-type.entity';
import { User } from '../users/entity/user.entity';

import { CreatePhoneDto } from './dto/create-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { Phone } from './entities/phone.entity';
import { PhonesService } from './phones.service';

// Mock handleError
jest.mock('@contactApp/shared/utils/handlers/error.handler');

// Mock validatePhoneNumber
jest.mock('@contactApp/shared/utils/validators/phone-number');

// Mock PhoneType.find
jest.mock('../phone-types/entities/phone-type.entity', () => ({
  PhoneType: {
    find: jest.fn(),
  },
}));

describe('PhonesService', () => {
  let service: PhonesService;

  // Create properly typed test user
  const testUser = mockUser as unknown as User;

  const mockPhone = {
    id: 1,
    phone_number: '+2348036133002',
    phone_type: { id: 1, name: 'Mobile' },
    contact: mockContact,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPhoneRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
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

  const mockPhoneTypes = [
    { id: 1, name: 'Mobile' },
    { id: 2, name: 'Home' },
    { id: 3, name: 'Work' },
    { id: 4, name: 'Other' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhonesService,
        {
          provide: getRepositoryToken(Phone),
          useValue: mockPhoneRepository,
        },
        {
          provide: ContactsService,
          useValue: mockContactsService,
        },
      ],
    }).compile();

    service = module.get<PhonesService>(PhonesService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPhoneDto: CreatePhoneDto = {
      phone_number: '+2348036133002',
      phone_type: { id: 1 },
      contact: { id: 1 } as Contact,
    };

    it('should create a phone successfully without validation', async () => {
      const expectedPhone = { ...mockPhone, ...createPhoneDto };

      mockContactsService.findOne.mockResolvedValue(mockContact);
      mockPhoneRepository.create.mockReturnValue(expectedPhone);
      mockPhoneRepository.save.mockResolvedValue(expectedPhone);

      const result = await service.create(testUser, createPhoneDto, false);

      expect(mockContactsService.findOne).toHaveBeenCalledWith(
        testUser,
        createPhoneDto.contact.id,
      );
      expect(mockPhoneRepository.create).toHaveBeenCalledWith(createPhoneDto);
      expect(mockPhoneRepository.save).toHaveBeenCalledWith(expectedPhone);
      expect(validatePhoneNumber).not.toHaveBeenCalled();
      expect(result).toEqual(expectedPhone);
    });

    it('should create a phone successfully with validation when phone is valid', async () => {
      const expectedPhone = { ...mockPhone, ...createPhoneDto };

      (validatePhoneNumber as jest.Mock).mockReturnValue(true);
      mockContactsService.findOne.mockResolvedValue(mockContact);
      mockPhoneRepository.create.mockReturnValue(expectedPhone);
      mockPhoneRepository.save.mockResolvedValue(expectedPhone);

      const result = await service.create(testUser, createPhoneDto, true);

      expect(validatePhoneNumber).toHaveBeenCalledWith(
        createPhoneDto.phone_number,
        testUser.country,
      );
      expect(mockContactsService.findOne).toHaveBeenCalledWith(
        testUser,
        createPhoneDto.contact.id,
      );
      expect(mockPhoneRepository.create).toHaveBeenCalledWith(createPhoneDto);
      expect(mockPhoneRepository.save).toHaveBeenCalledWith(expectedPhone);
      expect(result).toEqual(expectedPhone);
    });

    it('should throw error when phone validation fails', async () => {
      (validatePhoneNumber as jest.Mock).mockReturnValue(false);
      const mockError = new Error('Invalid phone number');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(
        service.create(testUser, createPhoneDto, true),
      ).rejects.toThrow(mockError);

      expect(validatePhoneNumber).toHaveBeenCalledWith(
        createPhoneDto.phone_number,
        testUser.country,
      );
      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.INVALID('Phone Number'),
        {
          phone: PhoneNumberErrorCodes.INVALID,
        },
      );
      expect(mockContactsService.findOne).not.toHaveBeenCalled();
      expect(mockPhoneRepository.create).not.toHaveBeenCalled();
      expect(mockPhoneRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when contact is not found', async () => {
      const mockError = new Error('Contact not found');
      mockContactsService.findOne.mockRejectedValue(mockError);

      await expect(
        service.create(testUser, createPhoneDto, false),
      ).rejects.toThrow(mockError);

      expect(mockContactsService.findOne).toHaveBeenCalledWith(
        testUser,
        createPhoneDto.contact.id,
      );
      expect(mockPhoneRepository.create).not.toHaveBeenCalled();
      expect(mockPhoneRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const phoneId = 1;

    it('should return phone when found', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPhone),
      };

      mockPhoneRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findOne(testUser, phoneId);

      expect(mockPhoneRepository.createQueryBuilder).toHaveBeenCalledWith(
        'phone',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'phone.contact',
        'contact',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'phone.phone_type',
        'phone_type',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('phone.id = :id', {
        id: phoneId,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'contact.owner.id = :userId',
        { userId: testUser.id },
      );
      expect(queryBuilder.select).toHaveBeenCalledWith([
        'phone',
        'contact',
        'phone_type',
      ]);
      expect(result).toEqual(mockPhone);
    });

    it('should throw error when phone not found', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockPhoneRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      const mockError = new Error('Phone not found');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(service.findOne(testUser, phoneId)).rejects.toThrow(
        mockError,
      );

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_FOUND('Phone Number', phoneId),
        {
          phone: PhoneNumberErrorCodes.NOT_FOUND,
        },
      );
    });
  });

  describe('update', () => {
    const phoneId = 1;
    const updatePhoneDto: UpdatePhoneDto = {
      phone_number: '+2348036133003',
      phone_type: { id: 2 },
    };

    it('should update phone successfully', async () => {
      const updatedPhone = { ...mockPhone, ...updatePhoneDto };

      // Mock findOne calls
      service.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockPhone) // First call in update method
        .mockResolvedValueOnce(updatedPhone); // Second call to return updated phone

      mockPhoneRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(testUser, phoneId, updatePhoneDto);

      expect(service.findOne).toHaveBeenCalledWith(testUser, phoneId);
      expect(mockPhoneRepository.update).toHaveBeenCalledWith(
        phoneId,
        updatePhoneDto,
      );
      expect(result).toEqual(updatedPhone);
    });

    it('should throw error when phone not found for update', async () => {
      const mockError = new Error('Phone not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(
        service.update(testUser, phoneId, updatePhoneDto),
      ).rejects.toThrow(mockError);

      expect(service.findOne).toHaveBeenCalledWith(testUser, phoneId);
      expect(mockPhoneRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const phoneId = 1;

    it('should remove phone successfully', async () => {
      service.findOne = jest.fn().mockResolvedValue(mockPhone);
      mockPhoneRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(testUser, phoneId);

      expect(service.findOne).toHaveBeenCalledWith(testUser, phoneId);
      expect(mockPhoneRepository.softDelete).toHaveBeenCalledWith(phoneId);
      expect(result).toEqual(mockPhone);
    });

    it('should throw error when phone not found for removal', async () => {
      const mockError = new Error('Phone not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(service.remove(testUser, phoneId)).rejects.toThrow(
        mockError,
      );

      expect(service.findOne).toHaveBeenCalledWith(testUser, phoneId);
      expect(mockPhoneRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getPhoneTypes', () => {
    it('should return all phone types', async () => {
      (PhoneType.find as jest.Mock).mockResolvedValue(mockPhoneTypes);

      const result = await service.getPhoneTypes();

      expect(PhoneType.find).toHaveBeenCalled();
      expect(result).toEqual(mockPhoneTypes);
    });

    it('should handle empty phone types', async () => {
      (PhoneType.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getPhoneTypes();

      expect(PhoneType.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
