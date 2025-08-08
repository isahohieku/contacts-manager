import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { AppModule } from '@contactApp/app.module';
import { MailService } from '@contactApp/modules/mail/mail.service';
import { User } from '@contactApp/modules/users/entity/user.entity';

import {
  createTestUserData,
  createMockMailerService,
  TestDatabaseCleaner,
} from './utils/test-data-factory';

process.env.FILE_DRIVER = 's3';

describe.skip('FileStorageService (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let token;
  let userData: any;

  beforeEach(async () => {
    // Generate unique test data for this test suite
    userData = createTestUserData('FileStorageService');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [ConfigService],
    })
      .overrideProvider(MailService)
      .useValue(createMockMailerService())
      .compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);

    app.setGlobalPrefix('api', {
      exclude: ['/'],
    });
    await app.init();
    if (!token) {
      const user = await User.save(userData);
      userData.id = user.id;
      TestDatabaseCleaner.addUser(user.id);
    }
    const authSecret = configService.get<string>('auth.secret');
    if (!authSecret) {
      throw new Error('Auth secret not configured');
    }
    token = jwt.sign(userData, authSecret);
  });

  afterAll(async () => {
    await TestDatabaseCleaner.cleanupAll();
    await app.close();
  });

  it('should throw a 404 error if file to be deleted is not found with DELETE /api/files/remove', async () => {
    return request(app.getHttpServer())
      .delete('/api/files/remove/00000000-0000-0000-0000-000000000000')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND);
  });
});
