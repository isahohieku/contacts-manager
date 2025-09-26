import { HttpException, HttpStatus } from '@nestjs/common';

export const handleError = (
  status: HttpStatus,
  message: string,
  errors: Record<string, string>,
): HttpException => {
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
