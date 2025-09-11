import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from './logger.service';
import { PerformanceService } from './performance.service';

describe('PerformanceService', () => {
  let service: PerformanceService;

  const mockLoggerService = {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('measureAsync', () => {
    it('should measure async operation execution time', async () => {
      const operation = 'test-async-operation';
      const mockFn = jest.fn().mockResolvedValue('test-result');

      const result = await service.measureAsync(operation, mockFn);

      expect(result).toBe('test-result');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringMatching(
          /Performance: test-async-operation completed in \d+\.\d+ms/,
        ),
      );
    });

    it('should measure async operation with metadata', async () => {
      const operation = 'database-query';
      const metadata = { table: 'users', query: 'SELECT * FROM users' };
      const mockFn = jest.fn().mockResolvedValue([{ id: 1, name: 'John' }]);

      // @ts-expect-error - PerformanceService has incorrect typing for metadata parameter
      const result = await service.measureAsync(operation, mockFn, metadata);

      expect(result).toEqual([{ id: 1, name: 'John' }]);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringMatching(
          /Performance: database-query completed in \d+\.\d+ms/,
        ),
      );

      const stats = service.getOperationStats(operation);
      expect(stats.count).toBe(1);
      expect(stats.recentMetrics[0].metadata).toEqual(metadata);
    });

    it('should log warning for slow async operations', async () => {
      const operation = 'slow-async-operation';
      const mockFn = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve('slow-result'), 1100),
            ),
        );

      const result = await service.measureAsync(operation, mockFn);

      expect(result).toBe('slow-result');
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /Slow operation detected: slow-async-operation took \d+\.\d+ms/,
        ),
      );
    });

    it('should handle async operation errors and record error metrics', async () => {
      const operation = 'failing-async-operation';
      const error = new Error('Async operation failed');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(service.measureAsync(operation, mockFn)).rejects.toThrow(
        'Async operation failed',
      );

      const errorStats = service.getOperationStats(`${operation}_error`);
      expect(errorStats.count).toBe(1);
      expect(errorStats.recentMetrics[0].metadata?.error).toBe(
        'Async operation failed',
      );
    });

    it('should handle async operation errors with metadata', async () => {
      const operation = 'failing-with-metadata';
      const metadata = { userId: 123, action: 'delete' };
      const error = new Error('Permission denied');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(
        service.measureAsync(operation, mockFn, metadata as never),
      ).rejects.toThrow('Permission denied');

      const errorStats = service.getOperationStats(`${operation}_error`);
      expect(errorStats.count).toBe(1);
      expect(errorStats.recentMetrics[0].metadata).toEqual({
        ...metadata,
        error: 'Permission denied',
      });
    });
  });

  describe('measureSync', () => {
    it('should measure sync operation execution time', () => {
      const operation = 'test-sync-operation';
      const mockFn = jest.fn().mockReturnValue('sync-result');

      const result = service.measureSync(operation, mockFn);

      expect(result).toBe('sync-result');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringMatching(
          /Performance: test-sync-operation completed in \d+\.\d+ms/,
        ),
      );
    });

    it('should measure sync operation with metadata', () => {
      const operation = 'calculation';
      const metadata = { type: 'fibonacci', input: 10 };
      const mockFn = jest.fn().mockReturnValue(55);

      const result = service.measureSync(operation, mockFn, metadata as never);

      expect(result).toBe(55);
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringMatching(
          /Performance: calculation completed in \d+\.\d+ms/,
        ),
      );

      const stats = service.getOperationStats(operation);
      expect(stats.count).toBe(1);
      expect(stats.recentMetrics[0].metadata).toEqual(metadata);
    });

    it('should handle sync operation errors and record error metrics', () => {
      const operation = 'failing-sync-operation';
      const error = new Error('Sync operation failed');
      const mockFn = jest.fn().mockImplementation(() => {
        throw error;
      });

      expect(() => service.measureSync(operation, mockFn)).toThrow(
        'Sync operation failed',
      );

      const errorStats = service.getOperationStats(`${operation}_error`);
      expect(errorStats.count).toBe(1);
      expect(errorStats.recentMetrics[0].metadata?.error).toBe(
        'Sync operation failed',
      );
    });

    it('should handle sync operation errors with metadata', () => {
      const operation = 'validation';
      const metadata = { field: 'email', value: 'invalid-email' };
      const error = new Error('Invalid email format');
      const mockFn = jest.fn().mockImplementation(() => {
        throw error;
      });

      expect(() =>
        service.measureSync(operation, mockFn, metadata as never),
      ).toThrow('Invalid email format');

      const errorStats = service.getOperationStats(`${operation}_error`);
      expect(errorStats.count).toBe(1);
      expect(errorStats.recentMetrics[0].metadata).toEqual({
        ...metadata,
        error: 'Invalid email format',
      });
    });
  });

  describe('getOperationStats', () => {
    it('should return empty stats for non-existent operation', () => {
      const stats = service.getOperationStats('non-existent-operation');

      expect(stats).toEqual({
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        recentMetrics: [],
      });
    });

    it('should calculate correct stats for single operation', async () => {
      const operation = 'single-operation';
      const mockFn = jest.fn().mockResolvedValue('result');

      await service.measureAsync(operation, mockFn);

      const stats = service.getOperationStats(operation);
      expect(stats.count).toBe(1);
      expect(stats.avgDuration).toBeGreaterThan(0);
      expect(stats.minDuration).toBe(stats.maxDuration);
      expect(stats.recentMetrics).toHaveLength(1);
    });

    it('should calculate correct stats for multiple operations', async () => {
      const operation = 'multiple-operations';
      const mockFn1 = jest.fn().mockResolvedValue('result1');
      const mockFn2 = jest.fn().mockResolvedValue('result2');
      const mockFn3 = jest.fn().mockResolvedValue('result3');

      await service.measureAsync(operation, mockFn1);
      await service.measureAsync(operation, mockFn2);
      await service.measureAsync(operation, mockFn3);

      const stats = service.getOperationStats(operation);
      expect(stats.count).toBe(3);
      expect(stats.avgDuration).toBeGreaterThan(0);
      expect(stats.minDuration).toBeGreaterThan(0);
      expect(stats.maxDuration).toBeGreaterThanOrEqual(stats.minDuration);
      expect(stats.recentMetrics).toHaveLength(3);
    });

    it('should return only last 10 metrics in recentMetrics', async () => {
      const operation = 'many-operations';
      const mockFn = jest.fn().mockResolvedValue('result');

      // Execute 15 operations
      for (let i = 0; i < 15; i++) {
        await service.measureAsync(operation, mockFn);
      }

      const stats = service.getOperationStats(operation);
      expect(stats.count).toBe(15);
      expect(stats.recentMetrics).toHaveLength(10); // Should only return last 10
    });

    it('should calculate stats correctly with mixed sync and async operations', async () => {
      const operation = 'mixed-operations';
      const asyncFn = jest.fn().mockResolvedValue('async-result');
      const syncFn = jest.fn().mockReturnValue('sync-result');

      await service.measureAsync(operation, asyncFn);
      service.measureSync(operation, syncFn);

      const stats = service.getOperationStats(operation);
      expect(stats.count).toBe(2);
      expect(stats.avgDuration).toBeGreaterThan(0);
      expect(stats.recentMetrics).toHaveLength(2);
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return empty summary when no operations recorded', () => {
      const summary = service.getPerformanceSummary();
      expect(summary).toEqual({});
    });

    it('should return summary for all recorded operations', async () => {
      const operation1 = 'operation-1';
      const operation2 = 'operation-2';
      const mockFn1 = jest.fn().mockResolvedValue('result1');
      const mockFn2 = jest.fn().mockReturnValue('result2');

      await service.measureAsync(operation1, mockFn1);
      service.measureSync(operation2, mockFn2);

      const summary = service.getPerformanceSummary();
      expect(Object.keys(summary)).toHaveLength(2);
      expect(summary[operation1]).toBeDefined();
      expect(summary[operation2]).toBeDefined();
      expect(summary[operation1].count).toBe(1);
      expect(summary[operation2].count).toBe(1);
    });

    it('should include error operations in summary', async () => {
      const operation = 'test-operation';
      const successFn = jest.fn().mockResolvedValue('success');
      const errorFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await service.measureAsync(operation, successFn);

      try {
        await service.measureAsync(operation, errorFn);
      } catch (error) {
        // Expected error
      }

      const summary = service.getPerformanceSummary();
      expect(Object.keys(summary)).toHaveLength(2);
      expect(summary[operation]).toBeDefined();
      expect(summary[`${operation}_error`]).toBeDefined();
      expect(summary[operation].count).toBe(1);
      expect(summary[`${operation}_error`].count).toBe(1);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all recorded metrics', async () => {
      const operation = 'test-operation';
      const mockFn = jest.fn().mockResolvedValue('result');

      // Record some metrics
      await service.measureAsync(operation, mockFn);
      await service.measureAsync(operation, mockFn);

      let stats = service.getOperationStats(operation);
      expect(stats.count).toBe(2);

      // Clear metrics
      service.clearMetrics();

      stats = service.getOperationStats(operation);
      expect(stats.count).toBe(0);

      const summary = service.getPerformanceSummary();
      expect(summary).toEqual({});
    });

    it('should allow recording new metrics after clearing', async () => {
      const operation = 'test-operation';
      const mockFn = jest.fn().mockResolvedValue('result');

      // Record and clear
      await service.measureAsync(operation, mockFn);
      service.clearMetrics();

      // Record new metrics
      await service.measureAsync(operation, mockFn);

      const stats = service.getOperationStats(operation);
      expect(stats.count).toBe(1);
    });
  });

  describe('memory management', () => {
    it('should limit metrics to maxMetrics (1000)', async () => {
      const operation = 'memory-test';
      const mockFn = jest.fn().mockResolvedValue('result');

      // Record more than maxMetrics (1000) operations
      for (let i = 0; i < 1100; i++) {
        await service.measureAsync(operation, mockFn);
      }

      const stats = service.getOperationStats(operation);
      expect(stats.count).toBe(1000); // Should be limited to maxMetrics
    });
  });

  describe('timing accuracy', () => {
    it('should record different durations for operations with different execution times', async () => {
      const fastOperation = 'fast-operation';
      const slowOperation = 'slow-operation';

      const fastFn = jest.fn().mockResolvedValue('fast');
      const slowFn = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve('slow'), 50)),
        );

      await service.measureAsync(fastOperation, fastFn);
      await service.measureAsync(slowOperation, slowFn);

      const fastStats = service.getOperationStats(fastOperation);
      const slowStats = service.getOperationStats(slowOperation);

      expect(slowStats.avgDuration).toBeGreaterThan(fastStats.avgDuration);
      expect(slowStats.avgDuration).toBeGreaterThan(40); // Should be at least 40ms
    });
  });
});
