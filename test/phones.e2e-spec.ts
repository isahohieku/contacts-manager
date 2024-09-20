import jwt from 'jsonwebtoken';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { Contact } from '../src/modules/contacts/entities/contact.entity';
import { Phone } from '../src/modules/phones/entities/phone.entity';
import { userData } from './mock-data/user';
import { contactData } from './mock-data/contact';
import { phoneData } from './mock-data/phone';
import { User } from '../src/modules/users/entity/user.entity';
import { ContactErrorCodes } from '../src/shared/utils/constants/contacts/errors';
import { PhoneNumberErrorCodes } from '../src/shared/utils/constants/phone-numbers/errors';
import validationOptions from '../src/common/pipes/validation-options.pipe';

describe('PhoneController (e2e)', () => {
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
    await Phone.delete({ id: phoneData.id });
    await Contact.delete({ id: contactData.id });
    await User.delete({ id: userData.id });
    phoneData.id = undefined;
    contactData.id = undefined;
    userData.id = undefined;
    await app.close();
  });

  it('should get all phone number types with GET /api/contacts/phones/phone-types', () => {
    return request(app.getHttpServer())
      .get('/api/contacts/phones/phone-types')
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

  it('should create a new phone number for a contact with POST /api/contacts/phones?validatePhone=true', () => {
    return request(app.getHttpServer())
      .post('/api/contacts/phones?validatePhone=true')
      .send({ ...phoneData, contact: { id: contactData.id } })
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.phone_number).toBe(phoneData.phone_number);
        expect(typeof body.phone_type).toBe('object');
        expect(body.phone_type.id).toBe(phoneData.phone_type.id);
        expect(body.contact.id).toBe(contactData.id);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        phoneData.id = body.id;
      });
  });

  it('should not create a new phone number for a none existing contact with POST /api/contacts/phones', () => {
    return request(app.getHttpServer())
      .post('/api/contacts/phones')
      .send({ ...phoneData, contact: { id: 0 } })
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

  it('should not create a new phone number for a contact if number is invalid and validatePhone flag is true with POST /api/contacts/phones?validatePhone=true', () => {
    return request(app.getHttpServer())
      .post('/api/contacts/phones?validatePhone=true')
      .send({ ...phoneData, phone_number: '661937767', contact: { id: 0 } })
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('phone');
        expect(body.errors.phone).toBe(PhoneNumberErrorCodes.INVALID);
      });
  });

  it(`should get a contact phone number with GET /api/contacts/phones/${phoneData.id}`, () => {
    return request(app.getHttpServer())
      .get(`/api/contacts/phones/${phoneData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.phone_number).toBe(phoneData.phone_number);
        expect(typeof body.phone_type).toBe('object');
        expect(body.phone_type.id).toBe(phoneData.phone_type.id);
        expect(body.contact.id).toBe(contactData.id);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.id).toBe(phoneData.id);
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it('should not get a phone number from a none existing contact with GET /api/contacts/phones/0', () => {
    return request(app.getHttpServer())
      .get('/api/contacts/phones/0')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('phone');
        expect(body.errors.phone).toBe(PhoneNumberErrorCodes.NOT_FOUND);
      });
  });

  it(`should update a contact phone number with PATCH /api/contacts/phones/${phoneData.id}`, () => {
    const phone = {
      phone_number: '+2348036133001',
      phone_type: 3,
    };
    return request(app.getHttpServer())
      .patch(`/api/contacts/phones/${phoneData.id}`)
      .send(phone)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.phone_number).toBe(phone.phone_number);
        expect(typeof body.phone_type).toBe('object');
        expect(body.phone_type.id).toBe(phone.phone_type);
        expect(typeof body.phone_type.name).toBe('string');
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it(`should remove a contact phone number with DELETE /api/contacts/phones/${phoneData.id}`, () => {
    return request(app.getHttpServer())
      .delete(`/api/contacts/phones/${phoneData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });
});
