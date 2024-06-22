import { HttpException, HttpStatus } from '@nestjs/common';

export const handleError = (
  status: HttpStatus,
  message: string,
  errors: Record<string, any>,
) => {
  return new HttpException(
    {
      status,
      message,
      error: true,
      errors,
    },
    status,
  );
};
