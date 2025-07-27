import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  createMockRepository,
  mockUser,
  mockAuthProvider,
} from '../../../test/utils/test-helpers';
import { RoleEnum } from '../../shared/utils/types/roles.type';
import { StatusEnum } from '../../shared/utils/types/statuses.type';
import { ForgotService } from '../forgot/forgot.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

import { AuthProvidersService } from './auth-providers.service';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthProvider } from './entities/auth-providers.entity';

describe('AuthService', () => {
  let service: AuthService;
  let authProviderRepository: Repository<AuthProvider>;
  let usersService: UsersService;
  let forgotService: ForgotService;
  let mailService: MailService;
  let authProvidersService: AuthProvidersService;

  const mockAuthProviderRepository = createMockRepository<AuthProvider>();
  const mockUsersService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const mockForgotService = {
    create: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const mockMailService = {
    userSignUp: jest.fn(),
    forgotPassword: jest.fn(),
  };
  const mockAuthProvidersService = {
    findOne: jest.fn(),
    handleLogin: jest.fn(),
  };

  const mockAuthProvider = {
    id: 1,
    name: 'email',
    active: true,
  };

  const mockLoginDto: AuthEmailLoginDto = {
    email: 'test@example.com',
    password: 'password123',
    provider: { id: 1 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(AuthProvider),
          useValue: mockAuthProviderRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ForgotService,
          useValue: mockForgotService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: AuthProvidersService,
          useValue: mockAuthProvidersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authProviderRepository = module.get<Repository<AuthProvider>>(
      getRepositoryToken(AuthProvider),
    );
    usersService = module.get<UsersService>(UsersService);
    forgotService = module.get<ForgotService>(ForgotService);
    mailService = module.get<MailService>(MailService);
    authProvidersService =
      module.get<AuthProvidersService>(AuthProvidersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProviders', () => {
    it('should return active auth providers', async () => {
      const activeProviders = [mockAuthProvider];
      (mockAuthProviderRepository.find as jest.Mock).mockResolvedValue(
        activeProviders,
      );

      const result = await service.getProviders();

      expect(mockAuthProviderRepository.find).toHaveBeenCalledWith({
        where: { active: true },
      });
      expect(result).toEqual(activeProviders);
    });
  });

  describe('validateLogin', () => {
    const activeUser = {
      ...mockUser,
      status: { id: StatusEnum.active, name: 'active' },
      role: { id: RoleEnum.user, name: 'user' },
      provider: { id: 1, name: 'email' },
    };

    it('should validate login successfully for regular user', async () => {
      const mockToken = 'mock-jwt-token';
      const mockProviderHandler = jest.fn().mockResolvedValue({
        token: mockToken,
        user: activeUser,
      });

      mockUsersService.findOne.mockResolvedValue(activeUser);
      (mockAuthProviderRepository.findOne as jest.Mock).mockResolvedValue(
        mockAuthProvider,
      );
      mockAuthProvidersService.handleLogin.mockResolvedValue(
        mockProviderHandler,
      );

      const result = await service.validateLogin(mockLoginDto, false);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        {
          email: mockLoginDto.email,
        },
        false,
      );
      expect(mockAuthProviderRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockLoginDto.provider.id, active: true },
      });
      expect(result).toEqual({
        token: mockToken,
        user: activeUser,
      });
    });

    it('should validate login successfully for admin user', async () => {
      const adminUser = {
        ...activeUser,
        role: { id: RoleEnum.admin, name: 'admin' },
      };
      const mockToken = 'mock-jwt-token';
      const mockProviderHandler = jest.fn().mockResolvedValue({
        token: mockToken,
        user: adminUser,
      });

      mockUsersService.findOne.mockResolvedValue(adminUser);
      (mockAuthProviderRepository.findOne as jest.Mock).mockResolvedValue(
        mockAuthProvider,
      );
      mockAuthProvidersService.handleLogin.mockResolvedValue(
        mockProviderHandler,
      );

      const result = await service.validateLogin(mockLoginDto, true);

      expect(result).toEqual({
        token: mockToken,
        user: adminUser,
      });
    });

    it('should throw error when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(
        service.validateLogin(mockLoginDto, false),
      ).rejects.toThrow();
    });

    it('should throw error when user is not active', async () => {
      const inactiveUser = {
        ...activeUser,
        status: { id: StatusEnum.inactive, name: 'inactive' },
      };

      mockUsersService.findOne.mockResolvedValue(inactiveUser);

      await expect(
        service.validateLogin(mockLoginDto, false),
      ).rejects.toThrow();
    });

    it('should throw error when non-admin tries admin login', async () => {
      mockUsersService.findOne.mockResolvedValue(activeUser);

      await expect(service.validateLogin(mockLoginDto, true)).rejects.toThrow();
    });

    it('should throw error when provider not found', async () => {
      mockUsersService.findOne.mockResolvedValue(activeUser);
      (mockAuthProviderRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.validateLogin(mockLoginDto, false),
      ).rejects.toThrow();
    });

    it('should throw error when provider mismatch', async () => {
      const userWithDifferentProvider = {
        ...activeUser,
        provider: { id: 2, name: 'google' },
      };

      mockUsersService.findOne.mockResolvedValue(userWithDifferentProvider);
      (mockAuthProviderRepository.findOne as jest.Mock).mockResolvedValue(
        mockAuthProvider,
      );

      await expect(
        service.validateLogin(mockLoginDto, false),
      ).rejects.toThrow();
    });
  });

  describe('register', () => {
    const registerDto: AuthRegisterLoginDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      provider: mockAuthProvider as any,
      country: { id: 1, code: 'NG' } as any,
    };

    it('should register a new user successfully', async () => {
      const newUser = {
        ...mockUser,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      };

      mockUsersService.create.mockResolvedValue(newUser);
      mockMailService.userSignUp.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        email: registerDto.email,
      });

      expect(result).toEqual(newUser);
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email successfully', async () => {
      const hash = 'test-hash';
      const inactiveUser = {
        ...mockUser,
        status: { id: StatusEnum.inactive, name: 'inactive' },
        save: jest.fn(),
      };
      const activeUser = {
        ...inactiveUser,
        status: { id: StatusEnum.active, name: 'active' },
      };

      mockUsersService.findOne.mockResolvedValue(inactiveUser);
      mockUsersService.create.mockResolvedValue(activeUser);

      await service.confirmEmail(hash);

      expect(mockUsersService.findOne).toHaveBeenCalledWith({ hash }, false);
      expect(inactiveUser.save).toHaveBeenCalled();
    });

    it('should throw error when hash not found', async () => {
      const hash = 'invalid-hash';
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.confirmEmail(hash)).rejects.toThrow();
    });

    it('should confirm email for already active user without error', async () => {
      const hash = 'test-hash';
      const activeUser = {
        ...mockUser,
        status: { id: StatusEnum.active, name: 'active' },
        save: jest.fn(),
      };

      mockUsersService.findOne.mockResolvedValue(activeUser);

      await service.confirmEmail(hash);

      expect(activeUser.save).toHaveBeenCalled();
    });
  });
});
