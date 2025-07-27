import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { LoggerService } from '../../common/services/logger.service';
import { MetricsService } from '../../common/services/metrics.service';

@ApiTags('Monitoring')
@Controller('monitoring')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MonitoringController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: LoggerService,
  ) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Get application metrics',
    description:
      'Returns comprehensive application metrics including requests, errors, cache, database, and system metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Application metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        requests: {
          type: 'object',
          properties: {
            totalRequests: { type: 'number' },
            averageResponseTime: { type: 'number' },
            errorRate: { type: 'number' },
            statusCodes: { type: 'object' },
            timeRange: { type: 'string' },
          },
        },
        errors: {
          type: 'object',
          properties: {
            totalErrors: { type: 'number' },
            errorsByType: { type: 'object' },
            errorsByPath: { type: 'object' },
            timeRange: { type: 'string' },
          },
        },
        cache: {
          type: 'object',
          properties: {
            hitRate: { type: 'number' },
            totalOperations: { type: 'number' },
            operationCounts: { type: 'object' },
            timeRange: { type: 'string' },
          },
        },
        database: {
          type: 'object',
          properties: {
            totalQueries: { type: 'number' },
            averageQueryTime: { type: 'number' },
            slowQueries: { type: 'number' },
            errorQueries: { type: 'number' },
            timeRange: { type: 'string' },
          },
        },
        system: {
          type: 'object',
          properties: {
            cpuUsage: { type: 'number' },
            memoryUsage: { type: 'object' },
            uptime: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMetrics() {
    this.logger.log('Metrics endpoint accessed', 'MonitoringController');
    return this.metricsService.getDashboardMetrics();
  }

  @Get('metrics/requests')
  @ApiOperation({
    summary: 'Get request metrics',
    description:
      'Returns detailed HTTP request metrics for the specified time range',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: 'Time range in milliseconds (default: 60000 = 1 minute)',
    example: 300000,
  })
  @ApiResponse({
    status: 200,
    description: 'Request metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRequests: { type: 'number', example: 150 },
        averageResponseTime: { type: 'number', example: 245 },
        errorRate: { type: 'number', example: 2.5 },
        statusCodes: {
          type: 'object',
          example: { '200': 140, '404': 5, '500': 5 },
        },
        timeRange: { type: 'string', example: '300s' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRequestMetrics(@Query('timeRange') timeRange?: string) {
    const timeRangeMs = timeRange ? parseInt(timeRange, 10) : 60000;
    this.logger.log(
      `Request metrics accessed for ${timeRangeMs}ms range`,
      'MonitoringController',
    );
    return this.metricsService.getRequestMetrics(timeRangeMs);
  }

  @Get('metrics/errors')
  @ApiOperation({
    summary: 'Get error metrics',
    description: 'Returns detailed error metrics for the specified time range',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: 'Time range in milliseconds (default: 60000 = 1 minute)',
    example: 300000,
  })
  @ApiResponse({
    status: 200,
    description: 'Error metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalErrors: { type: 'number', example: 12 },
        errorsByType: {
          type: 'object',
          example: { ValidationError: 8, DatabaseError: 3, AuthError: 1 },
        },
        errorsByPath: {
          type: 'object',
          example: { '/api/v1/contacts': 5, '/api/v1/auth/login': 3 },
        },
        timeRange: { type: 'string', example: '300s' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getErrorMetrics(@Query('timeRange') timeRange?: string) {
    const timeRangeMs = timeRange ? parseInt(timeRange, 10) : 60000;
    this.logger.log(
      `Error metrics accessed for ${timeRangeMs}ms range`,
      'MonitoringController',
    );
    return this.metricsService.getErrorMetrics(timeRangeMs);
  }

  @Get('metrics/cache')
  @ApiOperation({
    summary: 'Get cache metrics',
    description:
      'Returns detailed cache performance metrics for the specified time range',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: 'Time range in milliseconds (default: 60000 = 1 minute)',
    example: 300000,
  })
  @ApiResponse({
    status: 200,
    description: 'Cache metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hitRate: { type: 'number', example: 85.5 },
        totalOperations: { type: 'number', example: 200 },
        operationCounts: {
          type: 'object',
          example: { hit: 171, miss: 29, set: 25, delete: 5 },
        },
        timeRange: { type: 'string', example: '300s' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCacheMetrics(@Query('timeRange') timeRange?: string) {
    const timeRangeMs = timeRange ? parseInt(timeRange, 10) : 60000;
    this.logger.log(
      `Cache metrics accessed for ${timeRangeMs}ms range`,
      'MonitoringController',
    );
    return this.metricsService.getCacheMetrics(timeRangeMs);
  }

  @Get('metrics/database')
  @ApiOperation({
    summary: 'Get database metrics',
    description:
      'Returns detailed database performance metrics for the specified time range',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: 'Time range in milliseconds (default: 60000 = 1 minute)',
    example: 300000,
  })
  @ApiResponse({
    status: 200,
    description: 'Database metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalQueries: { type: 'number', example: 45 },
        averageQueryTime: { type: 'number', example: 125 },
        slowQueries: { type: 'number', example: 2 },
        errorQueries: { type: 'number', example: 0 },
        timeRange: { type: 'string', example: '300s' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDatabaseMetrics(@Query('timeRange') timeRange?: string) {
    const timeRangeMs = timeRange ? parseInt(timeRange, 10) : 60000;
    this.logger.log(
      `Database metrics accessed for ${timeRangeMs}ms range`,
      'MonitoringController',
    );
    return this.metricsService.getDatabaseMetrics(timeRangeMs);
  }

  @Get('metrics/system')
  @ApiOperation({
    summary: 'Get system metrics',
    description:
      'Returns current system performance metrics including CPU, memory, and uptime',
  })
  @ApiResponse({
    status: 200,
    description: 'System metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        cpuUsage: { type: 'number', example: 15.5 },
        memoryUsage: {
          type: 'object',
          properties: {
            heapUsed: { type: 'number', example: 45678912 },
            heapTotal: { type: 'number', example: 67108864 },
            external: { type: 'number', example: 1234567 },
            rss: { type: 'number', example: 89012345 },
          },
        },
        uptime: { type: 'number', example: 3600.5 },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSystemMetrics() {
    this.logger.log('System metrics accessed', 'MonitoringController');
    return this.metricsService.getCurrentSystemMetrics();
  }
}
