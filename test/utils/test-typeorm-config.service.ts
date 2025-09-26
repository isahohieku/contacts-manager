import * as path from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TestTypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    // Use absolute paths for test environment to avoid path resolution issues
    const rootDir = process.cwd();

    return {
      type: this.configService.get('database.type'),
      url: this.configService.get('database.url'),
      host: this.configService.get('database.host'),
      port: this.configService.get('database.port'),
      username: this.configService.get('database.username'),
      password: this.configService.get('database.password'),
      database: this.configService.get('database.name'),
      synchronize: this.configService.get('database.synchronize'),
      dropSchema: false,
      keepConnectionAlive: true,
      logging: false, // Disable logging in tests
      entities: [path.join(rootDir, 'src/**/*.entity{.ts,.js}')],
      migrations: [path.join(rootDir, 'src/database/migrations/**/*{.ts,.js}')],
      // Disable migrations for tests to avoid import issues
      migrationsRun: false,
      extra: {
        // based on https://node-postgres.com/api/pool
        // max connection pool size
        max: this.configService.get('database.maxConnections'),
        ssl: this.configService.get('database.sslEnabled')
          ? {
              rejectUnauthorized: this.configService.get(
                'database.rejectUnauthorized',
              ),
              ca: this.configService.get('database.ca')
                ? this.configService.get('database.ca')
                : undefined,
              key: this.configService.get('database.key')
                ? this.configService.get('database.key')
                : undefined,
              cert: this.configService.get('database.cert')
                ? this.configService.get('database.cert')
                : undefined,
            }
          : undefined,
      },
    } as TypeOrmModuleOptions;
  }
}
