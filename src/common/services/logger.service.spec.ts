import * as fs from 'fs';

import { Test, TestingModule } from '@nestjs/testing';
import * as winston from 'winston';

import { LoggerService } from './logger.service';

// Import modules for mocking

// Mock the entire winston module
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    log: jest.fn(),
  })),
  format: {
    combine: jest.fn(() => ({})),
    timestamp: jest.fn(() => ({})),
    errors: jest.fn(() => ({})),
    json: jest.fn(() => ({})),
    printf: jest.fn(() => ({})),
    colorize: jest.fn(() => ({})),
  },
  transports: {
    Console: jest.fn(() => ({})),
    File: jest.fn(() => ({})),
  },
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

// Create typed mocks
const mockWinston = winston as jest.Mocked<typeof winston>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('LoggerService', () => {
  let service: LoggerService;
  let mockWinstonLogger;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock logger instance
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      log: jest.fn(),
    };

    // Make createLogger return our mock logger
    mockWinston.createLogger.mockReturnValue(mockWinstonLogger);

    // Mock process.env
    process.env.LOG_LEVEL = 'info';
    process.env.NODE_ENV = 'test';
    process.env.npm_package_version = '1.0.0';

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
    delete process.env.npm_package_version;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create logs directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      // Create a new instance to test directory creation
      new LoggerService();

      expect(mockFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
      );
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
        { recursive: true },
      );
    });

    it('should not create logs directory if it already exists', () => {
      // Clear previous calls and set return value
      mockFs.mkdirSync.mockClear();
      mockFs.existsSync.mockReturnValue(true);

      // Create a new instance
      new LoggerService();

      expect(mockFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
      );
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should create winston logger with correct configuration', () => {
      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          defaultMeta: {
            service: 'contact-manager',
            environment: 'test',
            version: '1.0.0',
          },
        }),
      );
    });

    it('should use default log level when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL;

      new LoggerService();

      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        }),
      );
    });

    it('should use custom log level when LOG_LEVEL is set', () => {
      process.env.LOG_LEVEL = 'debug';

      new LoggerService();

      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
        }),
      );
    });

    it('should use default environment when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;

      new LoggerService();

      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultMeta: expect.objectContaining({
            environment: 'development',
          }),
        }),
      );
    });

    it('should use default version when npm_package_version is not set', () => {
      delete process.env.npm_package_version;

      new LoggerService();

      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultMeta: expect.objectContaining({
            version: '1.0.0',
          }),
        }),
      );
    });

    it('should create winston logger with transports', () => {
      new LoggerService();

      expect(mockWinston.transports.Console).toHaveBeenCalled();
      expect(mockWinston.transports.File).toHaveBeenCalled();
    });

    it('should create winston logger with format configuration', () => {
      new LoggerService();

      expect(mockWinston.format.combine).toHaveBeenCalled();
      expect(mockWinston.format.timestamp).toHaveBeenCalled();
      expect(mockWinston.format.errors).toHaveBeenCalled();
      expect(mockWinston.format.json).toHaveBeenCalled();
      expect(mockWinston.format.printf).toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should call winston logger info method with message', () => {
      const message = 'Test log message';

      service.log(message);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
        context: undefined,
        correlationId: undefined,
      });
    });

    it('should call winston logger info method with message and context', () => {
      const message = 'Test log message';
      const context = 'TestContext';

      service.log(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
        context,
        correlationId: undefined,
      });
    });

    it('should call winston logger info method with message, context, and correlationId', () => {
      const message = 'Test log message';
      const context = 'TestContext';
      const correlationId = 'test-correlation-id';

      service.log(message, context, correlationId);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
        context,
        correlationId,
      });
    });
  });

  describe('error', () => {
    it('should call winston logger error method with message', () => {
      const message = 'Test error message';

      service.error(message);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        trace: undefined,
        context: undefined,
        correlationId: undefined,
      });
    });

    it('should call winston logger error method with all parameters', () => {
      const message = 'Test error message';
      const trace = 'Error stack trace';
      const context = 'TestContext';
      const correlationId = 'test-correlation-id';

      service.error(message, trace, context, correlationId);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        trace,
        context,
        correlationId,
      });
    });
  });

  describe('warn', () => {
    it('should call winston logger warn method with message', () => {
      const message = 'Test warning message';

      service.warn(message);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, {
        context: undefined,
        correlationId: undefined,
      });
    });

    it('should call winston logger warn method with all parameters', () => {
      const message = 'Test warning message';
      const context = 'TestContext';
      const correlationId = 'test-correlation-id';

      service.warn(message, context, correlationId);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, {
        context,
        correlationId,
      });
    });
  });

  describe('debug', () => {
    it('should call winston logger debug method with message', () => {
      const message = 'Test debug message';

      service.debug(message);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, {
        context: undefined,
        correlationId: undefined,
      });
    });

    it('should call winston logger debug method with all parameters', () => {
      const message = 'Test debug message';
      const context = 'TestContext';
      const correlationId = 'test-correlation-id';

      service.debug(message, context, correlationId);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, {
        context,
        correlationId,
      });
    });
  });

  describe('verbose', () => {
    it('should call winston logger verbose method with message', () => {
      const message = 'Test verbose message';

      service.verbose(message);

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(message, {
        context: undefined,
        correlationId: undefined,
      });
    });

    it('should call winston logger verbose method with all parameters', () => {
      const message = 'Test verbose message';
      const context = 'TestContext';
      const correlationId = 'test-correlation-id';

      service.verbose(message, context, correlationId);

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(message, {
        context,
        correlationId,
      });
    });
  });

  describe('fatal', () => {
    it('should call winston logger error method with fatal level', () => {
      const message = 'Test fatal message';

      service.fatal(message);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        context: undefined,
        correlationId: undefined,
        level: 'fatal',
      });
    });

    it('should call winston logger error method with all parameters and fatal level', () => {
      const message = 'Test fatal message';
      const context = 'TestContext';
      const correlationId = 'test-correlation-id';

      service.fatal(message, context, correlationId);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        context,
        correlationId,
        level: 'fatal',
      });
    });
  });

  describe('logStructured', () => {
    it('should call winston logger log method with level and message', () => {
      const level = 'info';
      const message = 'Test structured message';

      service.logStructured(level, message);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(level, message, {});
    });

    it('should call winston logger log method with level, message, and metadata', () => {
      const level = 'warn';
      const message = 'Test structured message';
      const metadata = { key: 'value', count: 42 };

      service.logStructured(level, message, metadata);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        level,
        message,
        metadata,
      );
    });
  });

  describe('logPerformance', () => {
    it('should call winston logger info method with performance message', () => {
      const operation = 'database-query';
      const duration = 150;

      service.logPerformance(operation, duration);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Performance: database-query completed in 150ms',
        {
          context: 'Performance',
          operation,
          duration,
        },
      );
    });

    it('should call winston logger info method with performance message and metadata', () => {
      const operation = 'api-call';
      const duration = 250;
      const metadata = { endpoint: '/api/users', method: 'GET' };

      service.logPerformance(operation, duration, metadata);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Performance: api-call completed in 250ms',
        {
          context: 'Performance',
          operation,
          duration,
          endpoint: '/api/users',
          method: 'GET',
        },
      );
    });
  });

  describe('logSecurity', () => {
    it('should call winston logger warn method with security event', () => {
      const event = 'failed-login-attempt';

      service.logSecurity(event);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Security Event: failed-login-attempt',
        {
          context: 'Security',
          event,
        },
      );
    });

    it('should call winston logger warn method with security event and details', () => {
      const event = 'unauthorized-access';
      const details = { ip: '192.168.1.1', userId: 123, resource: '/admin' };

      service.logSecurity(event, details);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Security Event: unauthorized-access',
        {
          context: 'Security',
          event,
          ip: '192.168.1.1',
          userId: 123,
          resource: '/admin',
        },
      );
    });
  });

  describe('logBusiness', () => {
    it('should call winston logger info method with business event', () => {
      const event = 'user-registration';

      service.logBusiness(event);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Business Event: user-registration',
        {
          context: 'Business',
          event,
        },
      );
    });

    it('should call winston logger info method with business event and details', () => {
      const event = 'order-completed';
      const details = { orderId: 'ORD-123', amount: 99.99, currency: 'USD' };

      service.logBusiness(event, details);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Business Event: order-completed',
        {
          context: 'Business',
          event,
          orderId: 'ORD-123',
          amount: 99.99,
          currency: 'USD',
        },
      );
    });
  });
});
