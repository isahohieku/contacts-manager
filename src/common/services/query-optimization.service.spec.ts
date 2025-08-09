import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder, FindManyOptions } from 'typeorm';

import { QueryOptimizationService } from './query-optimization.service';

// Mock entity for testing
interface TestEntity {
  id: number;
  name: string;
  email: string;
  userId: number;
}

describe('QueryOptimizationService', () => {
  let service: QueryOptimizationService;
  let mockRepository: jest.Mocked<Repository<TestEntity>>;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    // Create mock query builder with all necessary methods
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      cache: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    } as any;

    // Create mock repository
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryOptimizationService],
    }).compile();

    service = module.get<QueryOptimizationService>(QueryOptimizationService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('optimizeQuery', () => {
    it('should create basic query builder', () => {
      const baseQuery: FindManyOptions<TestEntity> = {};

      const result = service.optimizeQuery(mockRepository, baseQuery);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entity');
      expect(result).toBe(mockQueryBuilder);
    });

    it('should apply where conditions', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        where: { id: 1 },
      };

      service.optimizeQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 1 });
    });

    it('should apply relations as left joins', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        relations: ['profile', 'posts'],
      };

      service.optimizeQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entity.profile',
        'profile',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entity.posts',
        'posts',
      );
    });

    it('should handle non-array relations', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        relations: {} as any, // Non-array relations
      };

      service.optimizeQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    });

    it('should select specific fields when provided', () => {
      const baseQuery: FindManyOptions<TestEntity> = {};
      const selectFields = ['id', 'name', 'email'];

      service.optimizeQuery(mockRepository, baseQuery, selectFields);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'entity.id',
        'entity.name',
        'entity.email',
      ]);
    });

    it('should not select specific fields when not provided', () => {
      const baseQuery: FindManyOptions<TestEntity> = {};

      service.optimizeQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.select).not.toHaveBeenCalled();
    });

    it('should not select specific fields when empty array provided', () => {
      const baseQuery: FindManyOptions<TestEntity> = {};
      const selectFields: string[] = [];

      service.optimizeQuery(mockRepository, baseQuery, selectFields);

      expect(mockQueryBuilder.select).not.toHaveBeenCalled();
    });

    it('should apply ordering', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        order: {
          name: 'ASC',
          email: 'DESC',
        },
      };

      service.optimizeQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'entity.name',
        'ASC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'entity.email',
        'DESC',
      );
    });

    it('should apply pagination with skip', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        skip: 10,
      };

      service.optimizeQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
    });

    it('should apply pagination with take', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        take: 20,
      };

      service.optimizeQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should apply all options together', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        where: { userId: 1 },
        relations: ['profile'],
        order: { name: 'ASC' },
        skip: 5,
        take: 10,
      };
      const selectFields = ['id', 'name'];

      service.optimizeQuery(mockRepository, baseQuery, selectFields);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ userId: 1 });
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entity.profile',
        'profile',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'entity.id',
        'entity.name',
      ]);
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'entity.name',
        'ASC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('createSearchQuery', () => {
    it('should create basic search query', () => {
      const searchFields = ['name', 'email'];
      const searchTerm = 'john';

      const result = service.createSearchQuery(
        mockRepository,
        searchFields,
        searchTerm,
      );

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entity');
      expect(result).toBe(mockQueryBuilder);
    });

    it('should add user filter when provided', () => {
      const searchFields = ['name'];
      const searchTerm = 'john';
      const userField = 'userId';
      const userId = 123;

      service.createSearchQuery(
        mockRepository,
        searchFields,
        searchTerm,
        userField,
        userId,
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entity.userId = :userId',
        { userId: 123 },
      );
    });

    it('should add search conditions with OR logic', () => {
      const searchFields = ['name', 'email'];
      const searchTerm = 'john';

      service.createSearchQuery(mockRepository, searchFields, searchTerm);

      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'search0',
        '%john%',
      );
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'search1',
        '%john%',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(entity.name ILIKE :search0 OR entity.email ILIKE :search1)',
      );
    });

    it('should use andWhere when user filter is applied', () => {
      const searchFields = ['name'];
      const searchTerm = 'john';
      const userField = 'userId';
      const userId = 123;

      service.createSearchQuery(
        mockRepository,
        searchFields,
        searchTerm,
        userField,
        userId,
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entity.userId = :userId',
        { userId: 123 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(entity.name ILIKE :search0)',
      );
    });

    it('should handle empty search term', () => {
      const searchFields = ['name'];
      const searchTerm = '';

      service.createSearchQuery(mockRepository, searchFields, searchTerm);

      expect(mockQueryBuilder.setParameter).not.toHaveBeenCalled();
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should handle empty search fields', () => {
      const searchFields: string[] = [];
      const searchTerm = 'john';

      service.createSearchQuery(mockRepository, searchFields, searchTerm);

      expect(mockQueryBuilder.setParameter).not.toHaveBeenCalled();
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should handle user filter without search term', () => {
      const searchFields = ['name'];
      const searchTerm = '';
      const userField = 'userId';
      const userId = 123;

      service.createSearchQuery(
        mockRepository,
        searchFields,
        searchTerm,
        userField,
        userId,
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entity.userId = :userId',
        { userId: 123 },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should handle single search field', () => {
      const searchFields = ['name'];
      const searchTerm = 'john';

      service.createSearchQuery(mockRepository, searchFields, searchTerm);

      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'search0',
        '%john%',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(entity.name ILIKE :search0)',
      );
    });

    it('should handle multiple search fields', () => {
      const searchFields = ['name', 'email', 'phone'];
      const searchTerm = 'john';

      service.createSearchQuery(mockRepository, searchFields, searchTerm);

      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'search0',
        '%john%',
      );
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'search1',
        '%john%',
      );
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'search2',
        '%john%',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(entity.name ILIKE :search0 OR entity.email ILIKE :search1 OR entity.phone ILIKE :search2)',
      );
    });
  });

  describe('addPerformanceHints', () => {
    it('should add performance hints to query builder', () => {
      const result = service.addPerformanceHints(mockQueryBuilder);

      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('1');
      expect(mockQueryBuilder.cache).toHaveBeenCalledWith(true);
      expect(result).toBe(mockQueryBuilder);
    });
  });

  describe('bulkInsert', () => {
    it('should perform bulk insert with default chunk size', async () => {
      const entities = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `Entity ${i}`,
      }));

      await service.bulkInsert(mockRepository, entities);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.insert).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(entities);
      expect(mockQueryBuilder.orIgnore).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.execute).toHaveBeenCalledTimes(1);
    });

    it('should perform bulk insert with custom chunk size', async () => {
      const entities = Array.from({ length: 250 }, (_, i) => ({
        id: i,
        name: `Entity ${i}`,
      }));
      const chunkSize = 100;

      await service.bulkInsert(mockRepository, entities, chunkSize);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(3); // 250 / 100 = 3 chunks
      expect(mockQueryBuilder.insert).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle empty entities array', async () => {
      const entities: any[] = [];

      await service.bulkInsert(mockRepository, entities);

      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(mockQueryBuilder.execute).not.toHaveBeenCalled();
    });

    it('should handle entities count less than chunk size', async () => {
      const entities = [{ id: 1, name: 'Entity 1' }];
      const chunkSize = 1000;

      await service.bulkInsert(mockRepository, entities, chunkSize);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(entities);
      expect(mockQueryBuilder.execute).toHaveBeenCalledTimes(1);
    });

    it('should process exact multiple of chunk size', async () => {
      const entities = Array.from({ length: 2000 }, (_, i) => ({
        id: i,
        name: `Entity ${i}`,
      }));
      const chunkSize = 1000;

      await service.bulkInsert(mockRepository, entities, chunkSize);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(2); // 2000 / 1000 = 2 chunks
      expect(mockQueryBuilder.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('createCountQuery', () => {
    it('should create basic count query', () => {
      const baseQuery: FindManyOptions<TestEntity> = {};

      const result = service.createCountQuery(mockRepository, baseQuery);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entity');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'COUNT(entity.id)',
        'count',
      );
      expect(result).toBe(mockQueryBuilder);
    });

    it('should apply where conditions to count query', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        where: { userId: 1 },
      };

      service.createCountQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ userId: 1 });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'COUNT(entity.id)',
        'count',
      );
    });

    it('should not apply relations to count query', () => {
      const baseQuery: FindManyOptions<TestEntity> = {
        where: { userId: 1 },
        relations: ['profile', 'posts'],
        order: { name: 'ASC' },
        skip: 10,
        take: 20,
      };

      service.createCountQuery(mockRepository, baseQuery);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ userId: 1 });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'COUNT(entity.id)',
        'count',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
      expect(mockQueryBuilder.addOrderBy).not.toHaveBeenCalled();
      expect(mockQueryBuilder.skip).not.toHaveBeenCalled();
      expect(mockQueryBuilder.take).not.toHaveBeenCalled();
    });
  });
});
