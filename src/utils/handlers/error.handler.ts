import { HttpException, HttpStatus } from '@nestjs/common';

export const handleError = (
  status: HttpStatus,
  errors: Record<string, any>,
) => {
  throw new HttpException(
    {
      status,
      errors,
    },
    status,
  );
};
