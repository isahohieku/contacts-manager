import { Test, TestingModule } from '@nestjs/testing';

import { AddressType } from '../address-types/entities/address-type.entity';
import { User } from '../users/entity/user.entity';

import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';

describe('AddressesController', () => {
  let controller: AddressesController;
  let addressesService: jest.Mocked<AddressesService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  } as User;

  const mockAddress: Address = {
    id: 1,
    street: '123 Main St',
    city: 'Test City',
    state: 'Test State',
    postal_code: '12345',
    country: { id: 1, name: 'Test Country' } as any,
    address_type: { id: 1, name: 'Home' } as any,
    contact: { id: 1 } as any,
  } as Address;

  const mockAddressType: AddressType = {
    id: 1,
    name: 'Home',
  } as AddressType;

  beforeEach(async () => {
    const mockAddressesService = {
      create: jest.fn(),
      getAddressTypes: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        {
          provide: AddressesService,
          useValue: mockAddressesService,
        },
      ],
    }).compile();

    controller = module.get<AddressesController>(AddressesController);
    addressesService = module.get(AddressesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new address', async () => {
      const createAddressDto: CreateAddressDto = {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: { id: 1, name: 'Test Country' } as any,
        address_type: { id: 1 },
        contact: { id: 1 } as any,
      };

      addressesService.create.mockResolvedValue(mockAddress);

      const result = await controller.create(
        { user: mockUser },
        createAddressDto,
      );

      expect(addressesService.create).toHaveBeenCalledWith(
        mockUser,
        createAddressDto,
      );
      expect(result).toEqual(mockAddress);
    });

    it('should handle service errors during creation', async () => {
      const createAddressDto: CreateAddressDto = {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: { id: 1, name: 'Test Country' } as any,
        address_type: { id: 1 },
        contact: { id: 1 } as any,
      };

      const error = new Error('Creation failed');
      addressesService.create.mockRejectedValue(error);

      await expect(
        controller.create({ user: mockUser }, createAddressDto),
      ).rejects.toThrow('Creation failed');
      expect(addressesService.create).toHaveBeenCalledWith(
        mockUser,
        createAddressDto,
      );
    });
  });

  describe('getAddressTypes', () => {
    it('should return all address types', async () => {
      const mockAddressTypes: AddressType[] = [
        mockAddressType,
        { id: 2, name: 'Work' } as AddressType,
        { id: 3, name: 'Other' } as AddressType,
      ];

      addressesService.getAddressTypes.mockResolvedValue(mockAddressTypes);

      const result = await controller.getAddressTypes();

      expect(addressesService.getAddressTypes).toHaveBeenCalled();
      expect(result).toEqual(mockAddressTypes);
    });

    it('should handle service errors when getting address types', async () => {
      const error = new Error('Failed to get address types');
      addressesService.getAddressTypes.mockRejectedValue(error);

      await expect(controller.getAddressTypes()).rejects.toThrow(
        'Failed to get address types',
      );
      expect(addressesService.getAddressTypes).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a specific address', async () => {
      const addressId = '1';
      addressesService.findOne.mockResolvedValue(mockAddress);

      const result = await controller.findOne({ user: mockUser }, addressId);

      expect(addressesService.findOne).toHaveBeenCalledWith(mockUser, 1);
      expect(result).toEqual(mockAddress);
    });

    it('should handle string ID conversion', async () => {
      const addressId = '123';
      addressesService.findOne.mockResolvedValue(mockAddress);

      await controller.findOne({ user: mockUser }, addressId);

      expect(addressesService.findOne).toHaveBeenCalledWith(mockUser, 123);
    });

    it('should handle service errors when finding address', async () => {
      const addressId = '1';
      const error = new Error('Address not found');
      addressesService.findOne.mockRejectedValue(error);

      await expect(
        controller.findOne({ user: mockUser }, addressId),
      ).rejects.toThrow('Address not found');
      expect(addressesService.findOne).toHaveBeenCalledWith(mockUser, 1);
    });
  });

  describe('update', () => {
    it('should update an address', async () => {
      const addressId = '1';
      const updateAddressDto: UpdateAddressDto = {
        street: '456 Updated St',
        city: 'Updated City',
      };

      const updatedAddress = { ...mockAddress, ...updateAddressDto } as Address;
      addressesService.update.mockResolvedValue(updatedAddress);

      const result = await controller.update(
        { user: mockUser },
        addressId,
        updateAddressDto,
      );

      expect(addressesService.update).toHaveBeenCalledWith(
        mockUser,
        1,
        updateAddressDto,
      );
      expect(result).toEqual(updatedAddress);
    });

    it('should handle partial updates', async () => {
      const addressId = '1';
      const updateAddressDto: UpdateAddressDto = {
        city: 'New City Only',
      };

      addressesService.update.mockResolvedValue(mockAddress);

      await controller.update({ user: mockUser }, addressId, updateAddressDto);

      expect(addressesService.update).toHaveBeenCalledWith(
        mockUser,
        1,
        updateAddressDto,
      );
    });

    it('should handle service errors during update', async () => {
      const addressId = '1';
      const updateAddressDto: UpdateAddressDto = {
        street: '456 Updated St',
      };

      const error = new Error('Update failed');
      addressesService.update.mockRejectedValue(error);

      await expect(
        controller.update({ user: mockUser }, addressId, updateAddressDto),
      ).rejects.toThrow('Update failed');
      expect(addressesService.update).toHaveBeenCalledWith(
        mockUser,
        1,
        updateAddressDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove an address', async () => {
      const addressId = '1';
      addressesService.remove.mockResolvedValue(mockAddress);

      const result = await controller.remove({ user: mockUser }, addressId);

      expect(addressesService.remove).toHaveBeenCalledWith(mockUser, 1);
      expect(result).toEqual(mockAddress);
    });

    it('should handle string ID conversion for removal', async () => {
      const addressId = '999';
      addressesService.remove.mockResolvedValue(mockAddress);

      await controller.remove({ user: mockUser }, addressId);

      expect(addressesService.remove).toHaveBeenCalledWith(mockUser, 999);
    });

    it('should handle service errors during removal', async () => {
      const addressId = '1';
      const error = new Error('Removal failed');
      addressesService.remove.mockRejectedValue(error);

      await expect(
        controller.remove({ user: mockUser }, addressId),
      ).rejects.toThrow('Removal failed');
      expect(addressesService.remove).toHaveBeenCalledWith(mockUser, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero ID', async () => {
      const addressId = '0';
      addressesService.findOne.mockResolvedValue(mockAddress);

      await controller.findOne({ user: mockUser }, addressId);

      expect(addressesService.findOne).toHaveBeenCalledWith(mockUser, 0);
    });

    it('should handle negative ID', async () => {
      const addressId = '-1';
      addressesService.findOne.mockResolvedValue(mockAddress);

      await controller.findOne({ user: mockUser }, addressId);

      expect(addressesService.findOne).toHaveBeenCalledWith(mockUser, -1);
    });

    it('should handle empty update DTO', async () => {
      const addressId = '1';
      const updateAddressDto: UpdateAddressDto = {};

      addressesService.update.mockResolvedValue(mockAddress);

      await controller.update({ user: mockUser }, addressId, updateAddressDto);

      expect(addressesService.update).toHaveBeenCalledWith(
        mockUser,
        1,
        updateAddressDto,
      );
    });
  });
});
