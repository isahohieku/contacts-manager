import jwt from 'jsonwebtoken';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { Contact } from '../src/contacts/entities/contact.entity';
import { userData } from './mock-data/user';
import { contactData } from './mock-data/contact';
import { ContactErrorCodes } from '../src/utils/constants/contacts/errors';
import { User } from '../src/users/entity/user.entity';
import { Tag } from '../src/tags/entities/tag.entity';
import { tagData } from './mock-data/tag';
import validationOptions from '../src/utils/validation-options';

describe('ContactController (e2e)', () => {
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
    app.useGlobalPipes(new ValidationPipe(validationOptions));
    await app.init();
    if (!token) {
      const user = await User.save(userData);
      const tag = await Tag.save(Tag.create({ ...tagData, owner: user }));
      tagData.id = tag.id;
      userData.id = user.id;
    }
    token = jwt.sign(userData, configService.get('auth.secret'));
  });

  afterAll(async () => {
    await Contact.delete({ id: contactData.id });
    await Tag.delete({ id: tagData.id });
    await User.delete({ id: userData.id });
    contactData.id = undefined;
    tagData.id = undefined;
    userData.id = undefined;
    await app.close();
  });

  it('should return an empty array if user has 0 contacts with GET /api/contacts', () => {
    return request(app.getHttpServer())
      .get('/api/contacts?page=1&limit=10')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('metadata');
        const { data, metadata } = body;
        expect(Array.isArray(data)).toBeTruthy();

        const firstItem = data[0];
        expect(firstItem).toBeUndefined();
        // Test metadata
        expect(metadata.page).toBeUndefined();
        expect(metadata.items_per_page).toBeUndefined();
        expect(typeof metadata.total_items).toBe('number');
        expect(metadata.total_items).toBe(0);
        expect(metadata.total_pages).toBeUndefined();
        expect(typeof metadata.hasNextPage).toBe('boolean');
      });
  });

  it('should create a new contact with POST /api/contacts', () => {
    return request(app.getHttpServer())
      .post('/api/contacts')
      .send(contactData)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.firstName).toBe(contactData.firstName);
        expect(body.lastName).toBe(contactData.lastName);
        expect(body.organization).toBe(contactData.organization);
        expect(body.job_title).toBe(contactData.job_title);
        expect(typeof new Date(body.birthday).getTime()).toBe('number');
        expect(typeof new Date(body.anniversary).getTime()).toBe('number');
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        contactData.id = body.id;
      });
  });

  it('should get all user contacts with GET /api/contacts', () => {
    return request(app.getHttpServer())
      .get('/api/contacts')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('metadata');
        const { data, metadata } = body;
        expect(Array.isArray(data)).toBeTruthy();

        const firstItem = data[0];
        expect(typeof firstItem).toBe('object');
        expect(firstItem.firstName).toBe(contactData.firstName);
        expect(firstItem.lastName).toBe(contactData.lastName);
        expect(firstItem.organization).toBe(contactData.organization);
        expect(firstItem.job_title).toBe(contactData.job_title);
        expect(typeof new Date(firstItem.birthday).getTime()).toBe('number');
        expect(typeof new Date(firstItem.anniversary).getTime()).toBe('number');
        expect(firstItem).toHaveProperty('id');
        expect(typeof firstItem.id).toBe('number');
        expect(firstItem.deletedAt).toBeNull();
        expect(typeof new Date(firstItem.createdAt).getTime()).toBe('number');
        expect(typeof new Date(firstItem.updatedAt).getTime()).toBe('number');
        // Test metadata
        expect(typeof metadata.page).toBe('number');
        expect(typeof metadata.items_per_page).toBe('number');
        expect(typeof metadata.total_items).toBe('number');
        expect(typeof metadata.total_pages).toBe('number');
        expect(typeof metadata.hasNextPage).toBe('boolean');
      });
  });

  it(`should not get over 50 user's contacts if limit is over 50 with GET /api/contacts?page=1&limit=100`, () => {
    return request(app.getHttpServer())
      .get('/api/contacts?page=1&limit=100')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(body).toHaveProperty('metadata');
        const { metadata } = body;
        // Test metadata
        expect(metadata.items_per_page).toBe(50);
      });
  });

  it('should not get a none existing user contact with GET /api/contacts/0', () => {
    return request(app.getHttpServer())
      .get('/api/contacts/0')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(({ body }) => {
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body.errors.contact).toBe(ContactErrorCodes.NOT_FOUND);
      });
  });

  it(`should get a user's contact with GET /api/contacts/${contactData.id}`, () => {
    return request(app.getHttpServer())
      .get(`/api/contacts/${contactData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.firstName).toBe(contactData.firstName);
        expect(body.lastName).toBe(contactData.lastName);
        expect(body.organization).toBe(contactData.organization);
        expect(body.job_title).toBe(contactData.job_title);
        expect(typeof new Date(body.birthday).getTime()).toBe('number');
        expect(typeof new Date(body.anniversary).getTime()).toBe('number');
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        contactData.id = body.id;
      });
  });

  it(`should get user's contacts searched by name with GET /api/contacts?search=xxxx`, () => {
    return request(app.getHttpServer())
      .get(`/api/contacts?search=${contactData.firstName.substring(0, 3)}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('metadata');
        const { data, metadata } = body;
        expect(Array.isArray(data)).toBeTruthy();

        const firstItem = data[0];
        expect(typeof firstItem).toBe('object');
        expect(firstItem.firstName).toBe(contactData.firstName);
        expect(firstItem.lastName).toBe(contactData.lastName);
        expect(firstItem.organization).toBe(contactData.organization);
        expect(firstItem.job_title).toBe(contactData.job_title);
        expect(typeof new Date(firstItem.birthday).getTime()).toBe('number');
        expect(typeof new Date(firstItem.anniversary).getTime()).toBe('number');
        expect(firstItem).toHaveProperty('id');
        expect(typeof firstItem.id).toBe('number');
        expect(firstItem.deletedAt).toBeNull();
        expect(typeof new Date(firstItem.createdAt).getTime()).toBe('number');
        expect(typeof new Date(firstItem.updatedAt).getTime()).toBe('number');
        // Test metadata
        expect(typeof metadata.page).toBe('number');
        expect(typeof metadata.items_per_page).toBe('number');
        expect(typeof metadata.total_items).toBe('number');
        expect(typeof metadata.total_pages).toBe('number');
        expect(typeof metadata.hasNextPage).toBe('boolean');
      });
  });

  it(`should get user's contacts searched by name with GET /api/contacts?search=xxxx&type=contact`, () => {
    return request(app.getHttpServer())
      .get(
        `/api/contacts?search=${contactData.firstName.substring(0, 3)}&type=contact`,
      )
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('metadata');
        const { data, metadata } = body;
        expect(Array.isArray(data)).toBeTruthy();

        const firstItem = data[0];
        expect(typeof firstItem).toBe('object');
        expect(firstItem.firstName).toBe(contactData.firstName);
        expect(firstItem.lastName).toBe(contactData.lastName);
        expect(firstItem.organization).toBe(contactData.organization);
        expect(firstItem.job_title).toBe(contactData.job_title);
        expect(typeof new Date(firstItem.birthday).getTime()).toBe('number');
        expect(typeof new Date(firstItem.anniversary).getTime()).toBe('number');
        expect(firstItem).toHaveProperty('id');
        expect(typeof firstItem.id).toBe('number');
        expect(firstItem.deletedAt).toBeNull();
        expect(typeof new Date(firstItem.createdAt).getTime()).toBe('number');
        expect(typeof new Date(firstItem.updatedAt).getTime()).toBe('number');
        // Test metadata
        expect(typeof metadata.page).toBe('number');
        expect(typeof metadata.items_per_page).toBe('number');
        expect(typeof metadata.total_items).toBe('number');
        expect(typeof metadata.total_pages).toBe('number');
        expect(typeof metadata.hasNextPage).toBe('boolean');
      });
  });

  it(`should update a user's contact with PATCH /api/contacts/${contactData.id}`, () => {
    const contact = {
      firstName: 'Jin',
      lastName: 'Kazama',
      organization: 'Tekken',
    };
    return request(app.getHttpServer())
      .patch(`/api/contacts/${contactData.id}`)
      .send(contact)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.firstName).toBe(contact.firstName);
        expect(body.lastName).toBe(contact.lastName);
        expect(body.organization).toBe(contact.organization);
        expect(body.job_title).toBe(contactData.job_title);
        expect(typeof new Date(body.birthday).getTime()).toBe('number');
        expect(typeof new Date(body.anniversary).getTime()).toBe('number');
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        contactData.id = body.id;
      });
  });

  it(`should update a user's contact tag with PATCH /api/contacts/${contactData.id}`, () => {
    const contact = {
      tags: [{ id: tagData.id }],
    };
    return request(app.getHttpServer())
      .patch(`/api/contacts/${contactData.id}`)
      .send(contact)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(Array.isArray(body.tags)).toBeTruthy();
        const tag = body.tags[0];
        expect(tag.name).toBe(tagData.name);
        expect(tag.id).toBe(tagData.id);
      });
  });

  it(`should export a user's contact with GET /api/contacts/export?id=${contactData.id}`, () => {
    return request(app.getHttpServer())
      .get(`/api/contacts/export?id=${contactData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });

  it("should export a user's contacts with GET /api/contacts/export", () => {
    return request(app.getHttpServer())
      .get('/api/contacts/export')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });

  it("should throw error if user tries to export a non-existing user's contacts with GET /api/contacts/export?id=-1", () => {
    return request(app.getHttpServer())
      .get('/api/contacts/export?id=-1')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .then(({ body }) => {
        expect(body.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(body.error).toBeTruthy();
        expect(body.errors.contact).toBe(
          ContactErrorCodes.CSV_GENERATION_FAILED,
        );
      });
  });

  it(`should remove a user's contact with DELETE /api/contacts/${contactData.id}`, () => {
    return request(app.getHttpServer())
      .delete(`/api/contacts/${contactData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });
});
