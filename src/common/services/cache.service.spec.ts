import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should return null when key does not exist', async () => {
      const key = 'non-existent-key';
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should set value in cache with custom TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 600; // 10 minutes
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });
  });

  describe('del', () => {
    it('should delete value from cache', async () => {
      const key = 'test-key';
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.del(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('reset', () => {
    it('should reset entire cache', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('generateUserCacheKey', () => {
    it('should generate correct user cache key', () => {
      const userId = 123;
      const operation = 'profile';
      const result = service.generateUserCacheKey(userId, operation);
      expect(result).toBe('user:123:profile');
    });
  });

  describe('generateContactCacheKey', () => {
    it('should generate correct contact cache key', () => {
      const contactId = 456;
      const result = service.generateContactCacheKey(contactId);
      expect(result).toBe('contact:456');
    });
  });

  describe('generateContactsCacheKey', () => {
    it('should generate correct contacts cache key with search and type', () => {
      const userId = 123;
      const page = 1;
      const limit = 10;
      const search = 'john';
      const type = 'name';

      const result = service.generateContactsCacheKey(
        userId,
        page,
        limit,
        search,
        type,
      );
      expect(result).toBe('contacts:123:page:1:limit:10:search:john:type:name');
    });

    it('should generate correct contacts cache key without search and type', () => {
      const userId = 123;
      const page = 2;
      const limit = 20;

      const result = service.generateContactsCacheKey(userId, page, limit);
      expect(result).toBe('contacts:123:page:2:limit:20');
    });
  });

  describe('generateTagsCacheKey', () => {
    it('should generate correct tags cache key', () => {
      const userId = 123;
      const result = service.generateTagsCacheKey(userId);
      expect(result).toBe('tags:123');
    });
  });

  describe('invalidateUserCache', () => {
    it('should invalidate user-related cache keys', async () => {
      const userId = 123;
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.invalidateUserCache(userId);

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('invalidateContactsCache', () => {
    it('should invalidate contacts cache', async () => {
      const userId = 123;
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.invalidateContactsCache(userId);

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });
});
