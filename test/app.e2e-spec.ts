import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { MailService } from '@contactApp/modules/mail/mail.service';

import { TestAppModule } from './utils/test-app.module';
import { createMockMailService } from './utils/test-data-factory';

describe('App Controller (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideProvider(MailService)
      .useValue(createMockMailService())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404 for GET /', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });
});
