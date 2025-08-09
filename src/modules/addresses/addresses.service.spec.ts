import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ContactsService } from '../contacts/contacts.service';
import { AddressErrorCodes } from '@contactApp/shared/utils/constants/addresses/errors';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import { mockUser, mockContact } from '../../../test/utils/test-helpers';

import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { AddressType } from '../address-types/entities/address-type.entity';

// Mock handleError
jest.mock('@contactApp/shared/utils/handlers/error.handler');

// Mock AddressType.find
jest.mock('../address-types/entities/address-type.entity', () => ({
  AddressType: {
    find: jest.fn(),
  },
}));

describe('AddressesService', () => {
  let service: AddressesService;
  let addressRepository: Repository<Address>;
  let contactsService: ContactsService;

  const mockAddress = {
    id: 1,
    street: '123 Main St',
    city: 'Test City',
    state: 'Test State',
    postal_code: '12345',
    country: { id: 1, name: 'Test Country' },
    address_type: { id: 1, name: 'Home' },
    contact: mockContact,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockAddressRepository = {
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

  const mockAddressTypes = [
    { id: 1, name: 'Home' },
    { id: 2, name: 'Work' },
    { id: 3, name: 'Other' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepository,
        },
        {
          provide: ContactsService,
          useValue: mockContactsService,
        },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
    addressRepository = module.get<Repository<Address>>(getRepositoryToken(Address));
    contactsService = module.get<ContactsService>(ContactsService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createAddressDto: CreateAddressDto = {
      street: '123 Main St',
      city: 'Test City',
      state: 'Test State',
      postal_code: '12345',
      country: { id: 1 } as any,
      address_type: { id: 1 },
      contact: { id: 1 } as any,
    };

    it('should create an address successfully', async () => {
      const expectedAddress = { ...mockAddress, ...createAddressDto };

      mockContactsService.findOne.mockResolvedValue(mockContact);
      mockAddressRepository.create.mockReturnValue(expectedAddress);
      mockAddressRepository.save.mockResolvedValue(expectedAddress);

      const result = await service.create(mockUser, createAddressDto);

      expect(mockContactsService.findOne).toHaveBeenCalledWith(mockUser, createAddressDto.contact.id);
      expect(mockAddressRepository.create).toHaveBeenCalledWith(createAddressDto);
      expect(mockAddressRepository.save).toHaveBeenCalledWith(expectedAddress);
      expect(result).toEqual(expectedAddress);
    });

    it('should throw error when contact is not found', async () => {
      const mockError = new Error('Contact not found');
      mockContactsService.findOne.mockRejectedValue(mockError);

      await expect(service.create(mockUser, createAddressDto)).rejects.toThrow(mockError);

      expect(mockContactsService.findOne).toHaveBeenCalledWith(mockUser, createAddressDto.contact.id);
      expect(mockAddressRepository.create).not.toHaveBeenCalled();
      expect(mockAddressRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const addressId = 1;

    it('should return address when found', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockAddress),
      };

      mockAddressRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findOne(mockUser, addressId);

      expect(mockAddressRepository.createQueryBuilder).toHaveBeenCalledWith('address');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('address.contact', 'contact');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('address.address_type', 'address_type');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('address.country', 'country');
      expect(queryBuilder.where).toHaveBeenCalledWith('address.id = :id', { id: addressId });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('contact.owner.id = :userId', { userId: mockUser.id });
      expect(queryBuilder.select).toHaveBeenCalledWith(['address', 'contact.id', 'address_type', 'country']);
      expect(result).toEqual(mockAddress);
    });

    it('should throw error when address not found', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockAddressRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      const mockError = new Error('Address not found');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(service.findOne(mockUser, addressId)).rejects.toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_FOUND('Address', addressId),
        {
          address: AddressErrorCodes.NOT_FOUND,
        },
      );
    });
  });

  describe('update', () => {
    const addressId = 1;
    const updateAddressDto: UpdateAddressDto = {
      street: '456 Updated St',
      city: 'Updated City',
    };

    it('should update address successfully', async () => {
      const updatedAddress = { ...mockAddress, ...updateAddressDto };

      // Mock findOne calls
      service.findOne = jest.fn()
        .mockResolvedValueOnce(mockAddress) // First call in update method
        .mockResolvedValueOnce(updatedAddress); // Second call to return updated address

      mockAddressRepository.create.mockReturnValue({ id: addressId, ...updateAddressDto });
      mockAddressRepository.save.mockResolvedValue(updatedAddress);

      const result = await service.update(mockUser, addressId, updateAddressDto);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, addressId);
      expect(mockAddressRepository.create).toHaveBeenCalledWith({
        id: addressId,
        ...updateAddressDto,
      });
      expect(mockAddressRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedAddress);
    });

    it('should throw error when address not found for update', async () => {
      const mockError = new Error('Address not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(service.update(mockUser, addressId, updateAddressDto)).rejects.toThrow(mockError);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, addressId);
      expect(mockAddressRepository.create).not.toHaveBeenCalled();
      expect(mockAddressRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const addressId = 1;

    it('should remove address successfully', async () => {
      service.findOne = jest.fn().mockResolvedValue(mockAddress);
      mockAddressRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(mockUser, addressId);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, addressId);
      expect(mockAddressRepository.softDelete).toHaveBeenCalledWith(addressId);
      expect(result).toEqual(mockAddress);
    });

    it('should throw error when address not found for removal', async () => {
      const mockError = new Error('Address not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(service.remove(mockUser, addressId)).rejects.toThrow(mockError);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, addressId);
      expect(mockAddressRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getAddressTypes', () => {
    it('should return all address types', async () => {
      (AddressType.find as jest.Mock).mockResolvedValue(mockAddressTypes);

      const result = await service.getAddressTypes();

      expect(AddressType.find).toHaveBeenCalled();
      expect(result).toEqual(mockAddressTypes);
    });

    it('should handle empty address types', async () => {
      (AddressType.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getAddressTypes();

      expect(AddressType.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
