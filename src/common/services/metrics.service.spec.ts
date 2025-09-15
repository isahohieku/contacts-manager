import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from './logger.service';
import {
  MetricsService,
  RequestMetric,
  ErrorMetric,
  CacheMetric,
  DatabaseMetric,
} from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

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
        MetricsService,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock setInterval to prevent actual timer execution
    jest.spyOn(global, 'setInterval').mockImplementation(() => ({}) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordRequest', () => {
    it('should record request metric', () => {
      const metric: RequestMetric = {
        method: 'GET',
        path: '/api/users',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
        userId: 1,
      };

      service.recordRequest(metric);

      const requestMetrics = service.getRequestMetrics();
      expect(requestMetrics.totalRequests).toBe(1);
    });

    it('should log warning for slow requests', () => {
      const metric: RequestMetric = {
        method: 'POST',
        path: '/api/slow-endpoint',
        statusCode: 200,
        responseTime: 1500, // Slow request > 1000ms
        timestamp: new Date(),
      };

      service.recordRequest(metric);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Slow request: POST /api/slow-endpoint took 1500ms',
        'MetricsService',
      );
    });

    it('should log warning for error responses', () => {
      const metric: RequestMetric = {
        method: 'GET',
        path: '/api/not-found',
        statusCode: 404,
        responseTime: 50,
        timestamp: new Date(),
      };

      service.recordRequest(metric);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Error response: GET /api/not-found returned 404',
        'MetricsService',
      );
    });

    it('should not log warning for fast successful requests', () => {
      const metric: RequestMetric = {
        method: 'GET',
        path: '/api/users',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date(),
      };

      service.recordRequest(metric);

      expect(mockLoggerService.warn).not.toHaveBeenCalled();
    });

    it('should handle multiple request metrics', () => {
      const metrics: RequestMetric[] = [
        {
          method: 'GET',
          path: '/api/users',
          statusCode: 200,
          responseTime: 100,
          timestamp: new Date(),
        },
        {
          method: 'POST',
          path: '/api/users',
          statusCode: 201,
          responseTime: 200,
          timestamp: new Date(),
        },
        {
          method: 'DELETE',
          path: '/api/users/1',
          statusCode: 204,
          responseTime: 50,
          timestamp: new Date(),
        },
      ];

      metrics.forEach((metric) => service.recordRequest(metric));

      const requestMetrics = service.getRequestMetrics();
      expect(requestMetrics.totalRequests).toBe(3);
    });
  });

  describe('recordError', () => {
    it('should record error metric', () => {
      const metric: ErrorMetric = {
        error: 'ValidationError: Invalid input',
        stack: 'Error stack trace',
        path: '/api/users',
        method: 'POST',
        timestamp: new Date(),
        userId: 1,
        statusCode: 400,
      };

      service.recordError(metric);

      const errorMetrics = service.getErrorMetrics();
      expect(errorMetrics.totalErrors).toBe(1);
    });

    it('should log error when recording error metric', () => {
      const metric: ErrorMetric = {
        error: 'DatabaseError: Connection failed',
        stack: 'Error stack trace',
        path: '/api/users',
        method: 'GET',
        timestamp: new Date(),
        statusCode: 500,
      };

      service.recordError(metric);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Application error: DatabaseError: Connection failed on GET /api/users',
        'Error stack trace',
        'MetricsService',
      );
    });

    it('should handle error metric without stack trace', () => {
      const metric: ErrorMetric = {
        error: 'NotFoundError: User not found',
        path: '/api/users/999',
        method: 'GET',
        timestamp: new Date(),
        statusCode: 404,
      };

      service.recordError(metric);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Application error: NotFoundError: User not found on GET /api/users/999',
        undefined,
        'MetricsService',
      );
    });
  });

  describe('recordCache', () => {
    it('should record cache hit metric', () => {
      const metric: CacheMetric = {
        operation: 'hit',
        key: 'user:123',
        timestamp: new Date(),
        responseTime: 5,
      };

      service.recordCache(metric);

      const cacheMetrics = service.getCacheMetrics();
      expect(cacheMetrics.totalOperations).toBe(1);
    });

    it('should record cache miss metric', () => {
      const metric: CacheMetric = {
        operation: 'miss',
        key: 'user:456',
        timestamp: new Date(),
        responseTime: 10,
      };

      service.recordCache(metric);

      const cacheMetrics = service.getCacheMetrics();
      expect(cacheMetrics.totalOperations).toBe(1);
    });

    it('should calculate cache hit rate correctly', () => {
      const hitMetric: CacheMetric = {
        operation: 'hit',
        key: 'user:123',
        timestamp: new Date(),
      };

      const missMetric: CacheMetric = {
        operation: 'miss',
        key: 'user:456',
        timestamp: new Date(),
      };

      service.recordCache(hitMetric);
      service.recordCache(hitMetric);
      service.recordCache(missMetric);

      const cacheMetrics = service.getCacheMetrics();
      expect(cacheMetrics.hitRate).toBe(66.67); // 2 hits out of 3 total
    });
  });

  describe('recordDatabase', () => {
    it('should record database query metric', () => {
      const metric: DatabaseMetric = {
        query: 'SELECT * FROM users WHERE id = ?',
        duration: 50,
        timestamp: new Date(),
        parameters: [123],
      };

      service.recordDatabase(metric);

      const dbMetrics = service.getDatabaseMetrics();
      expect(dbMetrics.totalQueries).toBe(1);
    });

    it('should log warning for slow database queries', () => {
      const metric: DatabaseMetric = {
        query:
          'SELECT * FROM users JOIN posts ON users.id = posts.user_id WHERE users.created_at > ?',
        duration: 1500, // Slow query > 1000ms
        timestamp: new Date(),
        parameters: ['2023-01-01'],
      };

      service.recordDatabase(metric);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Slow database query: SELECT * FROM users JOIN posts ON users.id = posts.user_id WHERE users.created_at > ?... took 1500ms',
        'MetricsService',
      );
    });

    it('should log error for database query errors', () => {
      const metric: DatabaseMetric = {
        query: 'SELECT * FROM non_existent_table',
        duration: 10,
        timestamp: new Date(),
        error: 'Table "non_existent_table" does not exist',
      };

      service.recordDatabase(metric);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Database query error: Table "non_existent_table" does not exist',
        undefined,
        'MetricsService',
      );
    });

    it('should not log warning for fast queries', () => {
      const metric: DatabaseMetric = {
        query: 'SELECT id FROM users WHERE email = ?',
        duration: 25,
        timestamp: new Date(),
        parameters: ['test@example.com'],
      };

      service.recordDatabase(metric);

      expect(mockLoggerService.warn).not.toHaveBeenCalled();
    });
  });

  describe('getRequestMetrics', () => {
    it('should return empty metrics when no requests recorded', () => {
      const metrics = service.getRequestMetrics();

      expect(metrics).toEqual({
        totalRequests: 0,
        averageResponseTime: 0,
        statusCodes: {},
        errorRate: 0,
        timeRange: '60s',
      });
    });

    it('should calculate request metrics correctly', () => {
      const now = new Date();
      const metrics: RequestMetric[] = [
        {
          method: 'GET',
          path: '/api/users',
          statusCode: 200,
          responseTime: 100,
          timestamp: now,
        },
        {
          method: 'POST',
          path: '/api/users',
          statusCode: 201,
          responseTime: 200,
          timestamp: now,
        },
        {
          method: 'GET',
          path: '/api/users/999',
          statusCode: 404,
          responseTime: 50,
          timestamp: now,
        },
      ];

      metrics.forEach((metric) => service.recordRequest(metric));

      const requestMetrics = service.getRequestMetrics();
      expect(requestMetrics.totalRequests).toBe(3);
      expect(requestMetrics.averageResponseTime).toBe(117); // (100+200+50)/3 rounded
      expect(requestMetrics.statusCodes).toEqual({ 200: 1, 201: 1, 404: 1 });
      expect(requestMetrics.errorRate).toBe(33.33); // 1 error out of 3 requests
    });

    it('should filter metrics by time range', () => {
      const oldTimestamp = new Date(Date.now() - 120000); // 2 minutes ago
      const recentTimestamp = new Date();

      const oldMetric: RequestMetric = {
        method: 'GET',
        path: '/api/old',
        statusCode: 200,
        responseTime: 100,
        timestamp: oldTimestamp,
      };

      const recentMetric: RequestMetric = {
        method: 'GET',
        path: '/api/recent',
        statusCode: 200,
        responseTime: 150,
        timestamp: recentTimestamp,
      };

      service.recordRequest(oldMetric);
      service.recordRequest(recentMetric);

      // Get metrics for last 60 seconds (should only include recent metric)
      const metrics = service.getRequestMetrics(60000);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.averageResponseTime).toBe(150);
    });
  });

  describe('getErrorMetrics', () => {
    it('should return empty error metrics when no errors recorded', () => {
      const metrics = service.getErrorMetrics();

      expect(metrics).toEqual({
        totalErrors: 0,
        errorsByType: {},
        errorsByPath: {},
        timeRange: '60s',
      });
    });

    it('should group errors by type and path', () => {
      const now = new Date();
      const errors: ErrorMetric[] = [
        {
          error: 'ValidationError: Invalid email',
          path: '/api/users',
          method: 'POST',
          timestamp: now,
          statusCode: 400,
        },
        {
          error: 'ValidationError: Missing field',
          path: '/api/users',
          method: 'POST',
          timestamp: now,
          statusCode: 400,
        },
        {
          error: 'NotFoundError: User not found',
          path: '/api/users/999',
          method: 'GET',
          timestamp: now,
          statusCode: 404,
        },
      ];

      errors.forEach((error) => service.recordError(error));

      const errorMetrics = service.getErrorMetrics();
      expect(errorMetrics.totalErrors).toBe(3);
      expect(errorMetrics.errorsByType).toEqual({
        ValidationError: 2,
        NotFoundError: 1,
      });
      expect(errorMetrics.errorsByPath).toEqual({
        '/api/users': 2,
        '/api/users/999': 1,
      });
    });
  });

  describe('getCacheMetrics', () => {
    it('should return empty cache metrics when no operations recorded', () => {
      const metrics = service.getCacheMetrics();

      expect(metrics).toEqual({
        hitRate: 0,
        totalOperations: 0,
        operationCounts: {},
        timeRange: '60s',
      });
    });

    it('should calculate cache metrics correctly', () => {
      const now = new Date();
      const operations: CacheMetric[] = [
        { operation: 'hit', key: 'user:1', timestamp: now },
        { operation: 'hit', key: 'user:2', timestamp: now },
        { operation: 'miss', key: 'user:3', timestamp: now },
        { operation: 'set', key: 'user:3', timestamp: now },
      ];

      operations.forEach((op) => service.recordCache(op));

      const cacheMetrics = service.getCacheMetrics();
      expect(cacheMetrics.hitRate).toBe(66.67); // 2 hits out of 3 hit/miss operations
      expect(cacheMetrics.totalOperations).toBe(4);
      expect(cacheMetrics.operationCounts).toEqual({
        hit: 2,
        miss: 1,
        set: 1,
      });
    });
  });

  describe('getDatabaseMetrics', () => {
    it('should return empty database metrics when no queries recorded', () => {
      const metrics = service.getDatabaseMetrics();

      expect(metrics).toEqual({
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        errorQueries: 0,
        timeRange: '60s',
      });
    });

    it('should calculate database metrics correctly', () => {
      const now = new Date();
      const queries: DatabaseMetric[] = [
        {
          query: 'SELECT * FROM users',
          duration: 50,
          timestamp: now,
        },
        {
          query: 'SELECT * FROM posts',
          duration: 1500, // Slow query
          timestamp: now,
        },
        {
          query: 'SELECT * FROM invalid_table',
          duration: 10,
          timestamp: now,
          error: 'Table does not exist',
        },
      ];

      queries.forEach((query) => service.recordDatabase(query));

      const dbMetrics = service.getDatabaseMetrics();
      expect(dbMetrics.totalQueries).toBe(3);
      expect(dbMetrics.averageQueryTime).toBe(520); // (50+1500+10)/3
      expect(dbMetrics.slowQueries).toBe(1);
      expect(dbMetrics.errorQueries).toBe(1);
    });
  });

  describe('getCurrentSystemMetrics', () => {
    it('should return current system metrics', () => {
      // Mock process methods
      const mockMemoryUsage = {
        heapUsed: 100 * 1024 * 1024,
        heapTotal: 200 * 1024 * 1024,
        external: 50 * 1024 * 1024,
        rss: 250 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024,
      };

      const mockCpuUsage = { user: 1000000, system: 500000 };

      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);
      jest.spyOn(process, 'cpuUsage').mockReturnValue(mockCpuUsage);
      jest.spyOn(process, 'uptime').mockReturnValue(3600);

      const systemMetrics = service.getCurrentSystemMetrics();

      expect(systemMetrics.cpuUsage).toBe(1); // 1000000 / 1000000
      expect(systemMetrics.memoryUsage).toEqual({
        heapUsed: mockMemoryUsage.heapUsed,
        heapTotal: mockMemoryUsage.heapTotal,
        external: mockMemoryUsage.external,
        rss: mockMemoryUsage.rss,
      });
      expect(systemMetrics.uptime).toBe(3600);
      expect(systemMetrics.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return comprehensive dashboard metrics', () => {
      const dashboard = service.getDashboardMetrics();

      expect(dashboard).toHaveProperty('requests');
      expect(dashboard).toHaveProperty('errors');
      expect(dashboard).toHaveProperty('cache');
      expect(dashboard).toHaveProperty('database');
      expect(dashboard).toHaveProperty('system');
      expect(dashboard).toHaveProperty('timestamp');
      expect(dashboard.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });
  });

  describe('trimMetrics', () => {
    it('should trim metrics when exceeding maxMetrics limit', () => {
      // Add more than maxMetrics (1000) request metrics
      for (let i = 0; i < 1100; i++) {
        const metric: RequestMetric = {
          method: 'GET',
          path: `/api/test/${i}`,
          statusCode: 200,
          responseTime: 100,
          timestamp: new Date(),
        };
        service.recordRequest(metric);
      }

      const requestMetrics = service.getRequestMetrics();
      expect(requestMetrics.totalRequests).toBeLessThanOrEqual(1000);
    });

    it('should remove old metrics based on retention time', () => {
      const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const recentTimestamp = new Date();

      const oldMetric: RequestMetric = {
        method: 'GET',
        path: '/api/old',
        statusCode: 200,
        responseTime: 100,
        timestamp: oldTimestamp,
      };

      const recentMetric: RequestMetric = {
        method: 'GET',
        path: '/api/recent',
        statusCode: 200,
        responseTime: 100,
        timestamp: recentTimestamp,
      };

      service.recordRequest(oldMetric);
      service.recordRequest(recentMetric);

      // Trigger trimming by adding more metrics
      for (let i = 0; i < 10; i++) {
        service.recordRequest({
          method: 'GET',
          path: `/api/trigger/${i}`,
          statusCode: 200,
          responseTime: 100,
          timestamp: new Date(),
        });
      }

      const requestMetrics = service.getRequestMetrics(25 * 60 * 60 * 1000); // 25 hours
      // Old metric should be trimmed out due to retention policy
      expect(requestMetrics.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('startSystemMetricsCollection', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should log warning for high memory usage', () => {
      // Mock high memory usage
      const mockMemoryUsage = {
        heapUsed: 180 * 1024 * 1024, // 180MB
        heapTotal: 200 * 1024 * 1024, // 200MB (90% usage)
        external: 50 * 1024 * 1024,
        rss: 250 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024,
      };

      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);
      jest
        .spyOn(process, 'cpuUsage')
        .mockReturnValue({ user: 1000000, system: 500000 });
      jest.spyOn(process, 'uptime').mockReturnValue(3600);

      // Create a new service instance to trigger the constructor
      new (service.constructor as new (logger: any) => any)(mockLoggerService);

      // Fast-forward time to trigger the interval
      jest.advanceTimersByTime(30000);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringMatching(/High memory usage: \d+\.\d+%/),
        'MetricsService',
      );
    });

    it('should not log warning for normal memory usage', () => {
      // Mock normal memory usage
      const mockMemoryUsage = {
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 200 * 1024 * 1024, // 200MB (25% usage)
        external: 50 * 1024 * 1024,
        rss: 250 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024,
      };

      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);
      jest
        .spyOn(process, 'cpuUsage')
        .mockReturnValue({ user: 1000000, system: 500000 });
      jest.spyOn(process, 'uptime').mockReturnValue(3600);

      // Create a new service instance to trigger the constructor
      new (service.constructor as new (logger: any) => any)(mockLoggerService);

      // Fast-forward time to trigger the interval
      jest.advanceTimersByTime(30000);

      expect(mockLoggerService.warn).not.toHaveBeenCalledWith(
        expect.stringMatching(/High memory usage/),
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle error metrics with complex error messages', () => {
      const metric: ErrorMetric = {
        error: 'ValidationError: Multiple validation errors occurred',
        path: '/api/complex',
        method: 'POST',
        timestamp: new Date(),
        statusCode: 400,
      };

      service.recordError(metric);

      const errorMetrics = service.getErrorMetrics();
      expect(errorMetrics.errorsByType.ValidationError).toBe(1);
    });

    it('should handle database metrics with very long queries', () => {
      const longQuery =
        'SELECT * FROM users WHERE ' +
        'condition AND '.repeat(50) +
        'final_condition = ?';
      const metric: DatabaseMetric = {
        query: longQuery,
        duration: 1500,
        timestamp: new Date(),
      };

      service.recordDatabase(metric);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow database query:'),
        'MetricsService',
      );
    });

    it('should handle cache metrics with zero hit rate', () => {
      const missMetric: CacheMetric = {
        operation: 'miss',
        key: 'user:1',
        timestamp: new Date(),
      };

      service.recordCache(missMetric);

      const cacheMetrics = service.getCacheMetrics();
      expect(cacheMetrics.hitRate).toBe(0);
    });

    it('should handle request metrics with custom time ranges', () => {
      const now = new Date();
      const metric: RequestMetric = {
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        responseTime: 100,
        timestamp: now,
      };

      service.recordRequest(metric);

      // Test with very short time range
      const shortRangeMetrics = service.getRequestMetrics(1000); // 1 second
      expect(shortRangeMetrics.totalRequests).toBe(1);

      // Test with very long time range
      const longRangeMetrics = service.getRequestMetrics(24 * 60 * 60 * 1000); // 24 hours
      expect(longRangeMetrics.totalRequests).toBe(1);
    });
  });
});
