import { HttpException, HttpStatus, ValidationError } from '@nestjs/common';

import validationOptions from './validation-options.pipe';

describe('ValidationOptions', () => {
  describe('configuration', () => {
    it('should have correct default options', () => {
      expect(validationOptions.transform).toBe(true);
      expect(validationOptions.whitelist).toBe(true);
      expect(validationOptions.errorHttpStatusCode).toBe(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(validationOptions.exceptionFactory).toBeDefined();
    });
  });

  describe('exceptionFactory', () => {
    it('should create HttpException with proper structure for single validation error', () => {
      const validationErrors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
            isNotEmpty: 'email should not be empty',
          },
        },
      ];

      const exception = validationOptions.exceptionFactory!(validationErrors);

      expect(exception).toBeInstanceOf(HttpException);
      expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

      const response = exception.getResponse() as {
        status: number;
        message: string;
        error: boolean;
        errors: Record<string, string>;
      };
      expect(response).toEqual({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          'The request data failed validation checks. Please review the errors.',
        error: true,
        errors: {
          email: 'email must be an email, email should not be empty',
        },
      });
    });

    it('should create HttpException with proper structure for multiple validation errors', () => {
      const validationErrors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        },
        {
          property: 'password',
          constraints: {
            minLength: 'password must be longer than or equal to 8 characters',
            matches: 'password must contain at least one uppercase letter',
          },
        },
        {
          property: 'age',
          constraints: {
            isNumber: 'age must be a number',
            min: 'age must not be less than 0',
          },
        },
      ];

      const exception = validationOptions.exceptionFactory!(validationErrors);

      expect(exception).toBeInstanceOf(HttpException);
      expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

      const response = exception.getResponse() as {
        status: number;
        message: string;
        error: boolean;
        errors: Record<string, string>;
      };
      expect(response).toEqual({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          'The request data failed validation checks. Please review the errors.',
        error: true,
        errors: {
          email: 'email must be an email',
          password:
            'password must be longer than or equal to 8 characters, password must contain at least one uppercase letter',
          age: 'age must be a number, age must not be less than 0',
        },
      });
    });

    it('should handle validation error without constraints', () => {
      const validationErrors: ValidationError[] = [
        {
          property: 'username',
          constraints: undefined,
        },
      ];

      const exception = validationOptions.exceptionFactory!(validationErrors);

      expect(exception).toBeInstanceOf(HttpException);
      const response = exception.getResponse() as {
        errors: Record<string, string>;
      };
      expect(response.errors).toEqual({
        username: '',
      });
    });

    it('should handle validation error with empty constraints', () => {
      const validationErrors: ValidationError[] = [
        {
          property: 'username',
          constraints: {},
        },
      ];

      const exception = validationOptions.exceptionFactory!(validationErrors);

      expect(exception).toBeInstanceOf(HttpException);
      const response = exception.getResponse() as {
        errors: Record<string, string>;
      };
      expect(response.errors).toEqual({
        username: '',
      });
    });

    it('should handle empty validation errors array', () => {
      const validationErrors: ValidationError[] = [];

      const exception = validationOptions.exceptionFactory!(validationErrors);

      expect(exception).toBeInstanceOf(HttpException);
      const response = exception.getResponse() as {
        errors: Record<string, string>;
      };
      expect(response.errors).toEqual({});
    });

    it('should handle validation error with single constraint', () => {
      const validationErrors: ValidationError[] = [
        {
          property: 'name',
          constraints: {
            isNotEmpty: 'name should not be empty',
          },
        },
      ];

      const exception = validationOptions.exceptionFactory!(validationErrors);

      const response = exception.getResponse() as {
        errors: Record<string, string>;
      };
      expect(response.errors).toEqual({
        name: 'name should not be empty',
      });
    });

    it('should handle validation errors with special characters in messages', () => {
      const validationErrors: ValidationError[] = [
        {
          property: 'description',
          constraints: {
            maxLength:
              'description must be shorter than or equal to 255 characters',
            matches:
              'description must not contain special characters like @, #, $',
          },
        },
      ];

      const exception = validationOptions.exceptionFactory!(validationErrors);

      const response = exception.getResponse() as {
        errors: Record<string, string>;
      };
      expect(response.errors).toEqual({
        description:
          'description must be shorter than or equal to 255 characters, description must not contain special characters like @, #, $',
      });
    });

    it('should handle nested property validation errors', () => {
      const validationErrors: ValidationError[] = [
        {
          property: 'address.street',
          constraints: {
            isNotEmpty: 'street should not be empty',
          },
        },
        {
          property: 'address.city',
          constraints: {
            isString: 'city must be a string',
            minLength: 'city must be longer than or equal to 2 characters',
          },
        },
      ];

      const exception = validationOptions.exceptionFactory!(validationErrors);

      const response = exception.getResponse() as {
        errors: Record<string, string>;
      };
      expect(response.errors).toEqual({
        'address.street': 'street should not be empty',
        'address.city':
          'city must be a string, city must be longer than or equal to 2 characters',
      });
    });

    it('should maintain consistent error structure across different validation scenarios', () => {
      const validationErrors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'Invalid email format',
          },
        },
      ];

      const exception = validationOptions.exceptionFactory!(validationErrors);
      const response = exception.getResponse() as {
        status: number;
        message: string;
        error: boolean;
        errors: Record<string, string>;
      };

      // Verify all required fields are present
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('errors');

      // Verify field types
      expect(typeof response.status).toBe('number');
      expect(typeof response.message).toBe('string');
      expect(typeof response.error).toBe('boolean');
      expect(typeof response.errors).toBe('object');

      // Verify field values
      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.error).toBe(true);
    });
  });
});
