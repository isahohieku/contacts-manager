import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CacheService } from '../services/cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const cacheConfig = configService.get('cache') || {
          ttl: 300,
          max: 1000,
          redis: {
            host: 'localhost',
            port: 6379,
            db: 0,
          },
        };
        return {
          ttl: (cacheConfig.ttl || 300) * 1000, // Convert to milliseconds
          max: cacheConfig.max || 1000,
          // For now, use in-memory cache. In production, you'd use Redis:
          // store: redisStore as any,
          // host: cacheConfig.redis.host,
          // port: cacheConfig.redis.port,
          // password: cacheConfig.redis.password,
          // db: cacheConfig.redis.db,
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
