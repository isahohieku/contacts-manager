import {
  DynamicModule,
  ForwardReference,
  Provider,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from 'express';
import { ParsedQs } from 'qs';
import { Repository, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { CacheService } from '../../src/common/services/cache.service';
import { LoggerService } from '../../src/common/services/logger.service';

// Define interfaces for better type safety
interface MockQueryBuilder<T = unknown> {
  where: jest.MockedFunction<
    (condition: string | object) => MockQueryBuilder<T>
  >;
  andWhere: jest.MockedFunction<
    (condition: string | object) => MockQueryBuilder<T>
  >;
  orWhere: jest.MockedFunction<
    (condition: string | object) => MockQueryBuilder<T>
  >;
  orderBy: jest.MockedFunction<
    (sort: string, order?: 'ASC' | 'DESC') => MockQueryBuilder<T>
  >;
  skip: jest.MockedFunction<(offset: number) => MockQueryBuilder<T>>;
  take: jest.MockedFunction<(limit: number) => MockQueryBuilder<T>>;
  leftJoinAndSelect: jest.MockedFunction<
    (relation: string, alias: string) => MockQueryBuilder<T>
  >;
  innerJoinAndSelect: jest.MockedFunction<
    (relation: string, alias: string) => MockQueryBuilder<T>
  >;
  getOne: jest.MockedFunction<() => Promise<T | null>>;
  getMany: jest.MockedFunction<() => Promise<T[]>>;
  getManyAndCount: jest.MockedFunction<() => Promise<[T[], number]>>;
  execute: jest.MockedFunction<() => Promise<unknown>>;
}
interface ConfigMap {
  [key: string]: string | number | boolean;
}

interface MockUser {
  id: number;
  email: string;
  password: string;
  avatar: string | null;
  previousPassword: string;
  firstName: string;
  lastName: string;
  role: { id: number; name: string };
  status: { id: number; name: string };
  provider: { id: number; name: string };
  country: { id: number; code: string };
  hash: string | null;
  contacts: unknown[];
  tags: unknown[];
  files: unknown[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  __entity: string;
  loadPreviousPassword: jest.MockedFunction<() => void>;
  setPassword: jest.MockedFunction<(password: string) => void>;
  setEntityName: jest.MockedFunction<() => void>;
  hasId: jest.MockedFunction<() => boolean>;
  save: jest.MockedFunction<() => Promise<MockUser>>;
  remove: jest.MockedFunction<() => Promise<MockUser>>;
  softRemove: jest.MockedFunction<() => Promise<MockUser>>;
  recover: jest.MockedFunction<() => Promise<MockUser>>;
  reload: jest.MockedFunction<() => Promise<void>>;
}

interface MockAuthProvider {
  id: number;
  name: string;
  active: boolean;
  __entity: string;
  setEntityName: jest.MockedFunction<() => void>;
  hasId: jest.MockedFunction<() => boolean>;
  save: jest.MockedFunction<() => Promise<MockAuthProvider>>;
  remove: jest.MockedFunction<() => Promise<MockAuthProvider>>;
  softRemove: jest.MockedFunction<() => Promise<MockAuthProvider>>;
  recover: jest.MockedFunction<() => Promise<MockAuthProvider>>;
  reload: jest.MockedFunction<() => Promise<void>>;
}

interface MockContact {
  id: number;
  firstName: string;
  lastName: string;
  organization: string;
  job_title: string;
  birthday: Date;
  anniversary: Date;
  notes: string;
  owner: MockUser;
  phone_numbers: unknown[];
  emails: unknown[];
  addresses: unknown[];
  tags: unknown[];
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  hasId: jest.MockedFunction<() => boolean>;
  save: jest.MockedFunction<() => Promise<MockContact>>;
  remove: jest.MockedFunction<() => Promise<MockContact>>;
  softRemove: jest.MockedFunction<() => Promise<MockContact>>;
  recover: jest.MockedFunction<() => Promise<MockContact>>;
  reload: jest.MockedFunction<() => Promise<void>>;
}

interface MockRequest extends Partial<Request> {
  user?: MockUser;
  headers: Record<string, string>;
  query: ParsedQs;
  params: Record<string, string>;
  body: Record<string, unknown>;
}

interface MockResponse {
  status: jest.MockedFunction<(code: number) => MockResponse>;
  json: jest.MockedFunction<(body: unknown) => MockResponse>;
  send: jest.MockedFunction<(body: unknown) => MockResponse>;
  end: jest.MockedFunction<() => MockResponse>;
}

/**
 * Creates a mock repository for testing
 */
export const createMockRepository = <
  T extends ObjectLiteral = ObjectLiteral,
>(): Partial<Repository<T>> => {
  const mockQueryBuilder: MockQueryBuilder<T> = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    execute: jest.fn(),
  };

  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    merge: jest.fn(),
    createQueryBuilder: jest.fn(
      () => mockQueryBuilder,
    ) as unknown as jest.MockedFunction<() => SelectQueryBuilder<T>>,
  };
};

/**
 * Creates a mock ConfigService for testing
 */
export const createMockConfigService = (): Partial<ConfigService> => ({
  get: jest.fn((key: string) => {
    const config: ConfigMap = {
      'auth.secret': 'test-secret',
      'auth.expires': '1d',
      'database.type': 'postgres',
      'database.host': 'localhost',
      'database.port': 5432,
      'cache.ttl': 300,
      'cache.max': 1000,
      'app.port': 3000,
      'app.apiPrefix': 'api',
    };
    return config[key];
  }),
});

/**
 * Creates a mock JwtService for testing
 */
export interface MockJwtService {
  sign: jest.Mock;
  verify: jest.Mock;
  decode: jest.Mock;
}

export const createMockJwtService = (): MockJwtService => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ id: 1, email: 'test@example.com' })),
  decode: jest.fn(() => ({ id: 1, email: 'test@example.com' })),
});

/**
 * Creates a mock CacheService for testing
 */
export const createMockCacheService = (): Partial<CacheService> => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  wrap: jest.fn(),
  generateUserCacheKey: jest.fn(
    (userId: number, operation: string) => `user:${userId}:${operation}`,
  ),
  generateContactCacheKey: jest.fn(
    (contactId: number) => `contact:${contactId}`,
  ),
  generateContactsCacheKey: jest.fn(
    (
      userId: number,
      page: number,
      limit: number,
      search?: string,
      type?: string,
    ) =>
      `contacts:${userId}:page:${page}:limit:${limit}${search ? `:search:${search}` : ''}${type ? `:type:${type}` : ''}`,
  ),
  generateTagsCacheKey: jest.fn((userId: number) => `tags:${userId}`),
  invalidateUserCache: jest.fn(),
  invalidateContactsCache: jest.fn(),
});

/**
 * Creates a mock LoggerService for testing
 */
export const createMockLoggerService = (): Partial<LoggerService> => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

/**
 * Helper to create a testing module with common mocks
 */
export const createTestingModule = async (
  providers: Provider[] = [],
  imports: (
    | Type<unknown>
    | DynamicModule
    | Promise<DynamicModule>
    | ForwardReference<unknown>
  )[] = [],
  entities: (new () => ObjectLiteral)[] = [],
): Promise<TestingModule> => {
  const moduleBuilder = Test.createTestingModule({
    imports,
    providers: [
      ...providers,
      {
        provide: ConfigService,
        useValue: createMockConfigService(),
      },
      {
        provide: JwtService,
        useValue: createMockJwtService(),
      },
      {
        provide: CacheService,
        useValue: createMockCacheService(),
      },
      {
        provide: LoggerService,
        useValue: createMockLoggerService(),
      },
      // Add repository mocks for entities
      ...entities.map((entity) => ({
        provide: getRepositoryToken(entity),
        useValue: createMockRepository(),
      })),
    ],
  });

  return moduleBuilder.compile();
};
/**
 * Mock user data for testing
 */
export const mockUser: MockUser = {
  id: 1,
  email: 'test@example.com',
  password: 'hashedPassword',
  avatar: null,
  previousPassword: 'hashedPassword',
  firstName: 'Test',
  lastName: 'User',
  role: { id: 2, name: 'user' },
  status: { id: 1, name: 'active' },
  provider: { id: 1, name: 'email' },
  country: { id: 1, code: 'NG' },
  hash: null,
  contacts: [],
  tags: [],
  files: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  __entity: 'User',
  // Mock methods
  loadPreviousPassword: jest.fn(),
  setPassword: jest.fn(),
  setEntityName: jest.fn(),
  hasId: jest.fn().mockReturnValue(true),
  save: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  reload: jest.fn(),
};

/**
 * Mock auth provider data for testing
 */
export const mockAuthProvider: MockAuthProvider = {
  id: 1,
  name: 'email',
  active: true,
  __entity: 'AuthProvider',
  setEntityName: jest.fn(),
  hasId: jest.fn().mockReturnValue(true),
  save: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  reload: jest.fn(),
};

/**
 * Mock contact data for testing
 */
export const mockContact: MockContact = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  organization: 'Test Company',
  job_title: 'Developer',
  birthday: new Date('1990-01-01'),
  anniversary: new Date('2020-01-01'),
  notes: 'Test notes',
  owner: mockUser,
  phone_numbers: [],
  emails: [],
  addresses: [],
  tags: [],
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: new Date(),
  // Mock methods from BaseEntity
  hasId: jest.fn().mockReturnValue(true),
  save: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  reload: jest.fn(),
};

/**
 * Helper to create mock request object
 */
export const createMockRequest = (user: MockUser = mockUser): MockRequest => ({
  user,
  headers: {},
  query: {},
  params: {},
  body: {},
});

/**
 * Helper to create mock response object
 */
export const createMockResponse = (): MockResponse => {
  const res = {} as MockResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};
