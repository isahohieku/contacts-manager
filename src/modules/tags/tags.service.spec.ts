import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { TagErrorCodes } from '@contactApp/shared/utils/constants/tags/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';

import { mockUser } from '../../../test/utils/test-helpers';
import { User } from '../users/entity/user.entity';

import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';
import { TagsService } from './tags.service';

// Mock handleError
jest.mock('@contactApp/shared/utils/handlers/error.handler');

describe('TagsService', () => {
  let service: TagsService;

  // Create properly typed test user
  const testUser = mockUser as unknown as User;

  const mockTag = {
    id: 1,
    name: 'Friends',
    owner: testUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTagsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagsRepository,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTagDto: CreateTagDto = {
      name: 'Friends',
    };

    it('should create a tag successfully', async () => {
      const expectedTag = { ...mockTag, ...createTagDto };

      mockTagsRepository.create.mockReturnValue(expectedTag);
      mockTagsRepository.save.mockResolvedValue(expectedTag);

      const result = await service.create(testUser, createTagDto);

      expect(mockTagsRepository.create).toHaveBeenCalledWith({
        ...createTagDto,
        owner: testUser,
      });
      expect(mockTagsRepository.save).toHaveBeenCalledWith(expectedTag);
      expect(result).toEqual(expectedTag);
    });

    it('should create a tag with different name', async () => {
      const differentTagDto = { name: 'Work' };
      const expectedTag = { ...mockTag, ...differentTagDto };

      mockTagsRepository.create.mockReturnValue(expectedTag);
      mockTagsRepository.save.mockResolvedValue(expectedTag);

      const result = await service.create(testUser, differentTagDto);

      expect(mockTagsRepository.create).toHaveBeenCalledWith({
        ...differentTagDto,
        owner: testUser,
      });
      expect(mockTagsRepository.save).toHaveBeenCalledWith(expectedTag);
      expect(result).toEqual(expectedTag);
    });

    it('should handle repository errors during creation', async () => {
      const repositoryError = new Error('Database connection failed');
      mockTagsRepository.create.mockReturnValue(mockTag);
      mockTagsRepository.save.mockRejectedValue(repositoryError);

      await expect(service.create(testUser, createTagDto)).rejects.toThrow(
        repositoryError,
      );

      expect(mockTagsRepository.create).toHaveBeenCalledWith({
        ...createTagDto,
        owner: testUser,
      });
      expect(mockTagsRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tags for a user', async () => {
      const mockTags = [
        { ...mockTag, id: 1, name: 'Friends' },
        { ...mockTag, id: 2, name: 'Work' },
        { ...mockTag, id: 3, name: 'Family' },
      ];

      mockTagsRepository.find.mockResolvedValue(mockTags);

      const result = await service.findAll(testUser);

      expect(mockTagsRepository.find).toHaveBeenCalledWith({
        where: {
          owner: {
            id: testUser.id,
          },
        },
      });
      expect(result).toEqual(mockTags);
    });

    it('should return empty array when user has no tags', async () => {
      mockTagsRepository.find.mockResolvedValue([]);

      const result = await service.findAll(testUser);

      expect(mockTagsRepository.find).toHaveBeenCalledWith({
        where: {
          owner: {
            id: testUser.id,
          },
        },
      });
      expect(result).toEqual([]);
    });

    it('should handle repository errors during findAll', async () => {
      const repositoryError = new Error('Database connection failed');
      mockTagsRepository.find.mockRejectedValue(repositoryError);

      await expect(service.findAll(testUser)).rejects.toThrow(repositoryError);

      expect(mockTagsRepository.find).toHaveBeenCalledWith({
        where: {
          owner: {
            id: testUser.id,
          },
        },
      });
    });
  });

  describe('findOne', () => {
    const tagId = 1;

    it('should return tag when found', async () => {
      mockTagsRepository.findOne.mockResolvedValue(mockTag);

      const result = await service.findOne(testUser, tagId);

      expect(mockTagsRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: tagId,
          owner: {
            id: testUser.id,
          },
        },
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw error when tag not found', async () => {
      mockTagsRepository.findOne.mockResolvedValue(null);
      const mockError = new Error('Tag not found');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(service.findOne(testUser, tagId)).rejects.toThrow(mockError);

      expect(mockTagsRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: tagId,
          owner: {
            id: testUser.id,
          },
        },
      });
      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_FOUND('Tag', tagId),
        {
          tag: TagErrorCodes.NOT_FOUND,
        },
      );
    });

    it('should handle repository errors during findOne', async () => {
      const repositoryError = new Error('Database connection failed');
      mockTagsRepository.findOne.mockRejectedValue(repositoryError);

      await expect(service.findOne(testUser, tagId)).rejects.toThrow(
        repositoryError,
      );

      expect(mockTagsRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: tagId,
          owner: {
            id: testUser.id,
          },
        },
      });
    });
  });

  describe('update', () => {
    const tagId = 1;
    const updateTagDto: UpdateTagDto = {
      name: 'Updated Friends',
    };

    it('should update tag successfully', async () => {
      const updatedTag = { ...mockTag, ...updateTagDto };

      // Mock findOne calls
      service.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockTag) // First call in update method
        .mockResolvedValueOnce(updatedTag); // Second call to return updated tag

      mockTagsRepository.create.mockReturnValue({ id: tagId, ...updateTagDto });
      mockTagsRepository.save.mockResolvedValue(updatedTag);

      const result = await service.update(testUser, tagId, updateTagDto);

      expect(service.findOne).toHaveBeenCalledWith(testUser, tagId);
      expect(mockTagsRepository.create).toHaveBeenCalledWith({
        id: tagId,
        ...updateTagDto,
      });
      expect(mockTagsRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedTag);
    });

    it('should throw error when tag not found for update', async () => {
      const mockError = new Error('Tag not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(
        service.update(testUser, tagId, updateTagDto),
      ).rejects.toThrow(mockError);

      expect(service.findOne).toHaveBeenCalledWith(testUser, tagId);
      expect(mockTagsRepository.create).not.toHaveBeenCalled();
      expect(mockTagsRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors during update', async () => {
      const repositoryError = new Error('Database connection failed');
      service.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockTag)
        .mockRejectedValue(repositoryError);

      mockTagsRepository.create.mockReturnValue({ id: tagId, ...updateTagDto });
      mockTagsRepository.save.mockResolvedValue(mockTag);

      await expect(
        service.update(testUser, tagId, updateTagDto),
      ).rejects.toThrow(repositoryError);

      expect(service.findOne).toHaveBeenCalledWith(testUser, tagId);
      expect(mockTagsRepository.create).toHaveBeenCalled();
      expect(mockTagsRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const tagId = 1;

    it('should remove tag successfully', async () => {
      service.findOne = jest.fn().mockResolvedValue(mockTag);
      mockTagsRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(testUser, tagId);

      expect(service.findOne).toHaveBeenCalledWith(testUser, tagId);
      expect(mockTagsRepository.softDelete).toHaveBeenCalledWith(tagId);
      expect(result).toEqual(mockTag);
    });

    it('should throw error when tag not found for removal', async () => {
      const mockError = new Error('Tag not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(service.remove(testUser, tagId)).rejects.toThrow(mockError);

      expect(service.findOne).toHaveBeenCalledWith(testUser, tagId);
      expect(mockTagsRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should handle repository errors during removal', async () => {
      const repositoryError = new Error('Database connection failed');
      service.findOne = jest.fn().mockResolvedValue(mockTag);
      mockTagsRepository.softDelete.mockRejectedValue(repositoryError);

      await expect(service.remove(testUser, tagId)).rejects.toThrow(
        repositoryError,
      );

      expect(service.findOne).toHaveBeenCalledWith(testUser, tagId);
      expect(mockTagsRepository.softDelete).toHaveBeenCalledWith(tagId);
    });
  });
});
