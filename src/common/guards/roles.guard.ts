import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { UserErrorCodes } from '@contactApp/shared/utils/constants/users/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<number[]>('roles', [
      context.getClass(),
      context.getHandler(),
    ]);

    const request = context.switchToHttp().getRequest();

    if (roles.includes(request.user?.role?.id)) {
      return true;
    }

    throw handleError(HttpStatus.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN_RESOURCE, {
      user: UserErrorCodes.FORBIDDEN_RESOURCE,
    });
  }
}
