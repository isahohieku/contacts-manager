import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Set appropriate headers for compression
        if (data && typeof data === 'object') {
          // Add cache headers for static-like responses
          if (this.isStaticResponse(data)) {
            response.set('Cache-Control', 'public, max-age=300'); // 5 minutes
          }

          // Add ETag for conditional requests
          if (data.id || data.data) {
            const etag = this.generateETag(data);
            response.set('ETag', etag);
          }
        }

        return data;
      }),
    );
  }

  private isStaticResponse(data: {
    metadata?: { hasNextPage: boolean };
  }): boolean {
    // Consider responses with metadata as potentially cacheable
    return (data.metadata && !data.metadata.hasNextPage) || false;
  }

  private generateETag(data: unknown): string {
    // Simple ETag generation based on data hash
    const content = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(16)}"`;
  }
}
