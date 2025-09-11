import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';

import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {}

  async check(): Promise<unknown> {
    const startTime = Date.now();

    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDiskSpace(),
    ]);

    const results = checks.map((check, index) => {
      const names = ['database', 'redis', 'memory', 'disk'];
      return {
        name: names[index],
        status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details: check.status === 'fulfilled' ? check.value : check.reason,
      };
    });

    const isHealthy = results.every((result) => result.status === 'healthy');
    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      checks: results,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Log health check results
    this.logger.logStructured(
      isHealthy ? 'info' : 'warn',
      `Health check completed: ${isHealthy ? 'healthy' : 'unhealthy'}`,
      {
        context: 'HealthService',
        responseTime,
        checks: results.map((r) => ({ name: r.name, status: r.status })),
      },
    );

    return healthStatus;
  }

  async readiness(): Promise<unknown> {
    try {
      const startTime = Date.now();

      // Check critical dependencies for readiness
      await Promise.all([this.checkDatabase(), this.checkRedis()]);

      const responseTime = Date.now() - startTime;

      const readinessStatus = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        responseTime,
      };

      this.logger.log(
        `Readiness check passed in ${responseTime}ms`,
        'HealthService',
      );

      return readinessStatus;
    } catch (error) {
      const errorStatus = {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      };

      this.logger.error(
        `Readiness check failed: ${error.message}`,
        error.stack,
        'HealthService',
      );

      return errorStatus;
    }
  }

  async liveness(): Promise<unknown> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const livenessStatus = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        heapUsedPercent: Math.round(
          (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        ),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      pid: process.pid,
      version: process.version,
    };

    this.logger.debug('Liveness check completed', 'HealthService');

    return livenessStatus;
  }

  private async checkDatabase(): Promise<unknown> {
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'connected',
        responseTime,
        connectionCount: this.dataSource.isInitialized ? 1 : 0,
      };
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  private async checkRedis(): Promise<unknown> {
    try {
      const startTime = Date.now();
      const testKey = 'health-check-test';
      const testValue = Date.now().toString();

      // Test Redis connectivity
      await this.cacheManager.set(testKey, testValue, 1000); // 1 second TTL
      const retrievedValue = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);

      const responseTime = Date.now() - startTime;

      if (retrievedValue !== testValue) {
        throw new Error('Redis data integrity check failed');
      }

      return {
        status: 'connected',
        responseTime,
      };
    } catch (error) {
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  private checkMemory(): unknown {
    const memoryUsage = process.memoryUsage();
    const maxMemory = 1024 * 1024 * 1024; // 1GB threshold
    const heapUsedPercent =
      (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (memoryUsage.heapUsed > maxMemory) {
      throw new Error(`Memory usage too high: ${Math.round(heapUsedPercent)}%`);
    }

    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      heapUsedPercent: Math.round(heapUsedPercent),
      status: heapUsedPercent > 80 ? 'warning' : 'healthy',
    };
  }

  private async checkDiskSpace(): Promise<unknown> {
    try {
      return {
        status: 'available',
        path: process.cwd(),
        // Note: Getting actual disk space requires additional libraries
        // This is a basic implementation
      };
    } catch (error) {
      throw new Error(`Disk space check failed: ${error.message}`);
    }
  }
}
