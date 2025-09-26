import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { User } from '@contactApp/modules/users/entity/user.entity';
import userResponseSerializer from '@contactApp/modules/users/user-response.serializer';
import deepMapObject from '@contactApp/shared/utils/deep-map-object';

@Injectable()
export class SerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        return deepMapObject(data, (value: { __entity?: string }) => {
          if (value.__entity === 'User') {
            userResponseSerializer(value as User);
          }
          return value;
        });
      }),
    );
  }
}
