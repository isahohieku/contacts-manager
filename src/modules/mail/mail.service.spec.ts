import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { MailData } from './interfaces/mail-data.interface';
import { MailService } from './mail.service';

// Mock the translation files
jest.mock('@contactApp/shared/translations/confirm-email.json', () => ({
  text1: 'Please confirm your email address',
  text2: 'Click the button below to confirm your email',
  text3: 'If you did not create an account, please ignore this email',
}));

jest.mock('@contactApp/shared/translations/reset-password.json', () => ({
  text1: 'You requested a password reset',
  text2: 'Click the button below to reset your password',
  text3: 'This link will expire in 24 hours',
  text4: 'If you did not request this, please ignore this email',
}));

describe('MailService', () => {
  let service: MailService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'app.frontendDomain': 'https://example.com',
        'app.name': 'Contact List App',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('userSignUp', () => {
    const mailData: MailData<{ hash: string }> = {
      to: 'test@example.com',
      data: {
        hash: 'test-hash-123',
      },
    };

    it('should send confirmation email successfully', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);

      await service.userSignUp(mailData);

      expect(mockConfigService.get).toHaveBeenCalledWith('app.frontendDomain');
      expect(mockConfigService.get).toHaveBeenCalledWith('app.name');
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Confirm email address',
        text: 'https://example.com/confirm-email/test-hash-123 Confirm email address',
        template: 'activation',
        context: {
          title: 'Confirm email address',
          url: 'https://example.com/confirm-email/test-hash-123',
          actionTitle: 'Confirm email address',
          app_name: 'Contact List App',
          text1: 'Please confirm your email address',
          text2: 'Click the button below to confirm your email',
          text3: 'If you did not create an account, please ignore this email',
        },
      });
    });

    it('should handle different frontend domain configurations', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'app.frontendDomain': 'https://staging.example.com',
          'app.name': 'Staging App',
        };
        return config[key];
      });
      mockMailerService.sendMail.mockResolvedValue(true);

      await service.userSignUp(mailData);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'https://staging.example.com/confirm-email/test-hash-123 Confirm email address',
          context: expect.objectContaining({
            url: 'https://staging.example.com/confirm-email/test-hash-123',
            app_name: 'Staging App',
          }),
        }),
      );
    });

    it('should handle different hash values', async () => {
      const differentMailData = {
        ...mailData,
        data: { hash: 'different-hash-456' },
      };
      mockMailerService.sendMail.mockResolvedValue(true);

      await service.userSignUp(differentMailData);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'https://example.com/confirm-email/different-hash-456 Confirm email address',
          context: expect.objectContaining({
            url: 'https://example.com/confirm-email/different-hash-456',
          }),
        }),
      );
    });

    it('should handle different email addresses', async () => {
      const differentMailData = {
        ...mailData,
        to: 'different@example.com',
      };
      mockMailerService.sendMail.mockResolvedValue(true);

      await service.userSignUp(differentMailData);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'different@example.com',
        }),
      );
    });

    it('should log success message when email is sent successfully', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      await service.userSignUp(mailData);

      expect(logSpy).toHaveBeenCalledWith(
        'Confirmation email sent successfully to test@example.com',
      );

      logSpy.mockRestore();
    });

    it('should log error and rethrow when mailer service fails', async () => {
      const error = new Error('SMTP connection failed');
      mockMailerService.sendMail.mockRejectedValue(error);
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(service.userSignUp(mailData)).rejects.toThrow(
        'SMTP connection failed',
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send confirmation email to test@example.com',
        error.stack,
      );

      errorSpy.mockRestore();
    });

    it('should handle mailer service errors with different error types', async () => {
      const error = new Error('Invalid email address');
      mockMailerService.sendMail.mockRejectedValue(error);
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(service.userSignUp(mailData)).rejects.toThrow(
        'Invalid email address',
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send confirmation email to test@example.com',
        error.stack,
      );

      errorSpy.mockRestore();
    });
  });

  describe('forgotPassword', () => {
    const mailData: MailData<{ hash: string }> = {
      to: 'user@example.com',
      data: {
        hash: 'reset-hash-789',
      },
    };

    it('should send password reset email successfully', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);

      await service.forgotPassword(mailData);

      expect(mockConfigService.get).toHaveBeenCalledWith('app.frontendDomain');
      expect(mockConfigService.get).toHaveBeenCalledWith('app.name');
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Reset Password',
        text: 'https://example.com/password-change/reset-hash-789 Reset Password',
        template: 'reset-password',
        context: {
          title: 'Reset Password',
          url: 'https://example.com/password-change/reset-hash-789',
          actionTitle: 'Reset Password',
          app_name: 'Contact List App',
          text1: 'You requested a password reset',
          text2: 'Click the button below to reset your password',
          text3: 'This link will expire in 24 hours',
          text4: 'If you did not request this, please ignore this email',
        },
      });
    });

    it('should handle different frontend domain for password reset', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'app.frontendDomain': 'https://prod.example.com',
          'app.name': 'Production App',
        };
        return config[key];
      });
      mockMailerService.sendMail.mockResolvedValue(true);

      await service.forgotPassword(mailData);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'https://prod.example.com/password-change/reset-hash-789 Reset Password',
          context: expect.objectContaining({
            url: 'https://prod.example.com/password-change/reset-hash-789',
            app_name: 'Production App',
          }),
        }),
      );
    });

    it('should handle different reset hash values', async () => {
      const differentMailData = {
        ...mailData,
        data: { hash: 'new-reset-hash-999' },
      };
      mockMailerService.sendMail.mockResolvedValue(true);

      await service.forgotPassword(differentMailData);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'https://example.com/password-change/new-reset-hash-999 Reset Password',
          context: expect.objectContaining({
            url: 'https://example.com/password-change/new-reset-hash-999',
          }),
        }),
      );
    });

    it('should handle different email addresses for password reset', async () => {
      const differentMailData = {
        ...mailData,
        to: 'another@example.com',
      };
      mockMailerService.sendMail.mockResolvedValue(true);

      await service.forgotPassword(differentMailData);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'another@example.com',
        }),
      );
    });

    it('should log success message when password reset email is sent successfully', async () => {
      mockMailerService.sendMail.mockResolvedValue(true);
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      await service.forgotPassword(mailData);

      expect(logSpy).toHaveBeenCalledWith(
        'Password reset email sent successfully to user@example.com',
      );

      logSpy.mockRestore();
    });

    it('should log error and rethrow when password reset email fails', async () => {
      const error = new Error('Template not found');
      mockMailerService.sendMail.mockRejectedValue(error);
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(service.forgotPassword(mailData)).rejects.toThrow(
        'Template not found',
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send password reset email to user@example.com',
        error.stack,
      );

      errorSpy.mockRestore();
    });

    it('should handle network errors during password reset', async () => {
      const error = new Error('Network timeout');
      mockMailerService.sendMail.mockRejectedValue(error);
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await expect(service.forgotPassword(mailData)).rejects.toThrow(
        'Network timeout',
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send password reset email to user@example.com',
        error.stack,
      );

      errorSpy.mockRestore();
    });
  });

  describe('configuration edge cases', () => {
    it('should handle missing frontend domain configuration', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.frontendDomain') return undefined;
        if (key === 'app.name') return 'Test App';
        return undefined;
      });
      mockMailerService.sendMail.mockResolvedValue(true);

      const mailData: MailData<{ hash: string }> = {
        to: 'test@example.com',
        data: { hash: 'test-hash' },
      };

      await service.userSignUp(mailData);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'undefined/confirm-email/test-hash Confirm email address',
          context: expect.objectContaining({
            url: 'undefined/confirm-email/test-hash',
          }),
        }),
      );
    });

    it('should handle missing app name configuration', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'app.frontendDomain') return 'https://example.com';
        if (key === 'app.name') return undefined;
        return undefined;
      });
      mockMailerService.sendMail.mockResolvedValue(true);

      const mailData: MailData<{ hash: string }> = {
        to: 'test@example.com',
        data: { hash: 'test-hash' },
      };

      await service.userSignUp(mailData);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            app_name: undefined,
          }),
        }),
      );
    });
  });
});
