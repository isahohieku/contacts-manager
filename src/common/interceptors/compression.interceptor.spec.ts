import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

import { CompressionInterceptor } from './compression.interceptor';

describe('CompressionInterceptor', () => {
  let interceptor: CompressionInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompressionInterceptor],
    }).compile();

    interceptor = module.get<CompressionInterceptor>(CompressionInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;
    let mockResponse: any;

    beforeEach(() => {
      mockResponse = {
        set: jest.fn(),
      };

      mockExecutionContext = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as ExecutionContext;

      mockCallHandler = {
        handle: jest.fn(),
      } as CallHandler;
    });

    it('should set cache headers for static responses', (done) => {
      const staticData = {
        data: [{ id: 1, name: 'John' }],
        metadata: {
          hasNextPage: false,
          totalCount: 1,
        },
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(staticData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(staticData);
        expect(mockResponse.set).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=300',
        );
        done();
      });
    });

    it('should not set cache headers for non-static responses', (done) => {
      const dynamicData = {
        data: [{ id: 1, name: 'John' }],
        metadata: {
          hasNextPage: true,
          totalCount: 100,
        },
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(dynamicData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(dynamicData);
        expect(mockResponse.set).not.toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=300',
        );
        done();
      });
    });

    it('should set ETag for responses with id', (done) => {
      const dataWithId = {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(dataWithId));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(dataWithId);
        expect(mockResponse.set).toHaveBeenCalledWith(
          'ETag',
          expect.stringMatching(/^"[a-f0-9]+"$/),
        );
        done();
      });
    });

    it('should set ETag for responses with data property', (done) => {
      const dataWithDataProperty = {
        data: [{ id: 1, name: 'John' }],
        status: 'success',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of(dataWithDataProperty),
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(dataWithDataProperty);
        expect(mockResponse.set).toHaveBeenCalledWith(
          'ETag',
          expect.stringMatching(/^"[a-f0-9]+"$/),
        );
        done();
      });
    });

    it('should not set ETag for responses without id or data', (done) => {
      const simpleData = {
        message: 'Success',
        status: 'ok',
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(simpleData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(simpleData);
        expect(mockResponse.set).not.toHaveBeenCalledWith(
          'ETag',
          expect.any(String),
        );
        done();
      });
    });

    it('should handle null data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBeNull();
        expect(mockResponse.set).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle undefined data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBeUndefined();
        expect(mockResponse.set).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle string data', (done) => {
      const stringData = 'Simple string response';

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(stringData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(stringData);
        expect(mockResponse.set).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle number data', (done) => {
      const numberData = 42;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(numberData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(numberData);
        expect(mockResponse.set).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle boolean data', (done) => {
      const booleanData = true;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(booleanData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(booleanData);
        expect(mockResponse.set).not.toHaveBeenCalled();
        done();
      });
    });

    it('should set both cache headers and ETag for static response with id', (done) => {
      const staticDataWithId = {
        id: 456,
        data: [{ id: 1, name: 'John' }],
        metadata: {
          hasNextPage: false,
          totalCount: 1,
        },
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of(staticDataWithId),
      );

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(staticDataWithId);
        expect(mockResponse.set).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=300',
        );
        expect(mockResponse.set).toHaveBeenCalledWith(
          'ETag',
          expect.stringMatching(/^"[a-f0-9]+"$/),
        );
        done();
      });
    });

    it('should generate consistent ETag for same data', (done) => {
      const testData = { id: 123, name: 'Test' };
      let firstETag: string;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

      const result1 = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result1.subscribe(() => {
        firstETag = mockResponse.set.mock.calls.find(
          (call) => call[0] === 'ETag',
        )[1];

        // Reset mock and test again
        mockResponse.set.mockClear();
        (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

        const result2 = interceptor.intercept(
          mockExecutionContext as ExecutionContext,
          mockCallHandler as CallHandler,
        );

        result2.subscribe(() => {
          const secondETag = mockResponse.set.mock.calls.find(
            (call) => call[0] === 'ETag',
          )[1];
          expect(secondETag).toBe(firstETag);
          done();
        });
      });
    });

    it('should generate different ETags for different data', (done) => {
      const testData1 = { id: 123, name: 'Test1' };
      const testData2 = { id: 456, name: 'Test2' };
      let firstETag: string;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData1));

      const result1 = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result1.subscribe(() => {
        firstETag = mockResponse.set.mock.calls.find(
          (call) => call[0] === 'ETag',
        )[1];

        // Reset mock and test with different data
        mockResponse.set.mockClear();
        (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData2));

        const result2 = interceptor.intercept(
          mockExecutionContext as ExecutionContext,
          mockCallHandler as CallHandler,
        );

        result2.subscribe(() => {
          const secondETag = mockResponse.set.mock.calls.find(
            (call) => call[0] === 'ETag',
          )[1];
          expect(secondETag).not.toBe(firstETag);
          done();
        });
      });
    });

    it('should handle complex nested objects for ETag generation', (done) => {
      const complexData = {
        id: 789,
        user: {
          id: 1,
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        data: [
          { id: 1, items: [{ name: 'item1' }, { name: 'item2' }] },
          { id: 2, items: [{ name: 'item3' }] },
        ],
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(complexData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(complexData);
        expect(mockResponse.set).toHaveBeenCalledWith(
          'ETag',
          expect.stringMatching(/^"[a-f0-9]+"$/),
        );
        done();
      });
    });
  });

  describe('isStaticResponse', () => {
    it('should identify static responses correctly', () => {
      const staticData = {
        metadata: { hasNextPage: false },
      };

      const result = (interceptor as any).isStaticResponse(staticData);
      expect(result).toBe(true);
    });

    it('should identify non-static responses correctly', () => {
      const dynamicData = {
        metadata: { hasNextPage: true },
      };

      const result = (interceptor as any).isStaticResponse(dynamicData);
      expect(result).toBe(false);
    });

    it('should handle data without metadata', () => {
      const dataWithoutMetadata = {
        id: 1,
        name: 'Test',
      };

      const result = (interceptor as any).isStaticResponse(dataWithoutMetadata);
      expect(result).toBeFalsy(); // Returns undefined which is falsy
    });
  });

  describe('generateETag', () => {
    it('should generate valid ETag format', () => {
      const testData = { id: 123, name: 'Test' };
      const etag = (interceptor as any).generateETag(testData);

      expect(etag).toMatch(/^"[a-f0-9]+"$/);
    });

    it('should generate consistent ETags for same input', () => {
      const testData = { id: 123, name: 'Test' };
      const etag1 = (interceptor as any).generateETag(testData);
      const etag2 = (interceptor as any).generateETag(testData);

      expect(etag1).toBe(etag2);
    });

    it('should generate different ETags for different inputs', () => {
      const testData1 = { id: 123, name: 'Test1' };
      const testData2 = { id: 456, name: 'Test2' };
      const etag1 = (interceptor as any).generateETag(testData1);
      const etag2 = (interceptor as any).generateETag(testData2);

      expect(etag1).not.toBe(etag2);
    });
  });
});
