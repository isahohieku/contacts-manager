import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

import { SerializerInterceptor } from './serializer.interceptor';

// Mock the external dependencies
jest.mock('@contactApp/modules/users/user-response.serializer', () =>
  jest.fn(),
);
jest.mock('@contactApp/shared/utils/deep-map-object', () => jest.fn());

describe('SerializerInterceptor', () => {
  let interceptor: SerializerInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerializerInterceptor],
    }).compile();

    interceptor = module.get<SerializerInterceptor>(SerializerInterceptor);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;

    beforeEach(() => {
      mockExecutionContext = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
        switchToHttp: jest.fn(),
      } as ExecutionContext;

      mockCallHandler = {
        handle: jest.fn(),
      } as CallHandler;
    });

    it('should process data through deepMapObject', (done) => {
      const testData = {
        id: 1,
        name: 'Test User',
        __entity: 'User',
      };

      const processedData = {
        id: 1,
        name: 'Test User',
        // Serialized data
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      // Mock deepMapObject to call the mapper function and return processed data
      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');
      deepMapObject.mockImplementation((data, mapperFn) => {
        mapperFn(data); // Call the mapper function
        return processedData;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(processedData);
        expect(deepMapObject).toHaveBeenCalledWith(
          testData,
          expect.any(Function),
        );
        done();
      });
    });

    it('should call userResponseSerializer for User entities', (done) => {
      const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        __entity: 'User',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(userData));

      const userResponseSerializer = require('@contactApp/modules/users/user-response.serializer');
      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');

      // Mock deepMapObject to call the mapper function with the user data
      deepMapObject.mockImplementation((data, mapperFn) => {
        mapperFn(data);
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        expect(userResponseSerializer).toHaveBeenCalledWith(userData);
        done();
      });
    });

    it('should not call userResponseSerializer for non-User entities', (done) => {
      const contactData = {
        id: 1,
        name: 'John Doe',
        __entity: 'Contact',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(contactData));

      const userResponseSerializer = require('@contactApp/modules/users/user-response.serializer');
      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');

      // Mock deepMapObject to call the mapper function with the contact data
      deepMapObject.mockImplementation((data, mapperFn) => {
        mapperFn(data);
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        expect(userResponseSerializer).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle data without __entity property', (done) => {
      const plainData = {
        id: 1,
        name: 'Plain Object',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(plainData));

      const userResponseSerializer = require('@contactApp/modules/users/user-response.serializer');
      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');

      // Mock deepMapObject to call the mapper function with the plain data
      deepMapObject.mockImplementation((data, mapperFn) => {
        mapperFn(data);
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        expect(userResponseSerializer).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle null data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');
      deepMapObject.mockImplementation((data, mapperFn) => {
        if (data !== null) {
          mapperFn(data);
        }
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBeNull();
        expect(deepMapObject).toHaveBeenCalledWith(null, expect.any(Function));
        done();
      });
    });

    it('should handle undefined data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');
      deepMapObject.mockImplementation((data, mapperFn) => {
        if (data !== undefined) {
          mapperFn(data);
        }
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBeUndefined();
        expect(deepMapObject).toHaveBeenCalledWith(
          undefined,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle array data with mixed entities', (done) => {
      const arrayData = [
        { id: 1, name: 'User 1', __entity: 'User' },
        { id: 2, name: 'Contact 1', __entity: 'Contact' },
        { id: 3, name: 'User 2', __entity: 'User' },
      ];

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(arrayData));

      const userResponseSerializer = require('@contactApp/modules/users/user-response.serializer');
      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');

      // Mock deepMapObject to call the mapper function for each item
      deepMapObject.mockImplementation((data, mapperFn) => {
        if (Array.isArray(data)) {
          data.forEach((item) => mapperFn(item));
        } else {
          mapperFn(data);
        }
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        // Should be called twice for the two User entities
        expect(userResponseSerializer).toHaveBeenCalledTimes(2);
        expect(userResponseSerializer).toHaveBeenCalledWith(arrayData[0]);
        expect(userResponseSerializer).toHaveBeenCalledWith(arrayData[2]);
        done();
      });
    });

    it('should handle nested object data with User entities', (done) => {
      const nestedData = {
        user: { id: 1, name: 'User 1', __entity: 'User' },
        contact: { id: 2, name: 'Contact 1', __entity: 'Contact' },
        metadata: {
          creator: { id: 3, name: 'Creator', __entity: 'User' },
        },
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(nestedData));

      const userResponseSerializer = require('@contactApp/modules/users/user-response.serializer');
      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');

      // Mock deepMapObject to recursively call the mapper function
      deepMapObject.mockImplementation((data, mapperFn) => {
        const processObject = (obj) => {
          if (obj && typeof obj === 'object') {
            if (Array.isArray(obj)) {
              obj.forEach((item) => processObject(item));
            } else {
              mapperFn(obj);
              Object.values(obj).forEach((value) => processObject(value));
            }
          }
        };
        processObject(data);
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        // Should be called for both User entities
        expect(userResponseSerializer).toHaveBeenCalledTimes(2);
        done();
      });
    });

    it('should return the value from mapper function', (done) => {
      const testData = {
        id: 1,
        name: 'Test',
        __entity: 'User',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');

      // Mock deepMapObject to simulate the mapper function returning the value
      deepMapObject.mockImplementation((data, mapperFn) => {
        const result = mapperFn(data);
        return result || data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(deepMapObject).toHaveBeenCalledWith(
          testData,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle string data', (done) => {
      const stringData = 'Simple string response';

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(stringData));

      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');
      deepMapObject.mockImplementation((data, mapperFn) => {
        // For primitive types, just return the data
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(stringData);
        expect(deepMapObject).toHaveBeenCalledWith(
          stringData,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle number data', (done) => {
      const numberData = 42;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(numberData));

      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');
      deepMapObject.mockImplementation((data, mapperFn) => {
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(numberData);
        expect(deepMapObject).toHaveBeenCalledWith(
          numberData,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle boolean data', (done) => {
      const booleanData = true;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(booleanData));

      const deepMapObject = require('@contactApp/shared/utils/deep-map-object');
      deepMapObject.mockImplementation((data, mapperFn) => {
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(booleanData);
        expect(deepMapObject).toHaveBeenCalledWith(
          booleanData,
          expect.any(Function),
        );
        done();
      });
    });
  });
});
