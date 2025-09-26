import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

import { CacheService } from '../services/cache.service';

import {
  CacheInterceptor,
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from './cache.interceptor';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInterceptor,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;
    let mockRequest: {
      user?: { id: number } | null;
      query?: object;
      params?: object;
    };

    beforeEach(() => {
      mockRequest = {
        user: { id: 123 },
        query: {},
        params: {},
      };

      mockExecutionContext = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as ExecutionContext;

      mockCallHandler = {
        handle: jest.fn().mockReturnValue(of('test-result')),
      } as CallHandler;
    });

    it('should proceed without caching when no cache key is defined', async () => {
      mockReflector.get.mockReturnValue(undefined); // No cache key

      const result = await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();

      // Verify the result is the original observable
      result.subscribe((value) => {
        expect(value).toBe('test-result');
      });
    });

    it('should return cached result when available', async () => {
      const cacheKey = 'test-cache-key';
      const cachedResult = 'cached-result';

      mockReflector.get
        .mockReturnValueOnce(cacheKey) // CACHE_KEY_METADATA
        .mockReturnValueOnce(300); // CACHE_TTL_METADATA

      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockReflector.get).toHaveBeenCalledWith(
        CACHE_KEY_METADATA,
        mockExecutionContext.getHandler(),
      );
      expect(mockReflector.get).toHaveBeenCalledWith(
        CACHE_TTL_METADATA,
        mockExecutionContext.getHandler(),
      );
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'test-cache-key:user:123',
      );
      expect(mockCallHandler.handle).not.toHaveBeenCalled();

      // Verify the result is the cached value
      result.subscribe((value) => {
        expect(value).toBe(cachedResult);
      });
    });

    it('should execute handler and cache result when not in cache', async () => {
      const cacheKey = 'test-cache-key';
      const handlerResult = 'handler-result';
      const ttl = 600;

      mockReflector.get
        .mockReturnValueOnce(cacheKey) // CACHE_KEY_METADATA
        .mockReturnValueOnce(ttl); // CACHE_TTL_METADATA

      mockCacheService.get.mockResolvedValue(null); // Not in cache
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(handlerResult));

      const result = await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'test-cache-key:user:123',
      );
      expect(mockCallHandler.handle).toHaveBeenCalled();

      // Subscribe to trigger the tap operator
      result.subscribe((value) => {
        expect(value).toBe(handlerResult);
      });

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'test-cache-key:user:123',
        handlerResult,
        ttl,
      );
    });

    it('should not cache null or undefined results', async () => {
      const cacheKey = 'test-cache-key';

      mockReflector.get
        .mockReturnValueOnce(cacheKey) // CACHE_KEY_METADATA
        .mockReturnValueOnce(300); // CACHE_TTL_METADATA

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      const result = await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      // Subscribe to trigger the tap operator
      result.subscribe((value) => {
        expect(value).toBe(null);
      });

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should generate dynamic cache key with user ID', async () => {
      const cacheKey = 'users';
      mockRequest.user = { id: 456 };

      mockReflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith('users:user:456');
    });

    it('should generate dynamic cache key with query parameters', async () => {
      const cacheKey = 'contacts';
      mockRequest.query = { page: '1', limit: '10', search: 'john' };

      mockReflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'contacts:user:123:query:limit:10:page:1:search:john',
      );
    });

    it('should generate dynamic cache key with route parameters', async () => {
      const cacheKey = 'contact';
      mockRequest.params = { id: '789', type: 'personal' };

      mockReflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'contact:user:123:params:id:789:type:personal',
      );
    });

    it('should generate dynamic cache key with both query and route parameters', async () => {
      const cacheKey = 'data';
      mockRequest.query = { filter: 'active' };
      mockRequest.params = { userId: '123' };

      mockReflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'data:user:123:query:filter:active:params:userId:123',
      );
    });

    it('should handle request without user', async () => {
      const cacheKey = 'public-data';
      mockRequest.user = null;

      mockReflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith('public-data');
    });

    it('should handle empty query and params objects', async () => {
      const cacheKey = 'simple-data';
      mockRequest.query = {};
      mockRequest.params = {};

      mockReflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith('simple-data:user:123');
    });

    it('should use cache key without TTL when TTL is not defined', async () => {
      const cacheKey = 'no-ttl-key';

      mockReflector.get
        .mockReturnValueOnce(cacheKey) // CACHE_KEY_METADATA
        .mockReturnValueOnce(undefined); // CACHE_TTL_METADATA

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      const result = await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      // Subscribe to trigger the tap operator
      result.subscribe();

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'no-ttl-key:user:123',
        'result',
        undefined,
      );
    });

    it('should sort query parameters consistently', async () => {
      const cacheKey = 'sorted-query';
      mockRequest.query = { z: 'last', a: 'first', m: 'middle' };

      mockReflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'sorted-query:user:123:query:a:first:m:middle:z:last',
      );
    });

    it('should sort route parameters consistently', async () => {
      const cacheKey = 'sorted-params';
      mockRequest.params = { z: 'last', a: 'first', m: 'middle' };

      mockReflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      mockCacheService.get.mockResolvedValue(null);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('result'));

      await interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'sorted-params:user:123:params:a:first:m:middle:z:last',
      );
    });
  });
});
