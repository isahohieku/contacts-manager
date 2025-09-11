/**
 * Test data factory for generating unique test data across test suites
 */

import { MailerService } from '@nestjs-modules/mailer';

import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { MailService } from '@contactApp/modules/mail/mail.service';
import { User } from '@contactApp/modules/users/entity/user.entity';

export interface TestUserData {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  country: { id: number };
  provider: { id: number };
  role: { id: number };
  status: { id: number };
}

export interface TestUserSignUpData extends TestUserData {
  password: string;
}

/**
 * Generates unique user data for testing
 * @param testSuiteName - Name of the test suite to ensure uniqueness
 * @returns Unique user data object
 */
export function createTestUserData(testSuiteName: string): TestUserData {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const uniqueEmail = `test-${testSuiteName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${randomSuffix}@test.com`;

  return {
    id: undefined,
    email: uniqueEmail,
    firstName: 'John',
    lastName: 'Doe',
    country: { id: 162 },
    provider: { id: 1 },
    role: { id: 2 },
    status: { id: 2 },
  };
}

/**
 * Generates unique user signup data for testing
 * @param testSuiteName - Name of the test suite to ensure uniqueness
 * @returns Unique user signup data object
 */
export function createTestUserSignUpData(
  testSuiteName: string,
): TestUserSignUpData {
  return {
    ...createTestUserData(testSuiteName),
    password: 'testPassword123',
  };
}

/**
 * Generates unique contact data for testing
 * @param testSuiteName - Name of the test suite to ensure uniqueness
 * @returns Unique contact data object
 */
export function createTestContactData(testSuiteName: string): Partial<{
  id: number | undefined;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  user: User;
}> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return {
    id: undefined as number | undefined,
    firstName: `Contact-${testSuiteName}`,
    lastName: `Test-${timestamp}`,
    company: `Test Company ${randomSuffix}`,
    jobTitle: 'Test Position',
    user: undefined as unknown as User,
  };
}

/**
 * Generates unique email data for testing
 * @param testSuiteName - Name of the test suite to ensure uniqueness
 * @returns Unique email data object
 */
export function createTestEmailData(testSuiteName: string): Partial<{
  id: number | undefined;
  email_address: string;
  email_type: { id: number };
  contact: Contact;
}> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return {
    id: undefined as number | undefined,
    email_address: `email-${testSuiteName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${randomSuffix}@test.com`,
    email_type: { id: 1 },
    contact: undefined as unknown as Contact,
  };
}

/**
 * Creates a mock mailer service for testing
 * This can be used to mock the MailerService in tests
 */
export const createMockMailerService = (): Partial<MailerService> => ({
  sendMail: jest.fn().mockResolvedValue(true),
});

/**
 * Creates a mock mail service for testing
 * This can be used to mock the MailService in tests
 */
export const createMockMailService = (): Partial<MailService> => ({
  userSignUp: jest.fn().mockResolvedValue(true),
  forgotPassword: jest.fn().mockResolvedValue(true),
});

/**
 * Database cleanup utility for tests
 */
export class TestDatabaseCleaner {
  private static createdUsers: number[] = [];
  private static createdContacts: number[] = [];
  private static createdEmails: number[] = [];
  private static createdFiles: number[] = [];

  static addUser(userId: number): void {
    if (userId && !this.createdUsers.includes(userId)) {
      this.createdUsers.push(userId);
    }
  }

  static addContact(contactId: number): void {
    if (contactId && !this.createdContacts.includes(contactId)) {
      this.createdContacts.push(contactId);
    }
  }

  static addEmail(emailId: number): void {
    if (emailId && !this.createdEmails.includes(emailId)) {
      this.createdEmails.push(emailId);
    }
  }

  static addFile(fileId: number): void {
    if (fileId && !this.createdFiles.includes(fileId)) {
      this.createdFiles.push(fileId);
    }
  }

  static async cleanupAll(): Promise<void> {
    const { User } = await import(
      '@contactApp/modules/users/entity/user.entity'
    );
    const { Contact } = await import(
      '@contactApp/modules/contacts/entities/contact.entity'
    );
    const { Email } = await import(
      '@contactApp/modules/emails/entities/email.entity'
    );
    const { FileEntity } = await import(
      '@contactApp/modules/files/entities/file.entity'
    );
    const { Forgot } = await import(
      '@contactApp/modules/forgot/entities/forgot.entity'
    );

    try {
      // Clean up in reverse dependency order
      if (this.createdFiles.length > 0) {
        await FileEntity.delete(this.createdFiles);
        this.createdFiles = [];
      }

      if (this.createdEmails.length > 0) {
        await Email.delete(this.createdEmails);
        this.createdEmails = [];
      }

      if (this.createdContacts.length > 0) {
        await Contact.delete(this.createdContacts);
        this.createdContacts = [];
      }

      if (this.createdUsers.length > 0) {
        // Clean up forgot password records first
        await Forgot.delete({ user: { id: this.createdUsers[0] } });
        await User.delete(this.createdUsers);
        this.createdUsers = [];
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error during test cleanup:', error);
    }
  }

  static reset(): void {
    this.createdUsers = [];
    this.createdContacts = [];
    this.createdEmails = [];
    this.createdFiles = [];
  }
}
