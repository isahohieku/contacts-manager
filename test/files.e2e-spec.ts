import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { AppModule } from '@contactApp/app.module';
import { FileEntity } from '@contactApp/modules/files/entities/file.entity';
import { MailService } from '@contactApp/modules/mail/mail.service';
import { User } from '@contactApp/modules/users/entity/user.entity';
import { FilesErrorCodes } from '@contactApp/shared/utils/constants/files/errors';

import {
  createTestUserData,
  createMockMailerService,
  TestDatabaseCleaner,
} from './utils/test-data-factory';

describe.skip('FileController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let token;
  let file;
  let userData: any;

  beforeEach(async () => {
    // Generate unique test data for this test suite
    userData = createTestUserData('FileController');

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
    if (file?.id) {
      TestDatabaseCleaner.addFile(file.id);
    }
    await TestDatabaseCleaner.cleanupAll();
    await app.close();
  });

  it('should store a valid image successfully with POST /api/files/upload?type=image', () => {
    return request(app.getHttpServer())
      .post('/api/files/upload?type=image')
      .attach('file', 'test/mock-data/file.jpg')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body).toHaveProperty('path');
        expect(typeof body.path).toBe('string');
        file = body;
      });
  });

  it('should not store if an invalid image was sent with POST /api/files/upload?type=image', () => {
    const buffer = Buffer.from('invalid data');

    return request(app.getHttpServer())
      .post('/api/files/upload?type=image')
      .attach('file', buffer, 'file.invalid')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('file');
        expect(body.errors.file).toBe(FilesErrorCodes.INVALID_FILE_TYPE);
      });
  });

  it('should get a file with GET /api/files/filename', () => {
    const fileUrl = `/api/files/${file.path.split('/').pop()}`;
    return request(app.getHttpServer())
      .get(fileUrl)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });

  it('should not get a file that does not exist with GET /api/files/filename', () => {
    const fileUrl = '/api/files/unknown.jpg';
    return request(app.getHttpServer())
      .get(fileUrl)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should return error if no image was sent with POST /api/files/upload?type=image', () => {
    return request(app.getHttpServer())
      .post('/api/files/upload?type=image')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('file');
        expect(body.errors.file).toBe(FilesErrorCodes.NO_FILE);
      });
  });

  it("should remove a file with DELETE /api/files/remove/${'id'}", () => {
    return request(app.getHttpServer())
      .delete(`/api/files/remove/${file.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });
});
