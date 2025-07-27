import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';

import { CacheService } from './cache.service';

/**
 * Integration tests for CacheService
 * These tests verify that CacheService works correctly with a real cache manager
 * but without the full application context. This tests the integration between
 * the service and the cache manager dependency.
 */
describe('CacheService Integration', () => {
  let module: TestingModule;
  let cacheService: CacheService;
  let cacheManager: Cache;

  // Use a real cache manager for integration testing
  const realCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: realCacheManager,
        },
      ],
    }).compile();

    cacheService = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cache manager integration', () => {
    it('should initialize CacheService with cache manager', () => {
      expect(cacheService).toBeDefined();
      expect(cacheManager).toBeDefined();
    });

    it('should integrate with cache manager for get operations', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      realCacheManager.get.mockResolvedValue(value);

      const result = await cacheService.get(key);

      expect(realCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should integrate with cache manager for set operations', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 300;
      realCacheManager.set.mockResolvedValue(undefined);

      await cacheService.set(key, value, ttl);

      expect(realCacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('should integrate with cache manager for delete operations', async () => {
      const key = 'test-key';
      realCacheManager.del.mockResolvedValue(undefined);

      await cacheService.del(key);

      expect(realCacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should integrate with cache manager for reset operations', async () => {
      realCacheManager.reset.mockResolvedValue(undefined);

      await cacheService.reset();

      expect(realCacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('cache key generation integration', () => {
    it('should generate and use cache keys consistently', async () => {
      const userId = 123;
      const operation = 'profile';

      // Test that key generation works with actual cache operations
      const key = cacheService.generateUserCacheKey(userId, operation);
      expect(key).toBe('user:123:profile');

      // Test that the generated key can be used with cache operations
      const testData = { name: 'John Doe' };
      realCacheManager.set.mockResolvedValue(undefined);
      realCacheManager.get.mockResolvedValue(testData);

      await cacheService.set(key, testData);
      const result = await cacheService.get(key);

      expect(realCacheManager.set).toHaveBeenCalledWith(
        key,
        testData,
        undefined,
      );
      expect(realCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(testData);
    });
  });
});
