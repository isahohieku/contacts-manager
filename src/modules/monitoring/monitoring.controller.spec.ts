import { AuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from '../../common/services/logger.service';
import {
  MetricsService,
  SystemMetric,
} from '../../common/services/metrics.service';

import { MonitoringController } from './monitoring.controller';

describe('MonitoringController', () => {
  let controller: MonitoringController;

  const mockMetricsService = {
    getDashboardMetrics: jest.fn(),
    getRequestMetrics: jest.fn(),
    getErrorMetrics: jest.fn(),
    getCacheMetrics: jest.fn(),
    getDatabaseMetrics: jest.fn(),
    getCurrentSystemMetrics: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<MonitoringController>(MonitoringController);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    const mockDashboardMetrics = {
      requests: {
        totalRequests: 150,
        averageResponseTime: 245,
        errorRate: 2.5,
        statusCodes: { 200: 140, 404: 5, 500: 5 },
        timeRange: '60s',
      },
      errors: {
        totalErrors: 12,
        errorsByType: { ValidationError: 8, DatabaseError: 3, AuthError: 1 },
        errorsByPath: { '/api/v1/contacts': 5, '/api/v1/auth/login': 3 },
        timeRange: '60s',
      },
      cache: {
        hitRate: 85.5,
        totalOperations: 200,
        operationCounts: { hit: 171, miss: 29, set: 25, delete: 5 },
        timeRange: '60s',
      },
      database: {
        totalQueries: 45,
        averageQueryTime: 125,
        slowQueries: 2,
        errorQueries: 0,
        timeRange: '60s',
      },
      system: {
        cpuUsage: 15.5,
        memoryUsage: {
          heapUsed: 45678912,
          heapTotal: 67108864,
          external: 1234567,
          rss: 89012345,
        },
        uptime: 3600.5,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
      },
      timestamp: '2024-01-15T10:30:00.000Z',
    };

    it('should return dashboard metrics successfully', async () => {
      mockMetricsService.getDashboardMetrics.mockResolvedValue(
        mockDashboardMetrics,
      );

      const result = await controller.getMetrics();

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Metrics endpoint accessed',
        'MonitoringController',
      );
      expect(mockMetricsService.getDashboardMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockDashboardMetrics);
    });

    it('should handle metrics service errors', async () => {
      const error = new Error('Metrics service unavailable');
      mockMetricsService.getDashboardMetrics.mockRejectedValue(error);

      await expect(controller.getMetrics()).rejects.toThrow(
        'Metrics service unavailable',
      );
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Metrics endpoint accessed',
        'MonitoringController',
      );
    });
  });

  describe('getRequestMetrics', () => {
    const mockRequestMetrics = {
      totalRequests: 150,
      averageResponseTime: 245,
      errorRate: 2.5,
      statusCodes: { 200: 140, 404: 5, 500: 5 },
      timeRange: '60s',
    };

    it('should return request metrics with default time range', async () => {
      mockMetricsService.getRequestMetrics.mockResolvedValue(
        mockRequestMetrics,
      );

      const result = await controller.getRequestMetrics();

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Request metrics accessed for 60000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getRequestMetrics).toHaveBeenCalledWith(60000);
      expect(result).toEqual(mockRequestMetrics);
    });

    it('should return request metrics with custom time range', async () => {
      mockMetricsService.getRequestMetrics.mockResolvedValue({
        ...mockRequestMetrics,
        timeRange: '300s',
      });

      const result = await controller.getRequestMetrics('300000');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Request metrics accessed for 300000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getRequestMetrics).toHaveBeenCalledWith(300000);
      expect(result.timeRange).toBe('300s');
    });

    it('should handle invalid time range string', async () => {
      mockMetricsService.getRequestMetrics.mockResolvedValue(
        mockRequestMetrics,
      );

      const result = await controller.getRequestMetrics('invalid');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Request metrics accessed for NaNms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getRequestMetrics).toHaveBeenCalledWith(NaN);
      expect(result).toEqual(mockRequestMetrics);
    });

    it('should handle zero time range', async () => {
      mockMetricsService.getRequestMetrics.mockResolvedValue(
        mockRequestMetrics,
      );

      const result = await controller.getRequestMetrics('0');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Request metrics accessed for 0ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getRequestMetrics).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockRequestMetrics);
    });

    it('should handle negative time range', async () => {
      mockMetricsService.getRequestMetrics.mockResolvedValue(
        mockRequestMetrics,
      );

      const result = await controller.getRequestMetrics('-1000');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Request metrics accessed for -1000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getRequestMetrics).toHaveBeenCalledWith(-1000);
      expect(result).toEqual(mockRequestMetrics);
    });

    it('should handle metrics service errors', async () => {
      const error = new Error('Request metrics unavailable');
      mockMetricsService.getRequestMetrics.mockRejectedValue(error);

      await expect(controller.getRequestMetrics()).rejects.toThrow(
        'Request metrics unavailable',
      );
    });
  });

  describe('getErrorMetrics', () => {
    const mockErrorMetrics = {
      totalErrors: 12,
      errorsByType: { ValidationError: 8, DatabaseError: 3, AuthError: 1 },
      errorsByPath: { '/api/v1/contacts': 5, '/api/v1/auth/login': 3 },
      timeRange: '60s',
    };

    it('should return error metrics with default time range', async () => {
      mockMetricsService.getErrorMetrics.mockResolvedValue(mockErrorMetrics);

      const result = await controller.getErrorMetrics();

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Error metrics accessed for 60000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getErrorMetrics).toHaveBeenCalledWith(60000);
      expect(result).toEqual(mockErrorMetrics);
    });

    it('should return error metrics with custom time range', async () => {
      mockMetricsService.getErrorMetrics.mockResolvedValue({
        ...mockErrorMetrics,
        timeRange: '300s',
      });

      const result = await controller.getErrorMetrics('300000');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Error metrics accessed for 300000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getErrorMetrics).toHaveBeenCalledWith(300000);
      expect(result.timeRange).toBe('300s');
    });

    it('should handle large time range values', async () => {
      mockMetricsService.getErrorMetrics.mockResolvedValue(mockErrorMetrics);

      const result = await controller.getErrorMetrics('86400000');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Error metrics accessed for 86400000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getErrorMetrics).toHaveBeenCalledWith(86400000);
      expect(result).toEqual(mockErrorMetrics);
    });

    it('should handle metrics service errors', async () => {
      const error = new Error('Error metrics unavailable');
      mockMetricsService.getErrorMetrics.mockRejectedValue(error);

      await expect(controller.getErrorMetrics()).rejects.toThrow(
        'Error metrics unavailable',
      );
    });
  });

  describe('getCacheMetrics', () => {
    const mockCacheMetrics = {
      hitRate: 85.5,
      totalOperations: 200,
      operationCounts: { hit: 171, miss: 29, set: 25, delete: 5 },
      timeRange: '60s',
    };

    it('should return cache metrics with default time range', async () => {
      mockMetricsService.getCacheMetrics.mockResolvedValue(mockCacheMetrics);

      const result = await controller.getCacheMetrics();

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Cache metrics accessed for 60000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getCacheMetrics).toHaveBeenCalledWith(60000);
      expect(result).toEqual(mockCacheMetrics);
    });

    it('should return cache metrics with custom time range', async () => {
      mockMetricsService.getCacheMetrics.mockResolvedValue({
        ...mockCacheMetrics,
        timeRange: '300s',
      });

      const result = await controller.getCacheMetrics('300000');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Cache metrics accessed for 300000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getCacheMetrics).toHaveBeenCalledWith(300000);
      expect(result.timeRange).toBe('300s');
    });

    it('should handle metrics service errors', async () => {
      const error = new Error('Cache metrics unavailable');
      mockMetricsService.getCacheMetrics.mockRejectedValue(error);

      await expect(controller.getCacheMetrics()).rejects.toThrow(
        'Cache metrics unavailable',
      );
    });
  });

  describe('getDatabaseMetrics', () => {
    const mockDatabaseMetrics = {
      totalQueries: 45,
      averageQueryTime: 125,
      slowQueries: 2,
      errorQueries: 0,
      timeRange: '60s',
    };

    it('should return database metrics with default time range', async () => {
      mockMetricsService.getDatabaseMetrics.mockResolvedValue(
        mockDatabaseMetrics,
      );

      const result = await controller.getDatabaseMetrics();

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Database metrics accessed for 60000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getDatabaseMetrics).toHaveBeenCalledWith(60000);
      expect(result).toEqual(mockDatabaseMetrics);
    });

    it('should return database metrics with custom time range', async () => {
      mockMetricsService.getDatabaseMetrics.mockResolvedValue({
        ...mockDatabaseMetrics,
        timeRange: '300s',
      });

      const result = await controller.getDatabaseMetrics('300000');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Database metrics accessed for 300000ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getDatabaseMetrics).toHaveBeenCalledWith(
        300000,
      );
      expect(result.timeRange).toBe('300s');
    });

    it('should handle very small time range values', async () => {
      mockMetricsService.getDatabaseMetrics.mockResolvedValue(
        mockDatabaseMetrics,
      );

      const result = await controller.getDatabaseMetrics('1');

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Database metrics accessed for 1ms range',
        'MonitoringController',
      );
      expect(mockMetricsService.getDatabaseMetrics).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDatabaseMetrics);
    });

    it('should handle metrics service errors', async () => {
      const error = new Error('Database metrics unavailable');
      mockMetricsService.getDatabaseMetrics.mockRejectedValue(error);

      await expect(controller.getDatabaseMetrics()).rejects.toThrow(
        'Database metrics unavailable',
      );
    });
  });

  describe('getSystemMetrics', () => {
    const mockSystemMetrics: SystemMetric = {
      cpuUsage: 15.5,
      memoryUsage: {
        heapUsed: 45678912,
        heapTotal: 67108864,
        external: 1234567,
        rss: 89012345,
      },
      uptime: 3600.5,
      timestamp: new Date('2024-01-15T10:30:00.000Z'),
    };

    it('should return system metrics successfully', async () => {
      mockMetricsService.getCurrentSystemMetrics.mockResolvedValue(
        mockSystemMetrics,
      );

      const result = await controller.getSystemMetrics();

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'System metrics accessed',
        'MonitoringController',
      );
      expect(mockMetricsService.getCurrentSystemMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockSystemMetrics);
    });

    it('should handle different system metric values', async () => {
      const differentMetrics: SystemMetric = {
        cpuUsage: 95.2,
        memoryUsage: {
          heapUsed: 100000000,
          heapTotal: 120000000,
          external: 5000000,
          rss: 150000000,
        },
        uptime: 86400.0, // 24 hours
        timestamp: new Date('2024-01-16T10:30:00.000Z'),
      };
      mockMetricsService.getCurrentSystemMetrics.mockResolvedValue(
        differentMetrics,
      );

      const result = await controller.getSystemMetrics();

      expect(result).toEqual(differentMetrics);
      expect(result.cpuUsage).toBe(95.2);
      expect(result.uptime).toBe(86400.0);
    });

    it('should handle metrics service errors', async () => {
      const error = new Error('System metrics unavailable');
      mockMetricsService.getCurrentSystemMetrics.mockRejectedValue(error);

      await expect(controller.getSystemMetrics()).rejects.toThrow(
        'System metrics unavailable',
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty string time range', async () => {
      mockMetricsService.getRequestMetrics.mockResolvedValue({
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        statusCodes: {},
        timeRange: '60s',
      });

      const result = await controller.getRequestMetrics('');

      // Empty string is falsy, so controller uses default 60000
      expect(mockMetricsService.getRequestMetrics).toHaveBeenCalledWith(60000);
      expect(result.timeRange).toBe('60s');
    });

    it('should handle whitespace-only time range', async () => {
      mockMetricsService.getErrorMetrics.mockResolvedValue({
        totalErrors: 0,
        errorsByType: {},
        errorsByPath: {},
        timeRange: '60s',
      });

      const result = await controller.getErrorMetrics('   ');

      // Whitespace string parseInt returns NaN, controller passes NaN to service
      expect(mockMetricsService.getErrorMetrics).toHaveBeenCalledWith(NaN);
      expect(result.timeRange).toBe('60s');
    });

    it('should handle decimal time range values', async () => {
      mockMetricsService.getCacheMetrics.mockResolvedValue({
        hitRate: 0,
        totalOperations: 0,
        operationCounts: {},
        timeRange: '123s',
      });

      const result = await controller.getCacheMetrics('123.45');

      expect(mockMetricsService.getCacheMetrics).toHaveBeenCalledWith(123);
      expect(result.timeRange).toBe('123s');
    });

    it('should handle very large time range values', async () => {
      mockMetricsService.getDatabaseMetrics.mockResolvedValue({
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        errorQueries: 0,
        timeRange: '999999999s',
      });

      const result = await controller.getDatabaseMetrics('999999999999');

      expect(mockMetricsService.getDatabaseMetrics).toHaveBeenCalledWith(
        999999999999,
      );
      expect(result.timeRange).toBe('999999999s');
    });
  });

  describe('authentication and authorization', () => {
    it('should be protected by JWT auth guard', () => {
      const guards = Reflect.getMetadata('__guards__', MonitoringController);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });

    it('should have proper API documentation decorators', () => {
      const apiTags = Reflect.getMetadata(
        'swagger/apiUseTags',
        MonitoringController,
      );
      expect(apiTags).toContain('Monitoring');
    });
  });
});
