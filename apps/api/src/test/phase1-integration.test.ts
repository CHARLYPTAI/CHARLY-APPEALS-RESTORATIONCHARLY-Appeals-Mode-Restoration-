import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import securityHeaders from '../plugins/security-headers.js';
import { authRoutes } from '../routes/auth.js';
import { commercialRoutes } from '../routes/commercial/commercial-router.js';
import { residentialRoutes } from '../routes/residential/residential-router.js';

describe('Phase 1 Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Set up complete Fastify instance matching main.ts
    app = Fastify({
      logger: false
    });

    await app.register(securityHeaders);
    await app.register(cors, {
      origin: true,
      credentials: true
    });
    await app.register(multipart);

    // Add correlation ID hook
    app.addHook('onRequest', async (request: any, reply: any) => {
      request.correlationId = 'test-correlation-id';
    });

    // Register routes exactly like main.ts
    await app.register(authRoutes, { prefix: '/api/v1' });
    await app.register(async function(fastify: any) {
      await fastify.register(commercialRoutes, { prefix: '/c' });
      await fastify.register(residentialRoutes, { prefix: '/r' });
    }, { prefix: '/api/v1' });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full commercial authentication flow', async () => {
      // 1. Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: {
          email: 'demo@example.com',
          password: 'password123'
        }
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginData = JSON.parse(loginResponse.payload);
      expect(loginData.tenant_type).toBe('COMMERCIAL');
      expect(loginData.access_token).toBeDefined();

      // 2. Validate token
      const validateResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: {
          authorization: `Bearer ${loginData.access_token}`
        }
      });

      expect(validateResponse.statusCode).toBe(200);
      const validateData = JSON.parse(validateResponse.payload);
      expect(validateData.user.tenant_type).toBe('COMMERCIAL');

      // 3. Access commercial resources
      const resourceResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/c/health',
        headers: {
          authorization: `Bearer ${loginData.access_token}`
        }
      });

      expect(resourceResponse.statusCode).toBe(200);
      const resourceData = JSON.parse(resourceResponse.payload);
      expect(resourceData.tenant).toBe('commercial');
    });

    it('should complete full residential authentication flow', async () => {
      // 1. Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/residential/login',
        payload: {
          email: 'demo@example.com',
          password: 'password123'
        }
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginData = JSON.parse(loginResponse.payload);
      expect(loginData.tenant_type).toBe('RESIDENTIAL');
      expect(loginData.access_token).toBeDefined();

      // 2. Validate token
      const validateResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: {
          authorization: `Bearer ${loginData.access_token}`
        }
      });

      expect(validateResponse.statusCode).toBe(200);
      const validateData = JSON.parse(validateResponse.payload);
      expect(validateData.user.tenant_type).toBe('RESIDENTIAL');

      // 3. Access residential resources
      const resourceResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/r/health',
        headers: {
          authorization: `Bearer ${loginData.access_token}`
        }
      });

      expect(resourceResponse.statusCode).toBe(200);
      const resourceData = JSON.parse(resourceResponse.payload);
      expect(resourceData.tenant).toBe('residential');
    });
  });

  describe('Security Headers and CORS', () => {
    it('should include security headers on all responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should handle CORS correctly', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/auth/commercial/login',
        headers: {
          origin: 'https://commercial.charlyapp.com'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Error Handling and RFC7807 Compliance', () => {
    it('should return RFC7807 compliant error for 404', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/nonexistent'
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('detail');
      expect(data).toHaveProperty('correlationId');
      expect(data.status).toBe(404);
    });

    it('should return RFC7807 compliant error for invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('detail');
      expect(data).toHaveProperty('correlationId');
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return RFC7807 compliant error for tenant access denied', async () => {
      // Get commercial token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: {
          email: 'demo@example.com',
          password: 'password123'
        }
      });

      const { access_token } = JSON.parse(loginResponse.payload);

      // Try to access residential endpoint
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/health',
        headers: {
          authorization: `Bearer ${access_token}`
        }
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('detail');
      expect(data).toHaveProperty('correlationId');
      expect(data.code).toBe('TENANT_ACCESS_DENIED');
    });
  });

  describe('Validation and Schema Compliance', () => {
    it('should validate login request schema', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: {
          email: 'invalid-email',
          password: '123' // Too short
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data).toHaveProperty('errors');
    });

    it('should require all authentication fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/residential/login',
        payload: {
          email: 'test@example.com'
          // Missing password
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Health and Status Endpoints', () => {
    it('should provide general health endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
    });

    it('should provide tenant-specific health endpoints', async () => {
      // Get tokens
      const [commercialLogin, residentialLogin] = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/api/v1/auth/commercial/login',
          payload: { email: 'demo@example.com', password: 'password123' }
        }),
        app.inject({
          method: 'POST',
          url: '/api/v1/auth/residential/login',
          payload: { email: 'demo@example.com', password: 'password123' }
        })
      ]);

      const commercialToken = JSON.parse(commercialLogin.payload).access_token;
      const residentialToken = JSON.parse(residentialLogin.payload).access_token;

      // Test tenant-specific health endpoints
      const [commercialHealth, residentialHealth] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/v1/c/health',
          headers: { authorization: `Bearer ${commercialToken}` }
        }),
        app.inject({
          method: 'GET',
          url: '/api/v1/r/health',
          headers: { authorization: `Bearer ${residentialToken}` }
        })
      ]);

      expect(commercialHealth.statusCode).toBe(200);
      expect(residentialHealth.statusCode).toBe(200);

      const commercialData = JSON.parse(commercialHealth.payload);
      const residentialData = JSON.parse(residentialHealth.payload);

      expect(commercialData.tenant).toBe('commercial');
      expect(residentialData.tenant).toBe('residential');
    });
  });
});