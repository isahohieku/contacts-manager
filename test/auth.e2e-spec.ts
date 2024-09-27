import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/modules/users/entity/user.entity';
import { Forgot } from '../src/modules/forgot/entities/forgot.entity';
import { userSignUpDetails } from './mock-data/user';
import { SerializerInterceptor } from '../src/common/interceptors/serializer.interceptor';
import validationOptions from '../src/common/pipes/validation-options.pipe';
import { UserErrorCodes } from '../src/shared/utils/constants/users/errors';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userDbData = null;
  let loggedInUser = null;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: ['/'],
    });
    app.useGlobalInterceptors(new SerializerInterceptor());
    app.useGlobalPipes(new ValidationPipe(validationOptions));
    await app.init();
  });

  afterAll(async () => {
    await Forgot.delete({ user: { id: userDbData.id } });
    await User.delete({ id: userDbData.id });
    await app.close();
  });

  it('should get all active auth providers with GET /api/auth/providers', () => {
    return request(app.getHttpServer())
      .get('/api/auth/providers')
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
      });
  });

  it('should create a new user account with POST /api/auth/register', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userSignUpDetails)
      .expect(HttpStatus.CREATED)
      .then(async ({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.email).toBe(userSignUpDetails.email);
        expect(body.firstName).toBe(userSignUpDetails.firstName);
        expect(body.lastName).toBe(userSignUpDetails.lastName);
        const { role, status, provider } = body;
        expect(typeof role).toBe('object');
        expect(role.id).toBe(2);
        expect(typeof status).toBe('object');
        expect(status.id).toBe(2);
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof body.id).toBe('number');
        expect(typeof provider).toBe('object');
        expect(provider.id).toBe(1);
        userDbData = body;
      });
  });

  it('should not create a new user account if email address already exist with POST /api/auth/register', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userSignUpDetails)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(async ({ body }) => {
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(body.errors).toHaveProperty('email');
      });
  });

  it('should not log user in if user has not confirmed account with POST /api/auth/login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userSignUpDetails.email,
        password: userSignUpDetails.password,
      })
      .expect(HttpStatus.UNAUTHORIZED)
      .then(async ({ body }) => {
        expect(body.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(body.message).toBe('Please verify your email address');
      });
  });

  it('should verify user account with POST /api/auth/email/confirm', async () => {
    const user = await User.findOne({
      where: {
        id: userDbData.id,
      },
    });
    return request(app.getHttpServer())
      .post('/api/auth/email/confirm')
      .send({
        hash: user.hash,
      })
      .expect(HttpStatus.OK);
  });

  it('should return error if verification hash is not found with POST /api/auth/email/confirm', () => {
    return request(app.getHttpServer())
      .post('/api/auth/email/confirm')
      .send({
        hash: 'non-existing-hash',
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(async ({ body }) => {
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body.error).toBeTruthy();
        expect(body.errors.hash).toBe(UserErrorCodes.HASH_NOT_FOUND);
      });
  });

  it('should log user in with POST /api/auth/login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userSignUpDetails.email,
        password: userSignUpDetails.password,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        loggedInUser = body;
        expect(typeof body).toBe('object');
        expect(body).toHaveProperty('token');
        const { user } = body;
        expect(user.email).toBe(userSignUpDetails.email);
        expect(user.firstName).toBe(userSignUpDetails.firstName);
        expect(user.lastName).toBe(userSignUpDetails.lastName);
        const { role, status, provider } = user;
        expect(typeof role).toBe('object');
        expect(role.id).toBe(2);
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

  it('should not log user in if email is missing in payload with POST /api/auth/login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        password: userSignUpDetails.password,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(typeof body.errors).toBe('object');
        expect(body.error).toBeTruthy();
      });
  });

  it('should not log user in if user with email does not exist with POST /api/auth/login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'jake@email.com',
        password: userSignUpDetails.password,
      })
      .expect(HttpStatus.NOT_FOUND)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(typeof body.errors).toBe('object');
        expect(body.error).toBeTruthy();
        expect(body.errors.user).toBe(UserErrorCodes.NOT_FOUND);
      });
  });

  it('should not log user in if user entered wrong password with POST /api/auth/login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userSignUpDetails.email,
        password: 'wrong-password',
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(typeof body.errors).toBe('object');
        expect(body.errors.password).toBe(UserErrorCodes.INCORRECT_PASSWORD);
      });
  });

  it('should return error if user email for password recovery is not found with POST /api/auth/forgot/password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/forgot/password')
      .send({
        email: 'jake.doe@email.com',
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(typeof body.errors).toBe('object');
        expect(body.errors).toHaveProperty('email');
      });
  });

  it('should initiate user password recovery with POST /api/auth/forgot/password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/forgot/password')
      .send({
        email: userSignUpDetails.email,
      })
      .expect(HttpStatus.OK);
  });

  it('should reset user password with POST /api/auth/reset/password', async () => {
    const userForgotPassword = await Forgot.findOne({
      where: {
        user: {
          id: userDbData.id,
        },
      },
    });

    return request(app.getHttpServer())
      .post('/api/auth/reset/password')
      .send({
        password: userSignUpDetails.password,
        hash: userForgotPassword.hash,
      })
      .expect(HttpStatus.OK);
  });

  it('should return error if hash for resetting user password is not found with POST /api/auth/reset/password', async () => {
    return request(app.getHttpServer())
      .post('/api/auth/reset/password')
      .send({
        password: userSignUpDetails.password,
        hash: 'not-existing-hash',
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(typeof body.errors).toBe('object');
        expect(body.errors.hash).toBe(UserErrorCodes.HASH_NOT_FOUND);
      });
  });

  it('should get logged in user details for GET /api/auth/me', () => {
    return request(app.getHttpServer())
      .get('/api/auth/me')
      .set({
        Authorization: `Bearer ${loggedInUser.token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(body.email).toBe(userSignUpDetails.email);
        expect(body.firstName).toBe(userSignUpDetails.firstName);
        expect(body.lastName).toBe(userSignUpDetails.lastName);
        const { role, status, provider } = body;
        expect(typeof role).toBe('object');
        expect(role.id).toBe(2);
        expect(typeof status).toBe('object');
        expect(status.id).toBe(1);
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof body.id).toBe('number');
        expect(typeof provider).toBe('object');
        expect(provider.id).toBe(1);
      });
  });

  it('should update user account data with PATCH /api/auth/me', () => {
    const firstName = 'Jake';
    return request(app.getHttpServer())
      .patch('/api/auth/me')
      .send({
        firstName,
      })
      .set({
        Authorization: `Bearer ${loggedInUser.token}`,
      })
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(body.firstName).toBe(firstName);
        expect(body.lastName).toBe(userSignUpDetails.lastName);
        const { role, status, provider } = body;
        expect(typeof role).toBe('object');
        expect(role.id).toBe(2);
        expect(typeof status).toBe('object');
        expect(status.id).toBe(1);
        expect(typeof new Date(body.createdAt).getTime()).toBe('number');
        expect(typeof new Date(body.updatedAt).getTime()).toBe('number');
        expect(body.deletedAt).toBeNull();
        expect(typeof body.id).toBe('number');
        expect(typeof provider).toBe('object');
        expect(provider.id).toBe(1);
        userSignUpDetails.firstName = firstName;
      });
  });

  it('should throw error if user changes password with incorrect old password with PATCH /api/auth/me', () => {
    const oldPassword = 'wrong-password';
    return request(app.getHttpServer())
      .patch('/api/auth/me')
      .send({
        oldPassword,
        password: userSignUpDetails.password,
      })
      .set({
        Authorization: `Bearer ${loggedInUser.token}`,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(typeof body.errors).toBe('object');
        expect(body.errors.oldPassword).toBe(UserErrorCodes.INCORRECT_PASSWORD);
      });
  });

  it('should throw error if user changes password but omitted old password with PATCH /api/auth/me', () => {
    return request(app.getHttpServer())
      .patch('/api/auth/me')
      .send({
        password: userSignUpDetails.password,
      })
      .set({
        Authorization: `Bearer ${loggedInUser.token}`,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(typeof body.errors).toBe('object');
        expect(body.errors.oldPassword).toBe(UserErrorCodes.MISSING_PASSWORD);
      });
  });

  it('should throw error if user user a different provider to login with POST /api/auth/login', async () => {
    await User.save({
      ...loggedInUser.user,
      provider: { id: 2 },
    });
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userSignUpDetails.email,
        password: userSignUpDetails.password,
      })
      .set({
        Authorization: `Bearer ${loggedInUser.token}`,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .then(({ body }) => {
        expect(typeof body).toBe('object');
        expect(body.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(typeof body.errors).toBe('object');
        expect(body.errors.provider).toBe(UserErrorCodes.INVALID_PROVIDER);
      });
  });

  it('should deactivate user account with DELETE /api/auth/me', () => {
    return request(app.getHttpServer())
      .delete('/api/auth/me')
      .set({
        Authorization: `Bearer ${loggedInUser.token}`,
      })
      .expect(HttpStatus.OK);
  });
});
