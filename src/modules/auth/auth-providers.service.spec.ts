import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';

import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { UserErrorCodes } from '@contactApp/shared/utils/constants/users/errors';
import { RoleEnum } from '@contactApp/shared/utils/types/roles.type';
import { StatusEnum } from '@contactApp/shared/utils/types/statuses.type';

import { Role } from '../roles/entities/role.entity';
import { Status } from '../statuses/entities/status.entity';
import { User } from '../users/entity/user.entity';

import { AuthProvidersEnum } from './auth-providers.enum';
import { AuthProvidersService } from './auth-providers.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthProvidersService', () => {
  let service: AuthProvidersService;

  const mockJwtService = {
    sign: jest.fn(),
  };

  const testUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: { id: RoleEnum.user } as Role,
    status: { id: StatusEnum.active } as Status,
    avatar: null,
    previousPassword: '',
    loadPreviousPassword: jest.fn(),
    setPassword: jest.fn(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as User;

  const mockLoginDto: AuthEmailLoginDto = {
    email: 'test@example.com',
    password: 'plainPassword123',
    provider: { id: 1 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthProvidersService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthProvidersService>(AuthProvidersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleLogin', () => {
    it('should return loginWithEmail function for EMAIL provider', async () => {
      // Act
      const handler = await service.handleLogin(AuthProvidersEnum.EMAIL);

      // Assert
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
      // The handler should be the bound loginWithEmail method
      expect(handler.name).toBe('bound loginWithEmail');
    });

    it('should throw error for unsupported provider', async () => {
      // Arrange
      const unsupportedProvider = 'unsupported' as AuthProvidersEnum;

      // Act & Assert
      await expect(service.handleLogin(unsupportedProvider)).rejects.toThrow(
        'Unsupported provider: unsupported',
      );
    });

    it('should throw error for GOOGLE provider (not implemented)', async () => {
      // Act & Assert
      await expect(
        service.handleLogin(AuthProvidersEnum.GOOGLE),
      ).rejects.toThrow('Unsupported provider: google');
    });

    it('should return bound function that maintains context', async () => {
      // Arrange
      const spy = jest.spyOn(service, 'loginWithEmail');

      // Act
      const handler = await service.handleLogin(AuthProvidersEnum.EMAIL);

      // Mock bcrypt for this test
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockResolvedValue('mock-jwt-token');

      await handler(testUser, mockLoginDto);

      // Assert
      expect(spy).toHaveBeenCalledWith(testUser, mockLoginDto);
    });
  });

  describe('loginWithEmail', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const expectedToken = 'mock-jwt-token';
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockResolvedValue(expectedToken);

      // Act
      const result = await service.loginWithEmail(testUser, mockLoginDto);

      // Assert
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        testUser.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: testUser.id,
        role: testUser.role,
        status: testUser.status,
      });
      expect(result).toEqual({
        token: expectedToken,
        user: testUser,
      });
    });

    it('should throw error with invalid password', async () => {
      // Arrange
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      try {
        await service.loginWithEmail(testUser, mockLoginDto);
        fail('Expected method to throw');
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        const response = error.getResponse();
        expect(response.message).toBe(ERROR_MESSAGES.INCORRECT_PASSWORD);
        expect(response.errors).toEqual({
          password: UserErrorCodes.INCORRECT_PASSWORD,
        });
      }

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        testUser.password,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle bcrypt comparison error', async () => {
      // Arrange
      const bcryptError = new Error('Bcrypt comparison failed');
      mockedBcrypt.compare.mockRejectedValue(bcryptError as never);

      // Act & Assert
      await expect(
        service.loginWithEmail(testUser, mockLoginDto),
      ).rejects.toThrow(bcryptError);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle JWT signing error', async () => {
      // Arrange
      const jwtError = new Error('JWT signing failed');
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockRejectedValue(jwtError);

      // Act & Assert
      await expect(
        service.loginWithEmail(testUser, mockLoginDto),
      ).rejects.toThrow(jwtError);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        testUser.password,
      );
    });

    it('should work with different user roles and statuses', async () => {
      // Arrange
      const adminUser = {
        ...testUser,
        role: { id: RoleEnum.admin } as Role,
        status: { id: StatusEnum.inactive } as Status,
      };
      const expectedToken = 'admin-jwt-token';

      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockResolvedValue(expectedToken);

      // Act
      const result = await service.loginWithEmail(
        adminUser as unknown as User,
        mockLoginDto,
      );

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: adminUser.id,
        role: adminUser.role,
        status: adminUser.status,
      });
      expect(result).toEqual({
        token: expectedToken,
        user: adminUser,
      });
    });

    it('should handle empty password in loginDto', async () => {
      // Arrange
      const emptyPasswordDto = {
        ...mockLoginDto,
        password: '',
      };
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      try {
        await service.loginWithEmail(testUser, emptyPasswordDto);
        fail('Expected method to throw');
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        const response = error.getResponse();
        expect(response.message).toBe(ERROR_MESSAGES.INCORRECT_PASSWORD);
      }

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('', testUser.password);
    });

    it('should handle null user password', async () => {
      // Arrange
      const userWithNullPassword = {
        ...testUser,
        password: null,
      };
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      try {
        await service.loginWithEmail(
          userWithNullPassword as unknown as User,
          mockLoginDto,
        );
        fail('Expected method to throw');
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      }

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        null,
      );
    });

    it('should generate JWT with correct payload structure', async () => {
      // Arrange
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockResolvedValue('test-token');

      // Act
      await service.loginWithEmail(testUser, mockLoginDto);

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
      const jwtPayload = mockJwtService.sign.mock.calls[0][0];

      expect(jwtPayload).toHaveProperty('id', testUser.id);
      expect(jwtPayload).toHaveProperty('role', testUser.role);
      expect(jwtPayload).toHaveProperty('status', testUser.status);
      expect(Object.keys(jwtPayload)).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('should preserve error structure from handleError utility', async () => {
      // Arrange
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      try {
        await service.loginWithEmail(testUser, mockLoginDto);
        fail('Expected method to throw');
      } catch (error) {
        // Verify the error structure matches what handleError produces
        expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        const response = error.getResponse();
        expect(response.message).toBe(ERROR_MESSAGES.INCORRECT_PASSWORD);
        expect(response.errors).toEqual({
          password: UserErrorCodes.INCORRECT_PASSWORD,
        });
        expect(response.error).toBe(true);
      }
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete login flow through handleLogin', async () => {
      // Arrange
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockResolvedValue('integration-token');

      // Act
      const handler = await service.handleLogin(AuthProvidersEnum.EMAIL);
      const result = await handler(testUser, mockLoginDto);

      // Assert
      expect(result).toEqual({
        token: 'integration-token',
        user: testUser,
      });
    });

    it('should handle failed login flow through handleLogin', async () => {
      // Arrange
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const handler = await service.handleLogin(AuthProvidersEnum.EMAIL);

      // Assert
      await expect(handler(testUser, mockLoginDto)).rejects.toMatchObject({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });
  });
});
