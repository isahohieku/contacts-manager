import { FindOptionsWhere } from 'typeorm';

import { DeepPartial } from './deep-partial.type';

export type EntityCondition<T> = {
  [key in keyof DeepPartial<T>]: number | string | FindOptionsWhere<T>;
};
