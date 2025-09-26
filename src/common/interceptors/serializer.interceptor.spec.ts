import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

// Mock the external dependencies before importing
jest.mock('@contactApp/modules/users/user-response.serializer', () =>
  jest.fn(),
);
jest.mock('@contactApp/shared/utils/deep-map-object', () => jest.fn());

// Import the mocked functions
import userResponseSerializer from '@contactApp/modules/users/user-response.serializer';
import deepMapObject from '@contactApp/shared/utils/deep-map-object';

import { SerializerInterceptor } from './serializer.interceptor';

// Create typed references to the mocked functions
const mockUserResponseSerializer =
  userResponseSerializer as jest.MockedFunction<typeof userResponseSerializer>;
const mockDeepMapObject = deepMapObject as jest.MockedFunction<
  typeof deepMapObject
>;

// Define proper types for the entities
interface EntityWithType {
  __entity: string;
  [key: string]: unknown;
}

interface UserEntity extends EntityWithType {
  id: number;
  name: string;
  email?: string;
  __entity: 'User';
}

interface ContactEntity extends EntityWithType {
  id: number;
  name: string;
  __entity: 'Contact';
}

type EntityData = UserEntity | ContactEntity | EntityWithType;
type SerializableData =
  | EntityData
  | EntityData[]
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>;

// Define mapper function type based on actual implementation
type MapperFunction = (value: unknown, key: string | number) => void;

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
      const testData: UserEntity = {
        id: 1,
        name: 'Test User',
        __entity: 'User',
      };

      const processedData: UserEntity = {
        id: 1,
        name: 'Test User',
        __entity: 'User',
        // Serialized data
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      // Mock deepMapObject to call the mapper function and return processed data
      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          mapperFn(data, 'root'); // Call the mapper function
          return processedData;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(processedData);
        expect(mockDeepMapObject).toHaveBeenCalledWith(
          testData,
          expect.any(Function),
        );
        done();
      });
    });

    it('should call userResponseSerializer for User entities', (done) => {
      const userData: UserEntity = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        __entity: 'User',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(userData));

      // Mock deepMapObject to call the mapper function with the user data
      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          mapperFn(data, 'root');
          return data;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        expect(mockUserResponseSerializer).toHaveBeenCalledWith(userData);
        done();
      });
    });

    it('should not call userResponseSerializer for non-User entities', (done) => {
      const contactData: ContactEntity = {
        id: 1,
        name: 'John Doe',
        __entity: 'Contact',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(contactData));

      // Mock deepMapObject to call the mapper function with the contact data
      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          mapperFn(data, 'root');
          return data;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        expect(mockUserResponseSerializer).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle data without __entity property', (done) => {
      const plainData: Record<string, unknown> = {
        id: 1,
        name: 'Plain Object',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(plainData));

      // Mock deepMapObject to call the mapper function with the plain data
      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          mapperFn(data, 'root');
          return data;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        expect(mockUserResponseSerializer).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle null data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          if (data !== null) {
            mapperFn(data, 'root');
          }
          return data;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBeNull();
        expect(mockDeepMapObject).toHaveBeenCalledWith(
          null,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle undefined data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          if (data !== undefined) {
            mapperFn(data, 'root');
          }
          return data;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBeUndefined();
        expect(mockDeepMapObject).toHaveBeenCalledWith(
          undefined,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle array data with mixed entities', (done) => {
      const arrayData: EntityData[] = [
        { id: 1, name: 'User 1', __entity: 'User' } as UserEntity,
        { id: 2, name: 'Contact 1', __entity: 'Contact' } as ContactEntity,
        { id: 3, name: 'User 2', __entity: 'User' } as UserEntity,
      ];

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(arrayData));

      // Mock deepMapObject to call the mapper function for each item
      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          if (Array.isArray(data)) {
            data.forEach((item, index) => mapperFn(item, index));
          } else {
            mapperFn(data, 'root');
          }
          return data;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        // Should be called twice for the two User entities
        expect(mockUserResponseSerializer).toHaveBeenCalledTimes(2);
        expect(mockUserResponseSerializer).toHaveBeenCalledWith(arrayData[0]);
        expect(mockUserResponseSerializer).toHaveBeenCalledWith(arrayData[2]);
        done();
      });
    });

    it('should handle nested object data with User entities', (done) => {
      const nestedData: Record<string, unknown> = {
        user: { id: 1, name: 'User 1', __entity: 'User' } as UserEntity,
        contact: {
          id: 2,
          name: 'Contact 1',
          __entity: 'Contact',
        } as ContactEntity,
        metadata: {
          creator: { id: 3, name: 'Creator', __entity: 'User' } as UserEntity,
        },
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(nestedData));

      // Mock deepMapObject to recursively call the mapper function
      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          const processObject = (obj: unknown, key: string | number): void => {
            if (obj && typeof obj === 'object') {
              if (Array.isArray(obj)) {
                obj.forEach((item, index) => processObject(item, index));
              } else {
                mapperFn(obj as SerializableData, key);
                Object.entries(obj as Record<string, unknown>).forEach(
                  ([k, value]) => processObject(value, k),
                );
              }
            }
          };
          processObject(data, 'root');
          return data;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        // Should be called for both User entities
        expect(mockUserResponseSerializer).toHaveBeenCalledTimes(2);
        done();
      });
    });

    it('should return the value from mapper function', (done) => {
      const testData: UserEntity = {
        id: 1,
        name: 'Test',
        __entity: 'User',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      // Mock deepMapObject to simulate the mapper function returning the value
      mockDeepMapObject.mockImplementation(
        (data: SerializableData, mapperFn: MapperFunction) => {
          mapperFn(data, 'root');
          return data;
        },
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe(() => {
        expect(mockDeepMapObject).toHaveBeenCalledWith(
          testData,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle string data', (done) => {
      const stringData = 'Simple string response';

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(stringData));

      mockDeepMapObject.mockImplementation((data: SerializableData) => {
        // For primitive types, just return the data
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(stringData);
        expect(mockDeepMapObject).toHaveBeenCalledWith(
          stringData,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle number data', (done) => {
      const numberData = 42;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(numberData));

      mockDeepMapObject.mockImplementation((data: SerializableData) => {
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(numberData);
        expect(mockDeepMapObject).toHaveBeenCalledWith(
          numberData,
          expect.any(Function),
        );
        done();
      });
    });

    it('should handle boolean data', (done) => {
      const booleanData = true;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(booleanData));

      mockDeepMapObject.mockImplementation((data: SerializableData) => {
        return data;
      });

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(booleanData);
        expect(mockDeepMapObject).toHaveBeenCalledWith(
          booleanData,
          expect.any(Function),
        );
        done();
      });
    });
  });
});
