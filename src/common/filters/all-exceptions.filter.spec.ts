import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';

import { AllExceptionsFilter } from './all-exceptions.filter';

// Extend Express Request interface to include correlation ID (same as in middleware)
declare module 'express-serve-static-core' {
  interface Request {
    correlationId?: string;
    startTime?: number;
  }
}

// Define extended request interface for testing
interface ExtendedRequest extends Request {
  correlationId?: string;
  user?: { id: number };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let loggerService: jest.Mocked<LoggerService>;
  let metricsService: jest.Mocked<MetricsService>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockRequest: Partial<ExtendedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const mockLoggerService = {
      error: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    };

    const mockMetricsService = {
      recordError: jest.fn(),
      recordRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    loggerService = module.get(LoggerService);
    metricsService = module.get(MetricsService);

    // Mock request and response objects
    mockRequest = {
      url: '/test-url',
      method: 'GET',
      correlationId: 'test-correlation-id',
      user: { id: 123 },
    } as Partial<ExtendedRequest>;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    // Mock ArgumentsHost
    const mockHttpContext = {
      getResponse: jest.fn().mockReturnValue(mockResponse as Response),
      getRequest: jest.fn().mockReturnValue(mockRequest as ExtendedRequest),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
    } as unknown as jest.Mocked<ArgumentsHost>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException correctly', () => {
      const httpException = new HttpException(
        'Test error message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(httpException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test-url',
        method: 'GET',
        message: 'Test error message',
      });

      expect(loggerService.error).toHaveBeenCalledWith(
        'GET /test-url',
        httpException.stack,
        'AllExceptionsFilter',
        'test-correlation-id',
      );

      expect(metricsService.recordError).toHaveBeenCalledWith({
        error: 'Test error message',
        stack: httpException.stack,
        path: '/test-url',
        method: 'GET',
        timestamp: expect.any(Date),
        userId: 123,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should handle HttpException with object response', () => {
      const errorResponse = {
        message: 'Validation failed',
        errors: ['field1', 'field2'],
      };
      const httpException = new HttpException(
        errorResponse,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(httpException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        timestamp: expect.any(String),
        path: '/test-url',
        method: 'GET',
        message: 'Validation failed',
      });
    });

    it('should handle non-HttpException errors', () => {
      const genericError = new Error('Generic error message');

      filter.catch(genericError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test-url',
        method: 'GET',
        message: 'Internal server error',
      });

      expect(loggerService.error).toHaveBeenCalledWith(
        'GET /test-url',
        genericError.stack,
        'AllExceptionsFilter',
        'test-correlation-id',
      );

      expect(metricsService.recordError).toHaveBeenCalledWith({
        error: 'Generic error message',
        stack: genericError.stack,
        path: '/test-url',
        method: 'GET',
        timestamp: expect.any(Date),
        userId: 123,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle non-Error exceptions', () => {
      const stringException = 'String error';

      filter.catch(stringException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test-url',
        method: 'GET',
        message: 'Internal server error',
      });

      expect(loggerService.error).toHaveBeenCalledWith(
        'GET /test-url',
        'String error',
        'AllExceptionsFilter',
        'test-correlation-id',
      );

      expect(metricsService.recordError).toHaveBeenCalledWith({
        error: 'String error',
        stack: undefined,
        path: '/test-url',
        method: 'GET',
        timestamp: expect.any(Date),
        userId: 123,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle request without user', () => {
      const requestWithoutUser = {
        url: '/test-url',
        method: 'POST',
        correlationId: 'test-correlation-id',
      } as Partial<ExtendedRequest>;

      const httpContext = mockArgumentsHost.switchToHttp();
      (httpContext.getRequest as jest.Mock).mockReturnValue(requestWithoutUser);

      const httpException = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(httpException, mockArgumentsHost);

      expect(metricsService.recordError).toHaveBeenCalledWith({
        error: 'Unauthorized',
        stack: httpException.stack,
        path: '/test-url',
        method: 'POST',
        timestamp: expect.any(Date),
        userId: undefined,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should handle HttpException with complex object response', () => {
      const complexResponse = {
        message: 'Complex error',
        details: { field: 'value' },
        code: 'ERR_001',
      };
      const httpException = new HttpException(
        complexResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(httpException, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test-url',
        method: 'GET',
        message: 'Complex error',
      });
    });

    it('should handle request without correlationId', () => {
      const requestWithoutCorrelationId = {
        url: '/test-url',
        method: 'GET',
        user: { id: 123 },
      } as Partial<ExtendedRequest>;

      const httpContext2 = mockArgumentsHost.switchToHttp();
      (httpContext2.getRequest as jest.Mock).mockReturnValue(
        requestWithoutCorrelationId,
      );

      const httpException = new HttpException(
        'Test error',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(httpException, mockArgumentsHost);

      expect(loggerService.error).toHaveBeenCalledWith(
        'GET /test-url',
        httpException.stack,
        'AllExceptionsFilter',
        undefined,
      );
    });
  });
});
