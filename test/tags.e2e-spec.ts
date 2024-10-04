import { AppModule } from '@contactApp/app.module';
import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { Tag } from '@contactApp/modules/tags/entities/tag.entity';
import { User } from '@contactApp/modules/users/entity/user.entity';
import { ContactErrorCodes } from '@contactApp/shared/utils/constants/contacts/errors';
import { TagErrorCodes } from '@contactApp/shared/utils/constants/tags/errors';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { contactData } from './mock-data/contact';
import { tagData } from './mock-data/tag';
import { userData } from './mock-data/user';

describe('TagController (e2e)', () => {
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

    if (!contactData.id) {
      const contact = await Contact.save({
        ...contactData,
        owner: {
          id: userData.id,
        },
      });

      contactData.id = contact.id;
    }
  });

  afterAll(async () => {
    await Tag.delete({ id: tagData.id });
    await Contact.delete({ id: contactData.id });
    await User.delete({ id: userData.id });
    tagData.id = undefined;
    contactData.id = undefined;
    userData.id = undefined;
    await app.close();
  });

  it('should create a new tag with POST /api/tags', () => {
    return request(app.getHttpServer())
      .post('/api/tags')
      .send({ ...tagData })
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.name).toBe(tagData.name);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        tagData.id = body.id;
      });
  });

  it(`should not add tag to a none existing contact with POST /api/contacts/${contactData.id}`, () => {
    return request(app.getHttpServer())
      .patch(`/api/contacts/0`)
      .send({ tags: [{ id: tagData.id }] })
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('contact');
        expect(body.errors.contact).toBe(ContactErrorCodes.NOT_FOUND);
      });
  });

  it(`should get a tag with GET /api/tags/${tagData.id}`, () => {
    return request(app.getHttpServer())
      .get(`/api/tags/${tagData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.name).toBe(tagData.name);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.id).toBe(tagData.id);
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it(`should get all tags with GET /api/tags`, () => {
    return request(app.getHttpServer())
      .get(`/api/tags`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        const firstItem = body[0];
        expect(typeof firstItem).toBe('object');
        expect(typeof firstItem.id).toBe('number');
        expect(typeof firstItem.name).toBe('string');
        expect(firstItem.deletedAt).toBeNull();
        expect(typeof new Date(firstItem.createdAt).getTime()).toBe('number');
        expect(typeof new Date(firstItem.updatedAt).getTime()).toBe('number');
      });
  });

  it('should not get a none existing tag with GET /api/tags/0', () => {
    return request(app.getHttpServer())
      .get('/api/tags/0')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('tag');
        expect(body.errors.tag).toBe(TagErrorCodes.NOT_FOUND);
      });
  });

  it(`should update a contact tag with PATCH /api/tags/${tagData.id}`, () => {
    const tag = {
      name: 'Frienemy',
    };
    return request(app.getHttpServer())
      .patch(`/api/tags/${tagData.id}`)
      .send(tag)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.name).toBe(tag.name);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it(`should remove a contact tag with DELETE /api/tags/${tagData.id}`, () => {
    return request(app.getHttpServer())
      .delete(`/api/tags/${tagData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });
});
