import { AppModule } from '@contactApp/app.module';
import { SerializerInterceptor } from '@contactApp/common/interceptors/serializer.interceptor';
import validationOptions from '@contactApp/common/pipes/validation-options.pipe';
import { User } from '@contactApp/modules/users/entity/user.entity';
import { UserErrorCodes } from '@contactApp/shared/utils/constants/users/errors';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { userData, userSignUpDetails } from './mock-data/admin-user';
import { userData as normalUser, password } from './mock-data/user';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let token;
  let normalUserDbData = null;

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
    app.useGlobalInterceptors(new SerializerInterceptor());
    app.useGlobalPipes(new ValidationPipe(validationOptions));
    await app.init();
    if (!token) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(userSignUpDetails.password, salt);
      // Create admin user
      const user = await User.save({
        ...userData,
        password,
      });
      userData.id = user.id;
    }
    token = jwt.sign(userData, configService.get('auth.secret'));
  });

  afterAll(async () => {
    await User.delete({ id: userData.id });
    await User.delete({ id: normalUserDbData.id });
    userData.id = undefined;
    normalUser.id = undefined;
    await app.close();
  });

  it('should log admin user in with POST /api/auth/admin/login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({
        email: userSignUpDetails.email,
        password: userSignUpDetails.password,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body).toHaveProperty('token');
        const { user } = body;
        expect(user.email).toBe(userSignUpDetails.email);
        expect(user.firstName).toBe(userSignUpDetails.firstName);
        expect(user.lastName).toBe(userSignUpDetails.lastName);
        const { role, status, provider } = user;
        expect(typeof role).toBe('object');
        expect(role.id).toBe(1);
        expect(typeof status).toBe('object');
        expect(status.id).toBe(1);
        expect(typeof new Date(user.createdAt).getTime()).toBe('number');
        expect(typeof new Date(user.updatedAt).getTime()).toBe('number');
        expect(user.deletedAt).toBeNull();
        expect(typeof user.id).toBe('number');
        expect(typeof provider).toBe('object');
        expect(provider.id).toBe(1);
      });
  });

  it('should create a new user with POST /api/users', () => {
    const payload = { ...normalUser, password };
    return request(app.getHttpServer())
      .post('/api/users')
      .send(payload)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.firstName).toBe(normalUser.firstName);
        expect(body.lastName).toBe(normalUser.lastName);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        expect(typeof body.provider).toBe('object');
        expect(body.provider.id).toBe(1);
        normalUserDbData = body;
      });
  });

  it('should get all users with GET /api/users', () => {
    return request(app.getHttpServer())
      .get('/api/users')
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

  it('should return an empty array if page or limit is equals or less than 0 when getting all users with GET /api/users', () => {
    return request(app.getHttpServer())
      .get('/api/users?page=0&limit=-1')
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

  it(`should not get over 50 users if limit is over 50 with GET /api/users?page=1&limit=100`, () => {
    return request(app.getHttpServer())
      .get('/api/users?page=1&limit=100')
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

  it('should not get a none existing user with GET /api/users/0', () => {
    return request(app.getHttpServer())
      .get('/api/users/0')
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(({ body }) => {
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body.errors.user).toBe(UserErrorCodes.NOT_FOUND);
      });
  });

  it(`should get a user with GET /api/users/${normalUserDbData?.id} - `, () => {
    return request(app.getHttpServer())
      .get(`/api/users/${normalUserDbData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.firstName).toBe(normalUserDbData.firstName);
        expect(body.lastName).toBe(normalUserDbData.lastName);
        expect(typeof new Date(body.birthday).getTime()).toBe('number');
        expect(typeof new Date(body.anniversary).getTime()).toBe('number');
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it('should not allow none admin user to fetch another user with GET /api/users/0', () => {
    const normalUserToken = jwt.sign(
      normalUserDbData,
      configService.get('auth.secret'),
    );
    return request(app.getHttpServer())
      .get('/api/users/0')
      .set({
        Authorization: `Bearer ${normalUserToken}`,
      })
      .expect(HttpStatus.FORBIDDEN)
      .then(({ body }) => {
        expect(body.status).toBe(HttpStatus.FORBIDDEN);
        expect(body.errors.user).toBe(UserErrorCodes.FORBIDDEN_RESOURCE);
      });
  });

  it('should not log user into admin route if user is not admin with POST /api/auth/admin/login', async () => {
    await User.save({
      ...normalUserDbData,
      status: { id: 1 },
    });
    return request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({
        email: normalUser.email,
        password,
      })
      .expect(HttpStatus.FORBIDDEN)
      .then(({ body }) => {
        expect(body.status).toBe(HttpStatus.FORBIDDEN);
        expect(body.errors.user).toBe(UserErrorCodes.FORBIDDEN_RESOURCE);
      });
  });

  it(`should update a user with PATCH /api/users/${normalUserDbData?.id}`, () => {
    const user = {
      firstName: 'Jin',
      lastName: 'Kazama',
    };
    return request(app.getHttpServer())
      .patch(`/api/users/${normalUserDbData.id}`)
      .send(user)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.firstName).toBe(user.firstName);
        expect(body.lastName).toBe(user.lastName);
        expect(body).toHaveProperty('id');
        expect(typeof body.id).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
      });
  });

  it('should not update a none existing user with GET /api/users/0', () => {
    const user = {
      firstName: 'Jin',
      lastName: 'Kazama',
    };
    return request(app.getHttpServer())
      .patch('/api/users/0')
      .send(user)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(body.errors.user).toBe(UserErrorCodes.NOT_FOUND);
      });
  });

  it(`should remove a user with DELETE /api/users/${normalUserDbData?.id}`, () => {
    return request(app.getHttpServer())
      .delete(`/api/users/${normalUserDbData.id}`)
      .set({
        Authorization: `Bearer ${token}`,
      })
      .expect(HttpStatus.OK);
  });
});
