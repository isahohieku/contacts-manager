import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { userData } from './mock-data/user';

import { AppModule } from '@/app.module';
import { User } from '@/modules/users/entity/user.entity';

process.env.FILE_DRIVER = 's3';

describe('FileStorageService (e2e)', () => {
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

  it('should throw a 404 error if file to be deleted is not found with DELETE /api/files/remove', async () => {
    return request(app.getHttpServer())
      .delete('/api/files/remove/00000000-0000-0000-0000-000000000000')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND);
  });
});
