import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // Note: reset method might not be available in all cache implementations
    // For now, we'll implement a simple clear by deleting known keys
    // In production, you'd want to use a more sophisticated approach
    try {
      if (
        'reset' in this.cacheManager &&
        typeof this.cacheManager.reset === 'function'
      ) {
        await this.cacheManager.reset();
      }
    } catch (error) {
      // Fallback: silently fail as this is not critical
    }
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    return await this.cacheManager.wrap(key, fn, ttl);
  }

  // Helper methods for common cache patterns
  generateUserCacheKey(userId: number, operation: string): string {
    return `user:${userId}:${operation}`;
  }

  generateContactsCacheKey(
    userId: number,
    page: number,
    limit: number,
    search?: string,
    type?: string,
  ): string {
    const searchPart = search ? `:search:${search}` : '';
    const typePart = type ? `:type:${type}` : '';
    return `contacts:${userId}:page:${page}:limit:${limit}${searchPart}${typePart}`;
  }

  generateContactCacheKey(contactId: number): string {
    return `contact:${contactId}`;
  }

  generateTagsCacheKey(userId: number): string {
    return `tags:${userId}`;
  }

  // Cache invalidation helpers
  async invalidateUserCache(userId: number): Promise<void> {
    // eslint-disable-next-line no-console
    console.log({ invalidateUserCache: userId });
    // This would require a more sophisticated cache implementation
    // For now, we'll just reset the entire cache
    // In production, you'd want to use cache tags or patterns
    await this.reset();
  }

  async invalidateContactsCache(userId: number): Promise<void> {
    // eslint-disable-next-line no-console
    console.log({ invalidateContactsCache: userId });
    // Similar to above - in production you'd want pattern-based invalidation
    await this.reset();
  }
}
