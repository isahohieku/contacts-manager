import jwt from 'jsonwebtoken';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { Contact } from '../src/contacts/entities/contact.entity';
import { Email } from '../src/emails/entities/email.entity';
import { userData } from './mock-data/user';
import { contactData } from './mock-data/contact';
import { emailData } from './mock-data/email';
import { User } from '../src/users/entity/user.entity';
import { ContactErrorCodes } from '../src/utils/constants/contacts/errors';
import { EmailErrorCodes } from '../src/utils/constants/emails/errors';
import validationOptions from '../src/utils/validation-options';

describe('EmailController (e2e)', () => {
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
    await Email.delete({ id: emailData.id });
    await Contact.delete({ id: contactData.id });
    await User.delete({ id: userData.id });
    emailData.id = undefined;
    contactData.id = undefined;
    userData.id = undefined;
    await app.close();
  });

  it('should get all email types with GET /api/contacts/emails/email-types', () => {
    return request(app.getHttpServer())
      .get('/api/contacts/emails/email-types')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        const firstItem = body[0];
        expect(typeof firstItem).toBe('object');
        expect(firstItem).toHaveProperty('__entity');
        expect(typeof firstItem.id).toBe('number');
        expect(typeof firstItem.name).toBe('string');
      });
  });

  it('should create a new email for a contact with POST /api/contacts/emails', () => {
    return request(app.getHttpServer())
      .post('/api/contacts/emails')
      .send({ ...emailData, contact: { id: contactData.id } })
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.email_address).toBe(emailData.email_address);
        expect(typeof body.email_type).toBe('object');
        expect(body.email_type.id).toBe(emailData.email_type.id);
        expect(body.contact.id).toBe(contactData.id);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        emailData.id = body.id;
      });
  });

  it('should not create a new email for a none existing contact with POST /api/contacts/emails', () => {
    return request(app.getHttpServer())
      .post('/api/contacts/emails')
      .send({ ...emailData, contact: { id: 0 } })
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

  it('should not create a new email for contact if the email already exists on the contact with POST /api/contacts/emails', () => {
    return request(app.getHttpServer())
      .post('/api/contacts/emails')
      .send({ ...emailData })
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('email_address');
        expect(body.errors.email_address).toBe(EmailErrorCodes.ALREADY_EXISTS);
      });
  });

  it(`should get a contact email with GET /api/contacts/emails/${emailData.id}`, () => {
    return request(app.getHttpServer())
      .get(`/api/contacts/emails/${emailData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.email_address).toBe(emailData.email_address);
        expect(typeof body.email_type).toBe('object');
        expect(body.email_type.id).toBe(emailData.email_type.id);
        expect(body.contact.id).toBe(contactData.id);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.id).toBe(emailData.id);
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it('should not get a email from a none existing contact with GET /api/contacts/emails/0', () => {
    return request(app.getHttpServer())
      .get('/api/contacts/emails/0')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('email');
        expect(body.errors.email).toBe(EmailErrorCodes.NOT_FOUND);
      });
  });

  it(`should update a contact email with PATCH /api/contacts/emails/${emailData.id}`, () => {
    const email = {
      email_type: 2,
    };
    return request(app.getHttpServer())
      .patch(`/api/contacts/emails/${emailData.id}`)
      .send(email)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.email_address).toBe(emailData.email_address);
        expect(typeof body.email_type).toBe('object');
        expect(body.email_type.id).toBe(email.email_type);
        expect(typeof body.email_type.name).toBe('string');
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it(`should remove a contact email with DELETE /api/contacts/emails/${emailData.id}`, () => {
    return request(app.getHttpServer())
      .delete(`/api/contacts/emails/${emailData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });
});
