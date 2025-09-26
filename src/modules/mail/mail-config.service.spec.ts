import * as path from 'path';

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { MailConfigService } from './mail-config.service';

describe('MailConfigService', () => {
  let service: MailConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailConfigService>(MailConfigService);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'mail.host': 'smtp.example.com',
        'mail.port': 587,
        'mail.ignoreTLS': false,
        'mail.secure': false,
        'mail.requireTLS': true,
        'mail.user': 'test@example.com',
        'mail.password': 'test-password',
        'mail.defaultName': 'Contact List App',
        'mail.defaultEmail': 'noreply@example.com',
        'app.workingDirectory': '/app',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMailerOptions', () => {
    it('should create mailer options with default configuration', () => {
      const options = service.createMailerOptions();

      expect(mockConfigService.get).toHaveBeenCalledWith('mail.host');
      expect(mockConfigService.get).toHaveBeenCalledWith('mail.port');
      expect(mockConfigService.get).toHaveBeenCalledWith('mail.ignoreTLS');
      expect(mockConfigService.get).toHaveBeenCalledWith('mail.secure');
      expect(mockConfigService.get).toHaveBeenCalledWith('mail.requireTLS');
      expect(mockConfigService.get).toHaveBeenCalledWith('mail.user');
      expect(mockConfigService.get).toHaveBeenCalledWith('mail.password');
      expect(mockConfigService.get).toHaveBeenCalledWith('mail.defaultName');
      expect(mockConfigService.get).toHaveBeenCalledWith('mail.defaultEmail');
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'app.workingDirectory',
      );

      expect(options).toEqual({
        transport: {
          host: 'smtp.example.com',
          port: 587,
          ignoreTLS: false,
          secure: false,
          requireTLS: true,
          auth: {
            user: 'test@example.com',
            pass: 'test-password',
          },
        },
        defaults: {
          from: '"Contact List App" <noreply@example.com>',
        },
        template: {
          dir: path.join('/app', 'src', 'common', 'mail', 'templates'),
          adapter: expect.any(HandlebarsAdapter),
          options: {
            strict: true,
          },
        },
      });
    });

    it('should handle different mail host configurations', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'mail.host') return 'smtp.gmail.com';
        if (key === 'mail.port') return 465;
        if (key === 'mail.secure') return true;
        if (key === 'mail.requireTLS') return false;
        return 'default-value';
      });

      const options = service.createMailerOptions();

      expect(options.transport).toEqual(
        expect.objectContaining({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          requireTLS: false,
        }),
      );
    });

    it('should handle different authentication configurations', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'mail.user') return 'admin@company.com';
        if (key === 'mail.password') return 'super-secret-password';
        return 'default-value';
      });

      const options = service.createMailerOptions();

      expect(
        (options.transport as { auth: { user: string; pass: string } }).auth,
      ).toEqual({
        user: 'admin@company.com',
        pass: 'super-secret-password',
      });
    });

    it('should handle different default sender configurations', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'mail.defaultName') return 'My Custom App';
        if (key === 'mail.defaultEmail') return 'support@myapp.com';
        return 'default-value';
      });

      const options = service.createMailerOptions();

      expect((options.defaults as { from: string }).from).toBe(
        '"My Custom App" <support@myapp.com>',
      );
    });

    it('should use process.cwd() when app.workingDirectory is not configured', () => {
      const mockCwd = jest.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.workingDirectory') return undefined;
        return 'default-value';
      });

      const options = service.createMailerOptions();

      expect((options.template as { dir: string }).dir).toBe(
        path.join('/mock/cwd', 'src', 'common', 'mail', 'templates'),
      );

      mockCwd.mockRestore();
    });

    it('should use app.workingDirectory when configured', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.workingDirectory') return '/custom/working/dir';
        return 'default-value';
      });

      const options = service.createMailerOptions();

      expect((options.template as { dir: string }).dir).toBe(
        path.join('/custom/working/dir', 'src', 'common', 'mail', 'templates'),
      );
    });

    it('should handle null/undefined configuration values', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'mail.host': null,
          'mail.port': undefined,
          'mail.user': '',
          'mail.password': null,
          'mail.defaultName': undefined,
          'mail.defaultEmail': '',
        };
        return config[key];
      });

      const options = service.createMailerOptions();

      expect(options.transport).toEqual(
        expect.objectContaining({
          host: null,
          port: undefined,
          auth: {
            user: '',
            pass: null,
          },
        }),
      );
      expect((options.defaults as { from: string }).from).toBe(
        '"undefined" <>',
      );
    });

    it('should configure HandlebarsAdapter with strict mode', () => {
      const options = service.createMailerOptions();

      expect((options.template as { adapter: unknown }).adapter).toBeInstanceOf(
        HandlebarsAdapter,
      );
      expect(
        (options.template as { options: { strict: boolean } }).options,
      ).toEqual({
        strict: true,
      });
    });

    it('should handle boolean configuration values correctly', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'mail.ignoreTLS': true,
          'mail.secure': true,
          'mail.requireTLS': false,
        };
        return config[key] !== undefined ? config[key] : 'default-value';
      });

      const options = service.createMailerOptions();

      expect(options.transport).toEqual(
        expect.objectContaining({
          ignoreTLS: true,
          secure: true,
          requireTLS: false,
        }),
      );
    });

    it('should handle numeric port configurations', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'mail.port': 25,
        };
        return config[key] !== undefined ? config[key] : 'default-value';
      });

      const options = service.createMailerOptions();

      expect((options.transport as { port: number }).port).toBe(25);
    });

    it('should create consistent template directory paths', () => {
      const workingDirs = ['/app', '/home/user/app', 'C:\\app', '/var/www'];

      workingDirs.forEach((workingDir) => {
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'app.workingDirectory') return workingDir;
          return 'default-value';
        });

        const options = service.createMailerOptions();
        const expectedPath = path.join(
          workingDir,
          'src',
          'common',
          'mail',
          'templates',
        );

        expect((options.template as { dir: string }).dir).toBe(expectedPath);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string configurations', () => {
      mockConfigService.get.mockImplementation(() => '');

      const options = service.createMailerOptions();

      expect(options.transport).toEqual(
        expect.objectContaining({
          host: '',
          port: '',
          ignoreTLS: '',
          secure: '',
          requireTLS: '',
          auth: {
            user: '',
            pass: '',
          },
        }),
      );
      expect((options.defaults as { from: string }).from).toBe('"" <>');
    });

    it('should handle special characters in configuration values', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'mail.defaultName': 'App with "Quotes" & Symbols',
          'mail.defaultEmail': 'test+special@example.com',
          'mail.password': 'p@ssw0rd!@#$%^&*()',
        };
        return config[key] || 'default-value';
      });

      const options = service.createMailerOptions();

      expect((options.defaults as { from: string }).from).toBe(
        '"App with "Quotes" & Symbols" <test+special@example.com>',
      );
      expect(
        (options.transport as { auth: { user: string; pass: string } }).auth
          .pass,
      ).toBe('p@ssw0rd!@#$%^&*()');
    });
  });
});
