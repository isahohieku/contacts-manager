import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { CacheService } from '../services/cache.service';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

export const CacheKey =
  (key: string) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflector.createDecorator<string>()(key)(target, propertyKey, descriptor);
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value);
  };

export const CacheTTL =
  (ttl: number) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
  };

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );
    const cacheTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    // Generate dynamic cache key based on request parameters
    const request = context.switchToHttp().getRequest();
    const dynamicKey = this.generateDynamicKey(cacheKey, request);

    // Try to get from cache
    const cachedResult = await this.cacheService.get(dynamicKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    // If not in cache, execute the handler and cache the result
    return next.handle().pipe(
      tap(async (result) => {
        if (result) {
          await this.cacheService.set(dynamicKey, result, cacheTTL);
        }
      }),
    );
  }

  private generateDynamicKey(baseKey: string, request: any): string {
    const userId = request.user?.id;
    const query = request.query;
    const params = request.params;

    let dynamicKey = baseKey;

    if (userId) {
      dynamicKey += `:user:${userId}`;
    }

    // Add query parameters to cache key
    if (query && Object.keys(query).length > 0) {
      const sortedQuery = Object.keys(query)
        .sort()
        .map((key) => `${key}:${query[key]}`)
        .join(':');
      dynamicKey += `:query:${sortedQuery}`;
    }

    // Add route parameters to cache key
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}:${params[key]}`)
        .join(':');
      dynamicKey += `:params:${sortedParams}`;
    }

    return dynamicKey;
  }
}
