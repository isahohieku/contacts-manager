import * as path from 'path';

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

// Determine the correct paths based on the current working directory
const rootDir = process.cwd();
const isProduction = process.env.NODE_ENV === 'production';

// Configure paths for entities and migrations
const entitiesPath = isProduction
  ? [path.join(rootDir, 'dist/**/*.entity.js')]
  : [path.join(rootDir, 'src/**/*.entity.ts')];

const migrationsPath = isProduction
  ? [path.join(rootDir, 'dist/database/migrations/*.js')]
  : [path.join(rootDir, 'src/database/migrations/*.ts')];

const config = {
  type: (process.env.DATABASE_TYPE || 'postgres') as 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'contacts',
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
  dropSchema: false,
  logging:
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
  entities: entitiesPath,
  migrations: migrationsPath,
  extra: {
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '100', 10),
    ssl:
      process.env.DATABASE_SSL_ENABLED === 'true'
        ? {
            rejectUnauthorized:
              process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
            ca: process.env.DATABASE_CA || undefined,
            key: process.env.DATABASE_KEY || undefined,
            cert: process.env.DATABASE_CERT || undefined,
          }
        : undefined,
  },
};

export const AppDataSource = new DataSource(config);
