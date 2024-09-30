import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { addressData } from './mock-data/address';
import { contactData } from './mock-data/contact';
import { userData } from './mock-data/user';

import { AppModule } from '@/app.module';
import validationOptions from '@/common/pipes/validation-options.pipe';
import { Address } from '@/modules/addresses/entities/address.entity';
import { Contact } from '@/modules/contacts/entities/contact.entity';
import { User } from '@/modules/users/entity/user.entity';
import { AddressErrorCodes } from '@/shared/utils/constants/addresses/errors';
import { ContactErrorCodes } from '@/shared/utils/constants/contacts/errors';

describe('AddressController (e2e)', () => {
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
    await Address.delete({ id: addressData.id });
    await Contact.delete({ id: contactData.id });
    await User.delete({ id: userData.id });
    contactData.id = undefined;
    userData.id = undefined;
    addressData.id = undefined;
    await app.close();
  });

  it('should get all address types with GET /api/contacts/addresses/address-types', () => {
    return request(app.getHttpServer())
      .get('/api/contacts/addresses/address-types')
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

  it('should create a new address for a contact with POST /api/contacts/addresses', () => {
    return request(app.getHttpServer())
      .post('/api/contacts/addresses')
      .send({ ...addressData, contact: { id: contactData.id } })
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.street).toBe(addressData.street);
        expect(body.city).toBe(addressData.city);
        expect(body.postal_code).toBe(addressData.postal_code);
        expect(typeof body.country).toBe('object');
        expect(body.country.id).toBe(addressData.country.id);
        expect(body.address_type.id).toBe(addressData.address_type.id);
        expect(body.contact.id).toBe(contactData.id);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        addressData.id = body.id;
      });
  });

  it('should not create a new address for a none existing contact with POST /api/contacts/addresses', () => {
    return request(app.getHttpServer())
      .post('/api/contacts/addresses')
      .send({ ...addressData, contact: { id: 0 } })
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

  it(`should get a contact address with GET /api/contacts/addresses/${addressData.id}`, () => {
    return request(app.getHttpServer())
      .get(`/api/contacts/addresses/${addressData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.street).toBe(addressData.street);
        expect(body.city).toBe(addressData.city);
        expect(body.postal_code).toBe(addressData.postal_code);
        expect(typeof body.country).toBe('object');
        expect(body.country.id).toBe(addressData.country.id);
        expect(typeof body.address_type).toBe('object');
        expect(body.address_type.id).toBe(addressData.address_type.id);
        expect(typeof body.address_type.name).toBe('string');
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it('should not get a address from a none existing contact with GET /api/contacts/addresses/0', () => {
    return request(app.getHttpServer())
      .get('/api/contacts/addresses/0')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body).toHaveProperty('errors');
        expect(body.errors).toHaveProperty('address');
        expect(body.errors.address).toBe(AddressErrorCodes.NOT_FOUND);
      });
  });

  it(`should update a contact address with PATCH /api/contacts/addresses/${addressData.id}`, () => {
    const address = {
      country: { id: 85 },
      address_type: 2,
    };
    return request(app.getHttpServer())
      .patch(`/api/contacts/addresses/${addressData.id}`)
      .send(address)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.street).toBe(addressData.street);
        expect(body.city).toBe(addressData.city);
        expect(body.postal_code).toBe(addressData.postal_code);
        expect(typeof body.country).toBe('object');
        expect(body.country.id).toBe(address.country.id);
        expect(typeof body.address_type).toBe('object');
        expect(body.address_type.id).toBe(address.address_type);
        expect(typeof body.address_type.name).toBe('string');
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it(`should remove a contact address with DELETE /api/contacts/addresses/${addressData.id}`, () => {
    return request(app.getHttpServer())
      .delete(`/api/contacts/addresses/${addressData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });
});
