import { AppModule } from '@contactApp/app.module';
import { FileEntity } from '@contactApp/modules/files/entities/file.entity';
import { User } from '@contactApp/modules/users/entity/user.entity';
import { FilesErrorCodes } from '@contactApp/shared/utils/constants/files/errors';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { userData } from './mock-data/user';

describe('FileController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let token;
  let file;

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
    await FileEntity.delete({ id: file.id });
    await User.delete({ id: userData.id });
    userData.id = undefined;
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
