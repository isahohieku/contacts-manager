import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';

import { CacheService } from '../../src/common/services/cache.service';
import { LoggerService } from '../../src/common/services/logger.service';

/**
 * Creates a mock repository for testing
 */
export const createMockRepository = <T extends ObjectLiteral = any>(): Partial<
  Repository<T>
> => ({
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
  createQueryBuilder: jest.fn(() => ({
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
  })) as any,
});

/**
 * Creates a mock ConfigService for testing
 */
export const createMockConfigService = (): Partial<ConfigService> => ({
  get: jest.fn((key: string) => {
    const config = {
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
export const createMockJwtService = (): Partial<JwtService> => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ id: 1, email: 'test@example.com' }) as any),
  decode: jest.fn(() => ({ id: 1, email: 'test@example.com' }) as any),
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
  providers: any[] = [],
  imports: any[] = [],
  entities: any[] = [],
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
export const mockUser = {
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
} as any;

/**
 * Mock auth provider data for testing
 */
export const mockAuthProvider = {
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
} as any;

/**
 * Mock contact data for testing
 */
export const mockContact = {
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
export const createMockRequest = (user = mockUser) => ({
  user,
  headers: {},
  query: {},
  params: {},
  body: {},
});

/**
 * Helper to create mock response object
 */
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};
