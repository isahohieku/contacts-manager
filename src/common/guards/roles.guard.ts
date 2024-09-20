import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { handleError } from '../../shared/utils/handlers/error.handler';
import { UserErrorCodes } from '../../shared/utils/constants/users/errors';
import { ERROR_MESSAGES } from '../../shared/utils/constants/generic/errors';

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
