import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const Roles = (...roles: number[]): CustomDecorator<string> =>
  SetMetadata('roles', roles);
