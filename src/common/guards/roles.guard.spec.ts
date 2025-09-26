import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { UserErrorCodes } from '@contactApp/shared/utils/constants/users/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';

import { RolesGuard } from './roles.guard';

// Mock handleError
jest.mock('@contactApp/shared/utils/handlers/error.handler');

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: {
      user?: { id: number; role: { id?: number | string } | null } | null;
    };

    beforeEach(() => {
      mockRequest = {
        user: {
          id: 1,
          role: {
            id: 2, // User role
          },
        },
      };

      mockExecutionContext = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as ExecutionContext;
    });

    it('should allow access when user has required role', () => {
      const requiredRoles = [1, 2]; // Admin and User roles
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getClass(),
        mockExecutionContext.getHandler(),
      ]);
    });

    it('should allow access when user role matches exactly', () => {
      const requiredRoles = [2]; // Only User role
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getClass(),
        mockExecutionContext.getHandler(),
      ]);
    });

    it('should allow access for admin role when multiple roles are required', () => {
      const requiredRoles = [1, 2, 3]; // Admin, User, and another role
      if (mockRequest.user?.role) {
        mockRequest.user.role.id = 1; // Admin role
      }
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should throw error when user does not have required role', () => {
      const requiredRoles = [1]; // Only Admin role
      const mockError = new Error('Forbidden');
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN_RESOURCE,
        {
          user: UserErrorCodes.FORBIDDEN_RESOURCE,
        },
      );
    });

    it('should throw error when user has no role', () => {
      const requiredRoles = [1, 2];
      if (mockRequest.user?.role) {
        mockRequest.user.role = null;
      }
      const mockError = new Error('Forbidden');
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN_RESOURCE,
        {
          user: UserErrorCodes.FORBIDDEN_RESOURCE,
        },
      );
    });

    it('should throw error when user role id is undefined', () => {
      const requiredRoles = [1, 2];
      if (mockRequest.user?.role) {
        mockRequest.user.role.id = undefined;
      }
      const mockError = new Error('Forbidden');
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN_RESOURCE,
        {
          user: UserErrorCodes.FORBIDDEN_RESOURCE,
        },
      );
    });

    it('should throw error when user is null', () => {
      const requiredRoles = [1, 2];
      mockRequest.user = null;
      const mockError = new Error('Forbidden');
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN_RESOURCE,
        {
          user: UserErrorCodes.FORBIDDEN_RESOURCE,
        },
      );
    });

    it('should throw error when user is undefined', () => {
      const requiredRoles = [1, 2];
      mockRequest.user = undefined;
      const mockError = new Error('Forbidden');
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN_RESOURCE,
        {
          user: UserErrorCodes.FORBIDDEN_RESOURCE,
        },
      );
    });

    it('should handle empty required roles array', () => {
      const requiredRoles: number[] = [];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const mockError = new Error('Forbidden');
      (handleError as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(mockError);

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN_RESOURCE,
        {
          user: UserErrorCodes.FORBIDDEN_RESOURCE,
        },
      );
    });

    it('should handle role comparison with different data types', () => {
      const requiredRoles = [2];
      if (mockRequest.user?.role) {
        mockRequest.user.role.id = '2'; // String instead of number
      }
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      (handleError as jest.Mock).mockImplementation(() => {
        throw new Error('Forbidden');
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Forbidden',
      );

      expect(handleError).toHaveBeenCalledWith(
        HttpStatus.FORBIDDEN,
        ERROR_MESSAGES.FORBIDDEN_RESOURCE,
        {
          user: UserErrorCodes.FORBIDDEN_RESOURCE,
        },
      );
    });

    it('should work with single role requirement', () => {
      const requiredRoles = [2];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should work with multiple role requirements', () => {
      const requiredRoles = [1, 2, 3, 4];
      if (mockRequest.user?.role) {
        mockRequest.user.role.id = 3;
      }
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const result = guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should call reflector with correct parameters', () => {
      const requiredRoles = [2]; // Use role 2 which matches the user's role
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      guard.canActivate(mockExecutionContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledTimes(1);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getClass(),
        mockExecutionContext.getHandler(),
      ]);
    });

    it('should access request from execution context correctly', () => {
      const requiredRoles = [2];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const switchToHttpSpy = jest.spyOn(mockExecutionContext, 'switchToHttp');
      const getRequestSpy = jest.fn().mockReturnValue(mockRequest);
      switchToHttpSpy.mockReturnValue({
        getRequest: getRequestSpy,
      } as unknown as HttpArgumentsHost);

      guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(switchToHttpSpy).toHaveBeenCalledTimes(1);
      expect(getRequestSpy).toHaveBeenCalledTimes(1);
    });
  });
});
