import { FindOptionsWhere } from 'typeorm';

export type FindOptions<T> = {
  where: FindOptionsWhere<T>;
};
