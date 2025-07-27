import { Injectable } from '@nestjs/common';

import { LoggerService } from './logger.service';

export interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  userId?: number;
}

export interface ErrorMetric {
  error: string;
  stack?: string;
  path: string;
  method: string;
  timestamp: Date;
  userId?: number;
  statusCode: number;
}

export interface CacheMetric {
  operation: 'hit' | 'miss' | 'set' | 'delete';
  key: string;
  timestamp: Date;
  responseTime?: number;
}

export interface DatabaseMetric {
  query: string;
  duration: number;
  timestamp: Date;
  parameters?: any[];
  error?: string;
}

export interface SystemMetric {
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  timestamp: Date;
  activeConnections?: number;
  uptime: number;
}

@Injectable()
export class MetricsService {
  private requestMetrics: RequestMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private databaseMetrics: DatabaseMetric[] = [];
  private systemMetrics: SystemMetric[] = [];

  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory
  private readonly metricsRetentionMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly logger: LoggerService) {
    // Start system metrics collection
    this.startSystemMetricsCollection();
  }

  /**
   * Record HTTP request metrics
   */
  recordRequest(metric: RequestMetric): void {
    this.requestMetrics.push(metric);
    this.trimMetrics(this.requestMetrics);

    // Log slow requests
    if (metric.responseTime > 1000) {
      this.logger.warn(
        `Slow request: ${metric.method} ${metric.path} took ${metric.responseTime}ms`,
        'MetricsService',
      );
    }

    // Log error responses
    if (metric.statusCode >= 400) {
      this.logger.warn(
        `Error response: ${metric.method} ${metric.path} returned ${metric.statusCode}`,
        'MetricsService',
      );
    }
  }

  /**
   * Record error metrics
   */
  recordError(metric: ErrorMetric): void {
    this.errorMetrics.push(metric);
    this.trimMetrics(this.errorMetrics);

    this.logger.error(
      `Application error: ${metric.error} on ${metric.method} ${metric.path}`,
      metric.stack,
      'MetricsService',
    );
  }

  /**
   * Record cache operation metrics
   */
  recordCache(metric: CacheMetric): void {
    this.cacheMetrics.push(metric);
    this.trimMetrics(this.cacheMetrics);
  }

  /**
   * Record database query metrics
   */
  recordDatabase(metric: DatabaseMetric): void {
    this.databaseMetrics.push(metric);
    this.trimMetrics(this.databaseMetrics);

    // Log slow queries
    if (metric.duration > 1000) {
      this.logger.warn(
        `Slow database query: ${metric.query.substring(0, 100)}... took ${metric.duration}ms`,
        'MetricsService',
      );
    }

    // Log query errors
    if (metric.error) {
      this.logger.error(
        `Database query error: ${metric.error}`,
        undefined,
        'MetricsService',
      );
    }
  }

  /**
   * Get request metrics summary
   */
  getRequestMetrics(timeRangeMs = 60000): any {
    const cutoff = new Date(Date.now() - timeRangeMs);
    const recentMetrics = this.requestMetrics.filter(
      (m) => m.timestamp >= cutoff,
    );

    const totalRequests = recentMetrics.length;
    const averageResponseTime =
      totalRequests > 0
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
          totalRequests
        : 0;

    const statusCodes = recentMetrics.reduce(
      (acc, m) => {
        acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    const errorRate =
      totalRequests > 0
        ? (recentMetrics.filter((m) => m.statusCode >= 400).length /
            totalRequests) *
          100
        : 0;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      statusCodes,
      timeRange: `${timeRangeMs / 1000}s`,
    };
  }

  /**
   * Get error metrics summary
   */
  getErrorMetrics(timeRangeMs = 60000): any {
    const cutoff = new Date(Date.now() - timeRangeMs);
    const recentErrors = this.errorMetrics.filter((m) => m.timestamp >= cutoff);

    const errorsByType = recentErrors.reduce(
      (acc, m) => {
        const errorType = m.error.split(':')[0] || 'Unknown';
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const errorsByPath = recentErrors.reduce(
      (acc, m) => {
        acc[m.path] = (acc[m.path] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByPath,
      timeRange: `${timeRangeMs / 1000}s`,
    };
  }

  /**
   * Get cache metrics summary
   */
  getCacheMetrics(timeRangeMs = 60000): any {
    const cutoff = new Date(Date.now() - timeRangeMs);
    const recentMetrics = this.cacheMetrics.filter(
      (m) => m.timestamp >= cutoff,
    );

    const hits = recentMetrics.filter((m) => m.operation === 'hit').length;
    const misses = recentMetrics.filter((m) => m.operation === 'miss').length;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    const operationCounts = recentMetrics.reduce(
      (acc, m) => {
        acc[m.operation] = (acc[m.operation] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      hitRate: Math.round(hitRate * 100) / 100,
      totalOperations: recentMetrics.length,
      operationCounts,
      timeRange: `${timeRangeMs / 1000}s`,
    };
  }

  /**
   * Get database metrics summary
   */
  getDatabaseMetrics(timeRangeMs = 60000): any {
    const cutoff = new Date(Date.now() - timeRangeMs);
    const recentMetrics = this.databaseMetrics.filter(
      (m) => m.timestamp >= cutoff,
    );

    const totalQueries = recentMetrics.length;
    const averageQueryTime =
      totalQueries > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
        : 0;

    const slowQueries = recentMetrics.filter((m) => m.duration > 1000).length;
    const errorQueries = recentMetrics.filter((m) => m.error).length;

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime),
      slowQueries,
      errorQueries,
      timeRange: `${timeRangeMs / 1000}s`,
    };
  }

  /**
   * Get current system metrics
   */
  getCurrentSystemMetrics(): SystemMetric {
    const memoryUsage = process.memoryUsage();

    return {
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      timestamp: new Date(),
      uptime: process.uptime(),
    };
  }

  /**
   * Get comprehensive metrics dashboard data
   */
  getDashboardMetrics(): any {
    return {
      requests: this.getRequestMetrics(),
      errors: this.getErrorMetrics(),
      cache: this.getCacheMetrics(),
      database: this.getDatabaseMetrics(),
      system: this.getCurrentSystemMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Start collecting system metrics periodically
   */
  private startSystemMetricsCollection(): void {
    setInterval(() => {
      const metric = this.getCurrentSystemMetrics();
      this.systemMetrics.push(metric);
      this.trimMetrics(this.systemMetrics);

      // Log high memory usage
      const memoryUsagePercent =
        (metric.memoryUsage.heapUsed / metric.memoryUsage.heapTotal) * 100;
      if (memoryUsagePercent > 80) {
        this.logger.warn(
          `High memory usage: ${memoryUsagePercent.toFixed(2)}%`,
          'MetricsService',
        );
      }
    }, 30000); // Collect every 30 seconds
  }

  /**
   * Trim metrics arrays to prevent memory leaks
   */
  private trimMetrics(metrics: any[]): void {
    if (metrics.length > this.maxMetrics) {
      metrics.splice(0, metrics.length - this.maxMetrics);
    }

    // Remove old metrics
    const cutoff = new Date(Date.now() - this.metricsRetentionMs);
    const index = metrics.findIndex((m) => m.timestamp >= cutoff);
    if (index > 0) {
      metrics.splice(0, index);
    }
  }
}
