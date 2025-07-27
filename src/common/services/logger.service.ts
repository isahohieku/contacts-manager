import * as fs from 'fs';
import * as path from 'path';

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(
          ({ timestamp, level, message, context, correlationId, ...meta }) => {
            const logEntry: any = {
              timestamp,
              level,
              message,
              service: 'contact-manager',
              ...meta,
            };

            if (context) {
              logEntry.context = context;
            }

            if (correlationId) {
              logEntry.correlationId = correlationId;
            }

            return JSON.stringify(logEntry);
          },
        ),
      ),
      defaultMeta: {
        service: 'contact-manager',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, correlationId }) => {
                const contextStr = context ? `[${context}]` : '';
                const correlationStr = correlationId
                  ? `[${correlationId}]`
                  : '';
                return `${timestamp} ${level}: ${contextStr}${correlationStr} ${message}`;
              },
            ),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.json(),
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.json(),
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
        new winston.transports.File({
          filename: 'logs/access.log',
          level: 'info',
          format: winston.format.json(),
          maxsize: 10485760, // 10MB
          maxFiles: 7,
        }),
      ],
    });
  }

  log(message: string, context?: string, correlationId?: string) {
    this.logger.info(message, { context, correlationId });
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    correlationId?: string,
  ) {
    this.logger.error(message, { trace, context, correlationId });
  }

  warn(message: string, context?: string, correlationId?: string) {
    this.logger.warn(message, { context, correlationId });
  }

  debug(message: string, context?: string, correlationId?: string) {
    this.logger.debug(message, { context, correlationId });
  }

  verbose(message: string, context?: string, correlationId?: string) {
    this.logger.verbose(message, { context, correlationId });
  }

  fatal(message: string, context?: string, correlationId?: string) {
    this.logger.error(message, { context, correlationId, level: 'fatal' });
  }

  /**
   * Log structured data with additional metadata
   */
  logStructured(
    level: string,
    message: string,
    metadata: Record<string, any> = {},
  ) {
    this.logger.log(level, message, metadata);
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    operation: string,
    duration: number,
    metadata: Record<string, any> = {},
  ) {
    this.logger.info(`Performance: ${operation} completed in ${duration}ms`, {
      context: 'Performance',
      operation,
      duration,
      ...metadata,
    });
  }

  /**
   * Log security events
   */
  logSecurity(event: string, details: Record<string, any> = {}) {
    this.logger.warn(`Security Event: ${event}`, {
      context: 'Security',
      event,
      ...details,
    });
  }

  /**
   * Log business events
   */
  logBusiness(event: string, details: Record<string, any> = {}) {
    this.logger.info(`Business Event: ${event}`, {
      context: 'Business',
      event,
      ...details,
    });
  }
}
