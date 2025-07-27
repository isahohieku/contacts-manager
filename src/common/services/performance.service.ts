import { Injectable } from '@nestjs/common';

import { LoggerService } from './logger.service';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  constructor(private readonly logger: LoggerService) {}

  /**
   * Measures the execution time of an async operation
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const startTime = process.hrtime.bigint();

    try {
      const result = await fn();
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      this.recordMetric(operation, duration, metadata);

      // Log slow operations
      if (duration > 1000) {
        // Log operations taking more than 1 second
        this.logger.warn(
          `Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`,
        );
      }

      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000;

      this.recordMetric(`${operation}_error`, duration, {
        ...metadata,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Measures the execution time of a sync operation
   */
  measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): T {
    const startTime = process.hrtime.bigint();

    try {
      const result = fn();
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000;

      this.recordMetric(operation, duration, metadata);
      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000;

      this.recordMetric(`${operation}_error`, duration, {
        ...metadata,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Records a performance metric
   */
  private recordMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance info
    this.logger.debug(
      `Performance: ${operation} completed in ${duration.toFixed(2)}ms`,
    );
  }

  /**
   * Gets performance statistics for an operation
   */
  getOperationStats(operation: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    recentMetrics: PerformanceMetric[];
  } {
    const operationMetrics = this.metrics.filter(
      (m) => m.operation === operation,
    );

    if (operationMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        recentMetrics: [],
      };
    }

    const durations = operationMetrics.map((m) => m.duration);

    return {
      count: operationMetrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      recentMetrics: operationMetrics.slice(-10), // Last 10 metrics
    };
  }

  /**
   * Gets overall performance summary
   */
  getPerformanceSummary(): Record<string, any> {
    const operations = [...new Set(this.metrics.map((m) => m.operation))];
    const summary: Record<string, any> = {};

    operations.forEach((operation) => {
      summary[operation] = this.getOperationStats(operation);
    });

    return summary;
  }

  /**
   * Clears all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}
