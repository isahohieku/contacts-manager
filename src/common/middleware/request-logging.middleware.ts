import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';

// Extend Express Request interface to include correlation ID
declare module 'express-serve-static-core' {
  interface Request {
    correlationId?: string;
    startTime?: number;
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate correlation ID for request tracking
    const correlationId = uuidv4();
    req.correlationId = correlationId;
    req.startTime = Date.now();

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);

    // Log incoming request
    this.logger.log(
      `Incoming ${req.method} ${req.url}`,
      `RequestLogging [${correlationId}]`,
    );

    // Log request details in debug mode
    this.logger.debug(
      `Request details: ${JSON.stringify({
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(
          req.headers as unknown as Record<string, string | string[]>,
        ),
        query: req.query,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      })}`,
      `RequestLogging [${correlationId}]`,
    );

    // Capture response when it finishes
    const originalSend = res.send;
    res.send = function (body: {
      message: string;
      error?: string;
      errors?: Record<string, { message: string }>;
    }): Response<unknown, Record<string, unknown>> {
      const responseTime = Date.now() - (req.startTime || Date.now());
      const statusCode = res.statusCode;

      // Log response using injected logger service
      const logLevel = statusCode >= 400 ? 'warn' : 'log';

      // Use the injected logger service from the middleware constructor
      const loggerInstance = req.app.locals.logger || console;
      if (loggerInstance.log) {
        loggerInstance[logLevel](
          `${req.method} ${req.url} ${statusCode} - ${responseTime}ms`,
          `RequestLogging [${correlationId}]`,
        );
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.url} ${statusCode} - ${responseTime}ms [${correlationId}]`,
        );
      }

      // Record metrics using injected metrics service
      const metricsInstance = req.app.locals.metricsService;
      if (metricsInstance?.recordRequest) {
        metricsInstance.recordRequest({
          method: req.method,
          path: req.route?.path || req.url,
          statusCode,
          responseTime,
          timestamp: new Date(),
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress,
          userId: (req as { user?: { id: number } }).user?.id,
        });
      }

      // Log response body in debug mode (truncated)
      if (loggerInstance?.debug) {
        loggerInstance.debug(
          `Response body: ${JSON.stringify(body)?.substring(0, 500)}${
            JSON.stringify(body)?.length > 500 ? '...' : ''
          }`,
          `RequestLogging [${correlationId}]`,
        );
      }

      return originalSend.call(this, body);
    };

    next();
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(
    headers: Record<string, string | string[]>,
  ): Record<string, unknown> {
    const sanitized = { ...headers };

    // Remove sensitive headers (case-insensitive)
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    sensitiveHeaders.forEach((sensitiveHeader) => {
      // Find header with case-insensitive matching
      const headerKey = Object.keys(sanitized).find(
        (key) => key.toLowerCase() === sensitiveHeader.toLowerCase(),
      );

      if (headerKey && sanitized[headerKey]) {
        sanitized[headerKey] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
