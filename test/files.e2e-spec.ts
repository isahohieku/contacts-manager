import jwt from 'jsonwebtoken';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { userData } from './mock-data/user';
import { User } from '../src/users/entity/user.entity';
import { FilesErrorCodes } from '../src/utils/constants/files/errors';

// TODO: Write test for s3

describe('FileController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let token;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [ConfigService],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);

    app.setGlobalPrefix('api', {
      exclude: ['/'],
    });
    await app.init();
    if (!token) {
      const user = await User.save(userData);
      userData.id = user.id;
    }
    token = jwt.sign(userData, configService.get('auth.secret'));
  });

  afterAll(async () => {
    await User.delete({ id: userData.id });
    userData.id = undefined;
    await app.close();
  });

  it('should store a valid image successfully with POST /api/files/upload', () => {
    return request(app.getHttpServer())
      .post('/api/files/upload')
      .attach('file', 'test/mock-data/file.jpg')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body).toHaveProperty('path');
        expect(typeof body.path).toBe('string');
      });
  });

  it('should not store if an invalid image was sent with POST /api/files/upload', () => {
    const buffer = Buffer.from('invalid data');

    return request(app.getHttpServer())
      .post('/api/files/upload')
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

  it('should return error if no image was sent with POST /api/files/upload', () => {
    return request(app.getHttpServer())
      .post('/api/files/upload')
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
});