import { FindManyOptions, Repository } from 'typeorm';
import { IPaginationOptions } from './types/pagination-options';

export const infinityPagination = <T>(
  data: T[],
  { count, limit, page }: IPaginationOptions,
) => {
  const total_pages = limit ? Math.ceil(count / limit) : undefined;
  return {
    data,
    metadata: {
      page: page > 0 ? page : undefined,
      items_per_page: limit > 0 ? limit : undefined,
      total_items: count,
      total_pages,
      hasNextPage: total_pages ? total_pages > page : undefined,
    },
  };
};

export const genericFindManyWithPagination = async <T>(
  repository: Repository<T>,
  baseQuery: FindManyOptions<T>,
  options: IPaginationOptions,
) => {
  const { limit, page } = options;

  if (page <= 0 || limit <= 0) {
    return {
      data: [],
      metadata: {
        total_items: 0,
        hasNextPage: false,
      },
    };
  }

  const count = await repository.count(baseQuery);

  if (count === 0 || (page - 1) * limit >= count) {
    return {
      data: [],
      total_items: count,
      hasNextPage: false,
    };
  }

  const data = await repository.find({
    ...baseQuery,
    skip: (page - 1) * limit,
    take: limit,
  });

  return infinityPagination(data, { ...options, count });
};
