import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FilesErrorCodes } from '@contactApp/shared/utils/constants/files/errors';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import { mockUser } from '../../../test/utils/test-helpers';

import { FileStorageService } from '../file-storage/file-storage.service';

import { FilesService } from './files.service';
import { FileEntity } from './entities/file.entity';

// Mock handleError
jest.mock('@contactApp/shared/utils/handlers/error.handler');

describe('FilesService', () => {
  let service: FilesService;
  let fileRepository: Repository<FileEntity>;
  let configService: ConfigService;
  let fileStorageService: FileStorageService;

  const mockFile = {
    id: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
    path: '/api/v1/files/test-file.jpg',
    owner: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockFileRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockFileStorageService = {
    removeFromStorage: jest.fn(),
  };

  const mockUploadedFile = {
    path: 'files/test-file.jpg',
    location: 'https://s3.amazonaws.com/bucket/test-file.jpg',
    originalname: 'test-file.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockFileRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: FileStorageService,
          useValue: mockFileStorageService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    fileRepository = module.get<Repository<FileEntity>>(getRepositoryToken(FileEntity));
    configService = module.get<ConfigService>(ConfigService);
    fileStorageService = module.get<FileStorageService>(FileStorageService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    const fileId = 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae';

    it('should return file when found', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);

      const result = await service.findOne(mockUser, fileId);

      expect(mockFileRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: fileId,
          owner: {
            id: mockUser.id,
          },
        },
      });
      expect(result).toEqual(mockFile);
    });

    it('should throw error when file not found', async () => {
      mockFileRepository.findOne.mockResolvedValue(null);
      const mockError = new Error('File not found');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(service.findOne(mockUser, fileId)).rejects.toThrow(mockError);

      expect(mockFileRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: fileId,
          owner: {
            id: mockUser.id,
          },
        },
      });
      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_FOUND('File', fileId),
        {
          file: FilesErrorCodes.NOT_FOUND,
        },
      );
    });

    it('should handle repository errors during findOne', async () => {
      const repositoryError = new Error('Database connection failed');
      mockFileRepository.findOne.mockRejectedValue(repositoryError);

      await expect(service.findOne(mockUser, fileId)).rejects.toThrow(repositoryError);

      expect(mockFileRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: fileId,
          owner: {
            id: mockUser.id,
          },
        },
      });
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully with local driver', async () => {
      const expectedFile = {
        ...mockFile,
        path: '/api/v1/files/test-file.jpg',
      };

      mockConfigService.get
        .mockReturnValueOnce('app') // app.apiPrefix
        .mockReturnValueOnce('local'); // file.driver

      mockFileRepository.create.mockReturnValue(expectedFile);
      mockFileRepository.save.mockResolvedValue(expectedFile);

      const result = await service.uploadFile(mockUser, mockUploadedFile);

      expect(mockConfigService.get).toHaveBeenCalledWith('app.apiPrefix');
      expect(mockConfigService.get).toHaveBeenCalledWith('file.driver');
      expect(mockFileRepository.create).toHaveBeenCalledWith({
        owner: mockUser,
        path: '/app/v1/files/test-file.jpg',
      });
      expect(mockFileRepository.save).toHaveBeenCalledWith(expectedFile);
      expect(result).toEqual(expectedFile);
    });

    it('should upload file successfully with S3 driver', async () => {
      const expectedFile = {
        ...mockFile,
        path: 'https://s3.amazonaws.com/bucket/test-file.jpg',
      };

      mockConfigService.get
        .mockReturnValueOnce('api') // app.apiPrefix
        .mockReturnValueOnce('s3'); // file.driver

      mockFileRepository.create.mockReturnValue(expectedFile);
      mockFileRepository.save.mockResolvedValue(expectedFile);

      const result = await service.uploadFile(mockUser, mockUploadedFile);

      expect(mockConfigService.get).toHaveBeenCalledWith('app.apiPrefix');
      expect(mockConfigService.get).toHaveBeenCalledWith('file.driver');
      expect(mockFileRepository.create).toHaveBeenCalledWith({
        owner: mockUser,
        path: 'https://s3.amazonaws.com/bucket/test-file.jpg',
      });
      expect(mockFileRepository.save).toHaveBeenCalledWith(expectedFile);
      expect(result).toEqual(expectedFile);
    });

    it('should throw error when no file provided', async () => {
      const mockError = new Error('No file provided');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(service.uploadFile(mockUser, null)).rejects.toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.NO_FILE,
        {
          file: FilesErrorCodes.NO_FILE,
        },
      );
      expect(mockFileRepository.create).not.toHaveBeenCalled();
      expect(mockFileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when undefined file provided', async () => {
      const mockError = new Error('No file provided');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(service.uploadFile(mockUser, undefined)).rejects.toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.NO_FILE,
        {
          file: FilesErrorCodes.NO_FILE,
        },
      );
      expect(mockFileRepository.create).not.toHaveBeenCalled();
      expect(mockFileRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors during upload', async () => {
      const repositoryError = new Error('Database connection failed');

      mockConfigService.get
        .mockReturnValueOnce('api') // app.apiPrefix
        .mockReturnValueOnce('local'); // file.driver

      mockFileRepository.create.mockReturnValue(mockFile);
      mockFileRepository.save.mockRejectedValue(repositoryError);

      await expect(service.uploadFile(mockUser, mockUploadedFile)).rejects.toThrow(repositoryError);

      expect(mockFileRepository.create).toHaveBeenCalled();
      expect(mockFileRepository.save).toHaveBeenCalled();
    });
  });

  describe('removeFile', () => {
    const fileId = 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae';

    it('should remove file successfully', async () => {
      service.findOne = jest.fn().mockResolvedValue(mockFile);
      mockFileStorageService.removeFromStorage.mockResolvedValue(undefined);
      mockFileRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.removeFile(mockUser, fileId);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, fileId);
      expect(mockFileStorageService.removeFromStorage).toHaveBeenCalledWith(mockFile.path);
      expect(mockFileRepository.softDelete).toHaveBeenCalledWith(fileId);
      expect(result).toEqual(mockFile);
    });

    it('should throw error when file not found for removal', async () => {
      const mockError = new Error('File not found');
      service.findOne = jest.fn().mockRejectedValue(mockError);

      await expect(service.removeFile(mockUser, fileId)).rejects.toThrow(mockError);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, fileId);
      expect(mockFileStorageService.removeFromStorage).not.toHaveBeenCalled();
      expect(mockFileRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should handle storage service errors during removal', async () => {
      const storageError = new Error('Storage service failed');
      service.findOne = jest.fn().mockResolvedValue(mockFile);
      mockFileStorageService.removeFromStorage.mockRejectedValue(storageError);

      await expect(service.removeFile(mockUser, fileId)).rejects.toThrow(storageError);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, fileId);
      expect(mockFileStorageService.removeFromStorage).toHaveBeenCalledWith(mockFile.path);
      expect(mockFileRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should handle repository errors during removal', async () => {
      const repositoryError = new Error('Database connection failed');
      service.findOne = jest.fn().mockResolvedValue(mockFile);
      mockFileStorageService.removeFromStorage.mockResolvedValue(undefined);
      mockFileRepository.softDelete.mockRejectedValue(repositoryError);

      await expect(service.removeFile(mockUser, fileId)).rejects.toThrow(repositoryError);

      expect(service.findOne).toHaveBeenCalledWith(mockUser, fileId);
      expect(mockFileStorageService.removeFromStorage).toHaveBeenCalledWith(mockFile.path);
      expect(mockFileRepository.softDelete).toHaveBeenCalledWith(fileId);
    });
  });
});
