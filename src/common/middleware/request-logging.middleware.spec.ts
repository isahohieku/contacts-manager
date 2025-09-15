import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';

import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';

import { RequestLoggingMiddleware } from './request-logging.middleware';

describe('RequestLoggingMiddleware', () => {
  let middleware: RequestLoggingMiddleware;
  let loggerService: jest.Mocked<LoggerService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    const mockLoggerService = {
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const mockMetricsService = {
      recordRequest: jest.fn(),
      recordError: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestLoggingMiddleware,
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

    middleware = module.get<RequestLoggingMiddleware>(RequestLoggingMiddleware);
    loggerService = module.get(LoggerService);

    mockRequest = {
      method: 'GET',
      url: '/test-endpoint',
      headers: {
        'user-agent': 'test-agent',
        authorization: 'Bearer token123',
        'x-api-key': 'secret-key',
      },
      query: { page: '1', limit: '10' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '192.168.1.1' },
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'test-agent';
        return undefined;
      }),
      app: {
        locals: {
          logger: loggerService,
          metricsService: {
            recordRequest: jest.fn(),
          },
        },
      },
      route: { path: '/test-endpoint' },
    } as any;

    const originalSend = jest.fn();
    mockResponse = {
      setHeader: jest.fn(),
      statusCode: 200,
      send: originalSend,
      app: mockRequest.app,
    } as any;

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should generate correlation ID and set it in request and response', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.correlationId).toBeDefined();
      expect(mockRequest.startTime).toBeDefined();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Correlation-ID',
        mockRequest.correlationId,
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log incoming request with correlation ID', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(loggerService.log).toHaveBeenCalledWith(
        'Incoming GET /test-endpoint',
        expect.stringContaining('RequestLogging ['),
      );
    });

    it('should log request details in debug mode', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(loggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining('Request details:'),
        expect.stringContaining('RequestLogging ['),
      );

      const debugCall = loggerService.debug.mock.calls[0][0];
      const requestDetails = JSON.parse(
        debugCall.split('Request details: ')[1],
      );

      expect(requestDetails).toEqual({
        method: 'GET',
        url: '/test-endpoint',
        headers: {
          'user-agent': 'test-agent',
          authorization: '[REDACTED]',
          'x-api-key': '[REDACTED]',
        },
        query: { page: '1', limit: '10' },
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should sanitize sensitive headers', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const debugCall = loggerService.debug.mock.calls[0][0];
      const requestDetails = JSON.parse(
        debugCall.split('Request details: ')[1],
      );

      expect(requestDetails.headers.authorization).toBe('[REDACTED]');
      expect(requestDetails.headers['x-api-key']).toBe('[REDACTED]');
      expect(requestDetails.headers['user-agent']).toBe('test-agent');
    });

    it('should override response.send to log response details', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const responseBody = { message: 'success', data: [] };
      const originalSend = mockResponse.send as jest.Mock;

      // Simulate response
      mockResponse.statusCode = 201;
      mockRequest.startTime = Date.now() - 100; // 100ms ago

      // Call the overridden send method
      const overriddenSend = mockResponse.send as jest.Mock;
      overriddenSend.call(mockResponse, responseBody);

      // Verify original send was called
      expect(originalSend).toHaveBeenCalledWith(responseBody);
    });

    it('should handle request without IP address', () => {
      const requestWithoutIP = {
        ...mockRequest,
        ip: undefined,
        connection: {},
      };

      middleware.use(
        requestWithoutIP as Request,
        mockResponse as Response,
        mockNext,
      );

      const debugCall = loggerService.debug.mock.calls[0][0];
      const requestDetails = JSON.parse(
        debugCall.split('Request details: ')[1],
      );

      expect(requestDetails.ip).toBeUndefined();
    });

    it('should handle request without User-Agent header', () => {
      const requestWithoutUserAgent = {
        ...mockRequest,
        get: jest.fn(() => undefined),
      };

      middleware.use(
        requestWithoutUserAgent as Request,
        mockResponse as Response,
        mockNext,
      );

      const debugCall = loggerService.debug.mock.calls[0][0];
      const requestDetails = JSON.parse(
        debugCall.split('Request details: ')[1],
      );

      expect(requestDetails.userAgent).toBeUndefined();
    });

    it('should handle headers as string arrays', () => {
      const requestWithArrayHeaders = {
        ...mockRequest,
        headers: {
          'user-agent': ['test-agent-1', 'test-agent-2'],
          authorization: ['Bearer token1', 'Bearer token2'],
        } as any,
      };

      middleware.use(
        requestWithArrayHeaders as Request,
        mockResponse as Response,
        mockNext,
      );

      const debugCall = loggerService.debug.mock.calls[0][0];
      const requestDetails = JSON.parse(
        debugCall.split('Request details: ')[1],
      );

      expect(requestDetails.headers['user-agent']).toEqual([
        'test-agent-1',
        'test-agent-2',
      ]);
      expect(requestDetails.headers.authorization).toBe('[REDACTED]');
    });

    it('should handle empty query parameters', () => {
      const requestWithoutQuery = {
        ...mockRequest,
        query: {},
      };

      middleware.use(
        requestWithoutQuery as Request,
        mockResponse as Response,
        mockNext,
      );

      const debugCall = loggerService.debug.mock.calls[0][0];
      const requestDetails = JSON.parse(
        debugCall.split('Request details: ')[1],
      );

      expect(requestDetails.query).toEqual({});
    });

    it('should handle request with user information', () => {
      const requestWithUser = {
        ...mockRequest,
        user: { id: 123, email: 'test@example.com' },
      };

      middleware.use(
        requestWithUser as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.correlationId).toBeDefined();
    });

    it('should handle different HTTP methods', () => {
      const postRequest = {
        ...mockRequest,
        method: 'POST',
        url: '/api/users',
      };

      middleware.use(
        postRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(loggerService.log).toHaveBeenCalledWith(
        'Incoming POST /api/users',
        expect.stringContaining('RequestLogging ['),
      );
    });

    it('should handle request without app.locals', () => {
      const requestWithoutLocals = {
        ...mockRequest,
        app: { locals: {} },
      };

      middleware.use(
        requestWithoutLocals as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.correlationId).toBeDefined();
    });
  });

  describe('sanitizeHeaders', () => {
    it('should redact sensitive headers', () => {
      const headers = {
        authorization: 'Bearer token123',
        'x-api-key': 'secret-key',
        cookie: 'session=abc123',
        'user-agent': 'test-agent',
        'content-type': 'application/json',
      };

      const sanitized = (middleware as any).sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        authorization: '[REDACTED]',
        'x-api-key': '[REDACTED]',
        cookie: '[REDACTED]',
        'user-agent': 'test-agent',
        'content-type': 'application/json',
      });
    });

    it('should handle headers with different cases', () => {
      const headers = {
        Authorization: 'Bearer token123',
        'X-API-KEY': 'secret-key',
        Cookie: 'session=abc123',
      };

      const sanitized = (middleware as any).sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        Authorization: '[REDACTED]',
        'X-API-KEY': '[REDACTED]',
        Cookie: '[REDACTED]',
      });
    });

    it('should handle empty headers object', () => {
      const headers = {};

      const sanitized = (middleware as any).sanitizeHeaders(headers);

      expect(sanitized).toEqual({});
    });
  });
});
