import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';

import { LoggerService } from '../../common/services/logger.service';

import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  const mockDataSource = {
    query: jest.fn(),
    isInitialized: true,
  };

  const mockCacheManager = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logStructured: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock process methods
    jest.spyOn(process, 'uptime').mockReturnValue(3600);
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 50 * 1024 * 1024, // 50MB
      heapTotal: 100 * 1024 * 1024, // 100MB
      external: 5 * 1024 * 1024, // 5MB
      rss: 80 * 1024 * 1024, // 80MB
      arrayBuffers: 1 * 1024 * 1024, // 1MB
    });
    jest.spyOn(process, 'cpuUsage').mockReturnValue({
      user: 1000000,
      system: 500000,
    });
    jest.spyOn(process, 'cwd').mockReturnValue('/app');

    // Mock environment variables
    process.env.npm_package_version = '1.2.3';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.npm_package_version;
    delete process.env.NODE_ENV;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    beforeEach(() => {
      // Mock successful checks by default
      mockDataSource.query.mockResolvedValue([{ '1': 1 }]);

      // Mock Redis to work correctly - store the value and return it
      let storedValue: string;
      mockCacheManager.set.mockImplementation((key, value) => {
        storedValue = value;
        return Promise.resolve(undefined);
      });
      mockCacheManager.get.mockImplementation(() => {
        return Promise.resolve(storedValue);
      });
      mockCacheManager.del.mockResolvedValue(undefined);
    });

    it('should return healthy status when all checks pass', async () => {
      const result = await service.check();

      expect(result).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: 3600,
        responseTime: expect.any(Number),
        checks: [
          {
            name: 'database',
            status: 'healthy',
            details: {
              status: 'connected',
              responseTime: expect.any(Number),
              connectionCount: 1,
            },
          },
          {
            name: 'redis',
            status: 'healthy',
            details: {
              status: 'connected',
              responseTime: expect.any(Number),
            },
          },
          {
            name: 'memory',
            status: 'healthy',
            details: {
              heapUsed: 50 * 1024 * 1024,
              heapTotal: 100 * 1024 * 1024,
              external: 5 * 1024 * 1024,
              rss: 80 * 1024 * 1024,
              heapUsedPercent: 50,
              status: 'healthy',
            },
          },
          {
            name: 'disk',
            status: 'healthy',
            details: {
              status: 'available',
              path: '/app',
            },
          },
        ],
        version: '1.2.3',
        environment: 'test',
      });

      expect(mockLoggerService.logStructured).toHaveBeenCalledWith(
        'info',
        'Health check completed: healthy',
        {
          context: 'HealthService',
          responseTime: expect.any(Number),
          checks: [
            { name: 'database', status: 'healthy' },
            { name: 'redis', status: 'healthy' },
            { name: 'memory', status: 'healthy' },
            { name: 'disk', status: 'healthy' },
          ],
        },
      );
    });

    it('should return unhealthy status when database check fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection timeout'));

      const result = (await service.check()) as {
        status: string;
        checks: {
          name: string;
          status: string;
          details: unknown;
        }[];
      };

      expect(result.status).toBe('unhealthy');
      expect(result.checks[0]).toEqual({
        name: 'database',
        status: 'unhealthy',
        details: new Error('Database connection failed: Connection timeout'),
      });

      expect(mockLoggerService.logStructured).toHaveBeenCalledWith(
        'warn',
        'Health check completed: unhealthy',
        expect.any(Object),
      );
    });

    it('should return unhealthy status when redis check fails', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Redis unavailable'));

      const result = (await service.check()) as {
        status: string;
        checks: {
          name: string;
          status: string;
          details: unknown;
        }[];
      };

      expect(result.status).toBe('unhealthy');
      expect(result.checks[1]).toEqual({
        name: 'redis',
        status: 'unhealthy',
        details: new Error('Redis connection failed: Redis unavailable'),
      });
    });

    it('should return unhealthy status when memory usage is too high', async () => {
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 1.5 * 1024 * 1024 * 1024, // 1.5GB (over 1GB threshold)
        heapTotal: 2 * 1024 * 1024 * 1024, // 2GB
        external: 100 * 1024 * 1024,
        rss: 1.8 * 1024 * 1024 * 1024,
        arrayBuffers: 50 * 1024 * 1024,
      });

      const result = (await service.check()) as {
        status: string;
        checks: {
          name: string;
          status: string;
          details: Error;
        }[];
      };

      expect(result.status).toBe('unhealthy');
      expect(result.checks[2]).toEqual({
        name: 'memory',
        status: 'unhealthy',
        details: expect.any(Error),
      });
      expect(result.checks[2].details.message).toBe(
        'Memory usage too high: 75%',
      );
    });

    it('should handle memory warning status', async () => {
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 85 * 1024 * 1024, // 85MB
        heapTotal: 100 * 1024 * 1024, // 100MB (85% usage)
        external: 5 * 1024 * 1024,
        rss: 90 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
      });

      const result = (await service.check()) as {
        checks: {
          name: string;
          status: string;
          details: {
            heapUsed: number;
            heapTotal: number;
            external: number;
            rss: number;
            heapUsedPercent: number;
            status: string;
          };
        }[];
      };

      expect(result.checks[2].details).toEqual({
        heapUsed: 85 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        rss: 90 * 1024 * 1024,
        heapUsedPercent: 85,
        status: 'warning',
      });
    });

    it('should handle default environment values', async () => {
      delete process.env.npm_package_version;
      delete process.env.NODE_ENV;

      const result = (await service.check()) as {
        version: string;
        environment: string;
      };

      expect(result.version).toBe('1.0.0');
      expect(result.environment).toBe('development');
    });

    it('should handle redis data integrity failure', async () => {
      mockCacheManager.get.mockResolvedValue('wrong-value');

      const result = (await service.check()) as {
        status: string;
        checks: {
          name: string;
          status: string;
          details: unknown;
        }[];
      };

      expect(result.status).toBe('unhealthy');
      expect(result.checks[1]).toEqual({
        name: 'redis',
        status: 'unhealthy',
        details: new Error(
          'Redis connection failed: Redis data integrity check failed',
        ),
      });
    });

    it('should handle database not initialized', async () => {
      mockDataSource.isInitialized = false;

      const result = (await service.check()) as {
        checks: {
          name: string;
          status: string;
          details: {
            connectionCount: number;
          };
        }[];
      };

      expect(result.checks[0].details.connectionCount).toBe(0);
    });
  });

  describe('readiness', () => {
    it('should return ready status when critical dependencies are available', async () => {
      mockDataSource.query.mockResolvedValue([{ '1': 1 }]);

      // Mock Redis to work correctly for readiness check
      let storedValue: string;
      mockCacheManager.set.mockImplementation((_key, value) => {
        storedValue = value;
        return Promise.resolve(undefined);
      });
      mockCacheManager.get.mockImplementation(() => {
        return Promise.resolve(storedValue);
      });
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.readiness();

      expect(result).toEqual({
        status: 'ready',
        timestamp: expect.any(String),
        responseTime: expect.any(Number),
      });

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        expect.stringMatching(/Readiness check passed in \d+ms/),
        'HealthService',
      );
    });

    it('should return not ready status when database fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Database down'));

      const result = await service.readiness();

      expect(result).toEqual({
        status: 'not ready',
        timestamp: expect.any(String),
        error: 'Database connection failed: Database down',
      });

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Readiness check failed: Database connection failed: Database down',
        expect.any(String),
        'HealthService',
      );
    });

    it('should return not ready status when redis fails', async () => {
      mockDataSource.query.mockResolvedValue([{ '1': 1 }]);
      mockCacheManager.set.mockRejectedValue(new Error('Redis down'));

      const result = await service.readiness();

      expect(result).toEqual({
        status: 'not ready',
        timestamp: expect.any(String),
        error: 'Redis connection failed: Redis down',
      });
    });
  });

  describe('liveness', () => {
    it('should return alive status with system metrics', async () => {
      const result = await service.liveness();

      expect(result).toEqual({
        status: 'alive',
        timestamp: expect.any(String),
        uptime: 3600,
        memory: {
          heapUsed: 50 * 1024 * 1024,
          heapTotal: 100 * 1024 * 1024,
          external: 5 * 1024 * 1024,
          rss: 80 * 1024 * 1024,
          heapUsedPercent: 50,
        },
        cpu: {
          user: 1000000,
          system: 500000,
        },
        pid: process.pid,
        version: process.version,
      });

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        'Liveness check completed',
        'HealthService',
      );
    });

    it('should handle different memory usage scenarios', async () => {
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 90 * 1024 * 1024, // 90MB
        heapTotal: 120 * 1024 * 1024, // 120MB
        external: 10 * 1024 * 1024,
        rss: 110 * 1024 * 1024,
        arrayBuffers: 2 * 1024 * 1024,
      });

      const result = (await service.liveness()) as {
        memory: {
          heapUsedPercent: number;
        };
      };

      expect(result.memory.heapUsedPercent).toBe(75); // 90/120 * 100 = 75%
    });

    it('should handle different CPU usage scenarios', async () => {
      jest.spyOn(process, 'cpuUsage').mockReturnValue({
        user: 2000000,
        system: 1000000,
      });

      const result = (await service.liveness()) as {
        cpu: {
          user: number;
          system: number;
        };
      };

      expect(result.cpu).toEqual({
        user: 2000000,
        system: 1000000,
      });
    });

    it('should handle different uptime values', async () => {
      jest.spyOn(process, 'uptime').mockReturnValue(86400); // 24 hours

      const result = (await service.liveness()) as {
        uptime: number;
      };

      expect(result.uptime).toBe(86400);
    });
  });

  describe('private methods edge cases', () => {
    it('should handle database query errors with specific messages', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection refused'));

      try {
        await (
          service as unknown as { checkDatabase: () => Promise<unknown> }
        ).checkDatabase();
        fail('Expected method to throw');
      } catch (error) {
        expect(error.message).toBe(
          'Database connection failed: Connection refused',
        );
      }
    });

    it('should handle redis connection timeout', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Connection timeout'));

      try {
        await (
          service as unknown as { checkRedis: () => Promise<unknown> }
        ).checkRedis();
        fail('Expected method to throw');
      } catch (error) {
        expect(error.message).toBe(
          'Redis connection failed: Connection timeout',
        );
      }
    });

    it('should handle redis get operation failure', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockRejectedValue(new Error('Get operation failed'));

      try {
        await (
          service as unknown as { checkRedis: () => Promise<unknown> }
        ).checkRedis();
        fail('Expected method to throw');
      } catch (error) {
        expect(error.message).toBe(
          'Redis connection failed: Get operation failed',
        );
      }
    });

    it('should handle redis delete operation failure', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('test-value');
      mockCacheManager.del.mockRejectedValue(
        new Error('Delete operation failed'),
      );

      try {
        await (
          service as unknown as { checkRedis: () => Promise<unknown> }
        ).checkRedis();
        fail('Expected method to throw');
      } catch (error) {
        expect(error.message).toBe(
          'Redis connection failed: Delete operation failed',
        );
      }
    });

    it('should handle memory check with exact threshold', async () => {
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 1024 * 1024 * 1024, // Exactly 1GB
        heapTotal: 2 * 1024 * 1024 * 1024,
        external: 100 * 1024 * 1024,
        rss: 1.5 * 1024 * 1024 * 1024,
        arrayBuffers: 50 * 1024 * 1024,
      });

      const result = (
        service as unknown as {
          checkMemory: () => {
            heapUsedPercent: number;
            status: string;
          };
        }
      ).checkMemory();

      expect(result.heapUsedPercent).toBe(50);
      expect(result.status).toBe('healthy');
    });

    it('should handle memory check with exactly 80% usage', async () => {
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 80 * 1024 * 1024, // 80MB
        heapTotal: 100 * 1024 * 1024, // 100MB (exactly 80%)
        external: 5 * 1024 * 1024,
        rss: 85 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
      });

      const result = (
        service as unknown as {
          checkMemory: () => {
            heapUsedPercent: number;
            status: string;
          };
        }
      ).checkMemory();

      expect(result.heapUsedPercent).toBe(80);
      expect(result.status).toBe('healthy'); // 80% is not > 80%
    });

    it('should handle disk space check', async () => {
      const result = await (
        service as unknown as { checkDiskSpace: () => Promise<unknown> }
      ).checkDiskSpace();

      expect(result).toEqual({
        status: 'available',
        path: '/app',
      });
    });

    it('should handle process.cwd() errors in disk check', async () => {
      jest.spyOn(process, 'cwd').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      try {
        await (
          service as unknown as { checkDiskSpace: () => Promise<unknown> }
        ).checkDiskSpace();
        fail('Expected method to throw');
      } catch (error) {
        expect(error.message).toBe(
          'Disk space check failed: Permission denied',
        );
      }
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed success and failure scenarios', async () => {
      // Database succeeds, Redis fails, Memory succeeds, Disk succeeds
      mockDataSource.query.mockResolvedValue([{ '1': 1 }]);
      mockCacheManager.set.mockRejectedValue(new Error('Redis down'));

      const result = (await service.check()) as {
        status: string;
        checks: {
          name: string;
          status: string;
          details: unknown;
        }[];
      };

      expect(result.status).toBe('unhealthy');
      expect(result.checks[0].status).toBe('healthy');
      expect(result.checks[1].status).toBe('unhealthy');
      expect(result.checks[2].status).toBe('healthy');
      expect(result.checks[3].status).toBe('healthy');
    });

    it('should handle all checks failing', async () => {
      mockDataSource.query.mockRejectedValue(new Error('DB down'));
      mockCacheManager.set.mockRejectedValue(new Error('Redis down'));
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 2 * 1024 * 1024 * 1024, // 2GB (over threshold)
        heapTotal: 2.5 * 1024 * 1024 * 1024,
        external: 100 * 1024 * 1024,
        rss: 2.2 * 1024 * 1024 * 1024,
        arrayBuffers: 50 * 1024 * 1024,
      });
      jest.spyOn(process, 'cwd').mockImplementation(() => {
        throw new Error('Disk error');
      });

      const result = (await service.check()) as {
        status: string;
        checks: {
          name: string;
          status: string;
          details: Error;
        }[];
      };

      expect(result.status).toBe('unhealthy');
      expect(result.checks.every((check) => check.status === 'unhealthy')).toBe(
        true,
      );
      expect(result.checks[2].details.message).toContain(
        'Memory usage too high',
      );
    });

    it('should measure response time accurately', async () => {
      const startTime = Date.now();

      // Add some delay to simulate real checks
      mockDataSource.query.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve([{ '1': 1 }]), 10)),
      );

      // Mock Redis to work correctly
      let storedValue: string;
      mockCacheManager.set.mockImplementation((_key, value) => {
        storedValue = value;
        return Promise.resolve(undefined);
      });
      mockCacheManager.get.mockImplementation(() => {
        return Promise.resolve(storedValue);
      });
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = (await service.check()) as {
        responseTime: number;
      };
      const endTime = Date.now();

      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.responseTime).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });
  });
});
