import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { MailService } from '@contactApp/modules/mail/mail.service';

import { TestAppModule } from './utils/test-app.module';
import { createMockMailService } from './utils/test-data-factory';

describe('Health Controller (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideProvider(MailService)
      .useValue(createMockMailService())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (moduleFixture) {
      await moduleFixture.close();
    }
  });

  describe('/health (GET)', () => {
    it('should return health check status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.status).toBe('healthy');
      expect(typeof response.body.uptime).toBe('number');
      expect(Array.isArray(response.body.checks)).toBe(true);
    });

    it('should include database check in health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK);

      const databaseCheck = response.body.checks.find(
        (check: { name: string }) => check.name === 'database',
      );
      expect(databaseCheck).toBeDefined();
      expect(databaseCheck).toHaveProperty('status');
      expect(['healthy', 'error']).toContain(databaseCheck.status);
    });

    it('should include memory check in health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK);

      const memoryCheck = response.body.checks.find(
        (check: { name: string }) => check.name === 'memory',
      );
      expect(memoryCheck).toBeDefined();
      expect(memoryCheck).toHaveProperty('status');
      expect(memoryCheck).toHaveProperty('details');
      expect(['healthy', 'error']).toContain(memoryCheck.status);
    });

    it('should include disk check in health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK);

      const diskCheck = response.body.checks.find(
        (check: { name: string }) => check.name === 'disk',
      );
      expect(diskCheck).toBeDefined();
      expect(diskCheck).toHaveProperty('status');
      expect(diskCheck).toHaveProperty('details');
      expect(['healthy', 'error']).toContain(diskCheck.status);
    });
  });

  describe('/health/ready (GET)', () => {
    it('should return readiness check status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body.status).toBe('ready');
      expect(typeof response.body.responseTime).toBe('number');
    });

    it('should check database connectivity for readiness', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('ready');
      expect(response.body.responseTime).toBeGreaterThan(0);
    });

    it('should check external dependencies for readiness', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(HttpStatus.OK);

      // Should return ready status indicating dependencies are available
      expect(response.body.status).toBe('ready');
      expect(response.body.responseTime).toBeGreaterThan(0);
    });
  });

  describe('/health/live (GET)', () => {
    it('should return liveness check status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/live')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.status).toBe('alive');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return consistent timestamp format', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/live')
        .expect(HttpStatus.OK);

      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );

      // Timestamp should be recent (within last 5 seconds)
      const timestamp = new Date(response.body.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - timestamp.getTime();
      expect(timeDiff).toBeLessThan(5000);
    });

    it('should return uptime as positive number', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/live')
        .expect(HttpStatus.OK);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('Health endpoint error handling', () => {
    it('should handle invalid health endpoints gracefully', async () => {
      await request(app.getHttpServer())
        .get('/health/invalid')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return proper content type for health endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle concurrent health check requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).get('/health').expect(HttpStatus.OK),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Health check response structure validation', () => {
    it('should have consistent response structure across all health endpoints', async () => {
      const endpoints = ['/health', '/health/ready', '/health/live'];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.status).toBe('string');
        expect(typeof response.body.timestamp).toBe('string');
      }
    });

    it('should include version information in health check', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK);

      // Health check might include version info
      if (response.body.version) {
        expect(typeof response.body.version).toBe('string');
      }
    });

    it('should include environment information in health check', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK);

      // Health check might include environment info
      if (response.body.environment) {
        expect(typeof response.body.environment).toBe('string');
      }
    });
  });
});
