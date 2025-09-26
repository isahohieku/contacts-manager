import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { TypeOrmConfigService } from './typeorm-config.service';

describe('TypeOrmConfigService', () => {
  let service: TypeOrmConfigService;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TypeOrmConfigService>(TypeOrmConfigService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTypeOrmOptions', () => {
    it('should create TypeORM options with all database configuration', () => {
      // Arrange
      const mockDatabaseConfig = {
        'database.type': 'postgres',
        'database.url': 'postgresql://user:pass@localhost:5432/testdb',
        'database.host': 'localhost',
        'database.port': 5432,
        'database.username': 'testuser',
        'database.password': 'testpass',
        'database.name': 'testdb',
        'database.synchronize': false,
        'database.maxConnections': 100,
        'database.sslEnabled': false,
        'app.nodeEnv': 'development',
      };

      configService.get.mockImplementation(
        (key: string) => mockDatabaseConfig[key],
      );

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result).toEqual({
        type: 'postgres',
        url: 'postgresql://user:pass@localhost:5432/testdb',
        host: 'localhost',
        port: 5432,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
        synchronize: false,
        dropSchema: false,
        keepConnectionAlive: true,
        logging: true, // development environment
        entities: [expect.stringContaining('/../**/*.entity{.ts,.js}')],
        migrations: [expect.stringContaining('/migrations/**/*{.ts,.js}')],
        seeds: [expect.stringContaining('/seeds/**/*{.ts,.js}')],
        factories: [expect.stringContaining('/factories/**/*{.ts,.js}')],
        cli: {
          entitiesDir: 'src',
          migrationsDir: 'src/database/migrations',
          subscribersDir: 'subscriber',
        },
        extra: {
          max: 100,
          ssl: undefined,
        },
      } as {
        type: 'postgres';
        url: string;
        host: string;
        port: number;
        username: string;
        password: string;
      });

      // Verify all config calls
      expect(configService.get).toHaveBeenCalledWith('database.type');
      expect(configService.get).toHaveBeenCalledWith('database.url');
      expect(configService.get).toHaveBeenCalledWith('database.host');
      expect(configService.get).toHaveBeenCalledWith('database.port');
      expect(configService.get).toHaveBeenCalledWith('database.username');
      expect(configService.get).toHaveBeenCalledWith('database.password');
      expect(configService.get).toHaveBeenCalledWith('database.name');
      expect(configService.get).toHaveBeenCalledWith('database.synchronize');
      expect(configService.get).toHaveBeenCalledWith('app.nodeEnv');
      expect(configService.get).toHaveBeenCalledWith('database.maxConnections');
      expect(configService.get).toHaveBeenCalledWith('database.sslEnabled');
    });

    it('should disable logging in production environment', () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'production';
        return undefined;
      });

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.logging).toBe(false);
      expect(configService.get).toHaveBeenCalledWith('app.nodeEnv');
    });

    it('should enable logging in non-production environments', () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'development';
        return undefined;
      });

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.logging).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('app.nodeEnv');
    });

    it('should enable logging when nodeEnv is test', () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'test';
        return undefined;
      });

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.logging).toBe(true);
    });

    it('should enable logging when nodeEnv is undefined', () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return undefined;
        return undefined;
      });

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.logging).toBe(true);
    });

    it('should configure SSL when sslEnabled is true with all SSL options', () => {
      // Arrange
      const sslConfig = {
        'database.sslEnabled': true,
        'database.rejectUnauthorized': true,
        'database.ca': 'ca-certificate-content',
        'database.key': 'private-key-content',
        'database.cert': 'certificate-content',
      };

      configService.get.mockImplementation((key: string) => sslConfig[key]);

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.extra.ssl).toEqual({
        rejectUnauthorized: true,
        ca: 'ca-certificate-content',
        key: 'private-key-content',
        cert: 'certificate-content',
      });

      expect(configService.get).toHaveBeenCalledWith('database.sslEnabled');
      expect(configService.get).toHaveBeenCalledWith(
        'database.rejectUnauthorized',
      );
      expect(configService.get).toHaveBeenCalledWith('database.ca');
      expect(configService.get).toHaveBeenCalledWith('database.key');
      expect(configService.get).toHaveBeenCalledWith('database.cert');
    });

    it('should configure SSL when sslEnabled is true with minimal SSL options', () => {
      // Arrange
      const sslConfig = {
        'database.sslEnabled': true,
        'database.rejectUnauthorized': false,
        'database.ca': undefined,
        'database.key': undefined,
        'database.cert': undefined,
      };

      configService.get.mockImplementation((key: string) => sslConfig[key]);

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.extra.ssl).toEqual({
        rejectUnauthorized: false,
        ca: undefined,
        key: undefined,
        cert: undefined,
      });
    });

    it('should set ssl to undefined when sslEnabled is false', () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'database.sslEnabled') return false;
        return undefined;
      });

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.extra.ssl).toBeUndefined();
      expect(configService.get).toHaveBeenCalledWith('database.sslEnabled');
      // SSL-related configs should not be called when SSL is disabled
      expect(configService.get).not.toHaveBeenCalledWith(
        'database.rejectUnauthorized',
      );
      expect(configService.get).not.toHaveBeenCalledWith('database.ca');
      expect(configService.get).not.toHaveBeenCalledWith('database.key');
      expect(configService.get).not.toHaveBeenCalledWith('database.cert');
    });

    it('should set ssl to undefined when sslEnabled is undefined', () => {
      // Arrange
      configService.get.mockImplementation(() => undefined);

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.extra.ssl).toBeUndefined();
    });

    it('should handle SSL configuration with only ca certificate', () => {
      // Arrange
      const sslConfig = {
        'database.sslEnabled': true,
        'database.rejectUnauthorized': true,
        'database.ca': 'ca-certificate-only',
        'database.key': undefined,
        'database.cert': undefined,
      };

      configService.get.mockImplementation((key: string) => sslConfig[key]);

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.extra.ssl).toEqual({
        rejectUnauthorized: true,
        ca: 'ca-certificate-only',
        key: undefined,
        cert: undefined,
      });
    });

    it('should handle SSL configuration with empty string values', () => {
      // Arrange
      const sslConfig = {
        'database.sslEnabled': true,
        'database.rejectUnauthorized': false,
        'database.ca': '',
        'database.key': '',
        'database.cert': '',
      };

      configService.get.mockImplementation((key: string) => sslConfig[key]);

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result.extra.ssl).toEqual({
        rejectUnauthorized: false,
        ca: undefined, // Empty string should become undefined
        key: undefined, // Empty string should become undefined
        cert: undefined, // Empty string should become undefined
      });
    });

    it('should have correct static configuration values', () => {
      // Arrange
      configService.get.mockReturnValue(undefined);

      // Act
      const result = service.createTypeOrmOptions() as {
        dropSchema: boolean;
        keepConnectionAlive: boolean;
        cli: {
          entitiesDir: string;
          migrationsDir: string;
          subscribersDir: string;
        };
      };

      // Assert
      expect(result.dropSchema).toBe(false);
      expect(result.keepConnectionAlive).toBe(true);
      expect(result.cli).toEqual({
        entitiesDir: 'src',
        migrationsDir: 'src/database/migrations',
        subscribersDir: 'subscriber',
      });
    });

    it('should have correct path patterns for entities, migrations, seeds, and factories', () => {
      // Arrange
      configService.get.mockReturnValue(undefined);

      // Act
      const result = service.createTypeOrmOptions() as {
        entities: string[];
        migrations: string[];
        seeds: string[];
        factories: string[];
      };

      // Assert
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0]).toContain('/../**/*.entity{.ts,.js}');

      expect(result.migrations).toHaveLength(1);
      expect(result.migrations[0]).toContain('/migrations/**/*{.ts,.js}');

      expect(result.seeds).toHaveLength(1);
      expect(result.seeds[0]).toContain('/seeds/**/*{.ts,.js}');

      expect(result.factories).toHaveLength(1);
      expect(result.factories[0]).toContain('/factories/**/*{.ts,.js}');
    });

    it('should return TypeOrmModuleOptions interface', () => {
      // Arrange
      configService.get.mockReturnValue(undefined);

      // Act
      const result = service.createTypeOrmOptions();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      // Check that it has the expected TypeORM properties
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('migrations');
      expect(result).toHaveProperty('synchronize');
      expect(result).toHaveProperty('logging');
      expect(result).toHaveProperty('extra');
    });
  });
});
