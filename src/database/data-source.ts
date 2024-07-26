import { DataSource, DataSourceOptions } from 'typeorm';
import config from '../../ormconfig.json';

export const AppDataSource = new DataSource(
  config as unknown as DataSourceOptions,
);
