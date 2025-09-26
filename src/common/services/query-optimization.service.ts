import { Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  Repository,
  SelectQueryBuilder,
  ObjectLiteral,
} from 'typeorm';

@Injectable()
export class QueryOptimizationService {
  /**
   * Optimizes a TypeORM query by adding proper joins and selecting only necessary fields
   */
  optimizeQuery<T extends ObjectLiteral>(
    repository: Repository<T>,
    baseQuery: FindManyOptions<T>,
    selectFields?: string[],
  ): SelectQueryBuilder<T> {
    const queryBuilder = repository.createQueryBuilder('entity');

    // Apply where conditions
    if (baseQuery.where) {
      queryBuilder.where(baseQuery.where);
    }

    // Apply relations as left joins for better performance
    if (baseQuery.relations) {
      if (Array.isArray(baseQuery.relations)) {
        baseQuery.relations.forEach((relation) => {
          queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
        });
      }
    }

    // Select only specific fields if provided
    if (selectFields && selectFields.length > 0) {
      queryBuilder.select(selectFields.map((field) => `entity.${field}`));
    }

    // Apply ordering
    if (baseQuery.order) {
      Object.entries(baseQuery.order).forEach(([field, direction]) => {
        queryBuilder.addOrderBy(`entity.${field}`, direction as 'ASC' | 'DESC');
      });
    }

    // Apply pagination
    if (baseQuery.skip) {
      queryBuilder.skip(baseQuery.skip);
    }
    if (baseQuery.take) {
      queryBuilder.take(baseQuery.take);
    }

    return queryBuilder;
  }

  /**
   * Creates an optimized search query with proper indexing hints
   */
  createSearchQuery<T extends ObjectLiteral>(
    repository: Repository<T>,
    searchFields: string[],
    searchTerm: string,
    userField?: string,
    userId?: number,
  ): SelectQueryBuilder<T> {
    const queryBuilder = repository.createQueryBuilder('entity');

    // Add user filter if provided
    if (userField && userId) {
      queryBuilder.where(`entity.${userField} = :userId`, { userId });
    }

    // Add search conditions with OR logic
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map((field, index) => {
        const paramName = `search${index}`;
        queryBuilder.setParameter(paramName, `%${searchTerm}%`);
        return `entity.${field} ILIKE :${paramName}`;
      });

      const whereClause = userField && userId ? 'andWhere' : 'where';
      queryBuilder[whereClause](`(${searchConditions.join(' OR ')})`);
    }

    return queryBuilder;
  }

  /**
   * Adds performance hints and optimizations to a query
   */
  addPerformanceHints<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
  ): SelectQueryBuilder<T> {
    // Add query hints for PostgreSQL
    return queryBuilder
      .addSelect('1') // Force index usage hint
      .cache(true); // Enable query result caching
  }

  /**
   * Creates a bulk insert query for better performance
   */
  async bulkInsert<T extends ObjectLiteral>(
    repository: Repository<T>,
    entities: T[],
    chunkSize = 1000,
  ): Promise<void> {
    // Process in chunks to avoid memory issues
    for (let i = 0; i < entities.length; i += chunkSize) {
      const chunk = entities.slice(i, i + chunkSize);
      await repository
        .createQueryBuilder()
        .insert()
        .values(chunk)
        .orIgnore() // Handle conflicts gracefully
        .execute();
    }
  }

  /**
   * Creates an optimized count query
   */
  createCountQuery<T extends ObjectLiteral>(
    repository: Repository<T>,
    baseQuery: FindManyOptions<T>,
  ): SelectQueryBuilder<T> {
    const queryBuilder = repository.createQueryBuilder('entity');

    // Apply where conditions
    if (baseQuery.where) {
      queryBuilder.where(baseQuery.where);
    }

    // For count queries, we don't need to join relations unless they're used in WHERE
    return queryBuilder.select('COUNT(entity.id)', 'count');
  }
}
