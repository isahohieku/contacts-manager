import { DeepPartial } from './deep-partial.type';
import { FindOptionsWhere } from 'typeorm';

export type EntityCondition<T> = {
  [key in keyof DeepPartial<T>]: number | string | FindOptionsWhere<T>;
};
