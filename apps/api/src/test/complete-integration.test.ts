import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { authRoutes } from '../routes/auth.js';
import { commercialRoutes } from '../routes/commercial/commercial-router.js';
import { residentialRoutes } from '../routes/residential/residential-router.js';

describe('Complete Integration Tests - Mimicking main.ts', () => {
  let app: any;

  beforeAll(async () => {
    // Set up Fastify instance exactly like main.ts
    app = Fastify({
      logger: false
    });

    await app.register(cors, {
      origin: true,
      credentials: true
    });

    await app.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
      }
    });

    app.addHook('onRequest', async (request: any, reply: any) => {
      request.correlationId = 'test-correlation-id';
    });

    // Health endpoint
    app.get('/health', async (request: any, reply: any) => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });

    // Register authentication routes (no tenant restrictions)
    await app.register(authRoutes, { prefix: '/api/v1' });

    // Register tenant-specific routes with realm-based prefixes
    await app.register(async function(fastify: any) {
      // Commercial routes under /api/v1/c/*
      await fastify.register(commercialRoutes, { prefix: '/c' });
      
      // Residential routes under /api/v1/r/*
      await fastify.register(residentialRoutes, { prefix: '/r' });
    }, { prefix: '/api/v1' });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should authenticate commercial users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: {
          email: 'demo@example.com',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.tenant_type).toBe('COMMERCIAL');
      expect(data.access_token).toBeDefined();
    });

    it('should authenticate residential users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/residential/login',
        payload: {
          email: 'demo@example.com',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.tenant_type).toBe('RESIDENTIAL');
      expect(data.access_token).toBeDefined();
    });
  });

  describe('Tenant Isolation - Commercial vs Residential', () => {
    let commercialToken: string;
    let residentialToken: string;

    beforeAll(async () => {
      // Get commercial token
      const commercialLogin = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: {
          email: 'demo@example.com',
          password: 'password123'
        }
      });
      commercialToken = JSON.parse(commercialLogin.payload).access_token;

      // Get residential token
      const residentialLogin = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/residential/login',
        payload: {
          email: 'demo@example.com',
          password: 'password123'
        }
      });
      residentialToken = JSON.parse(residentialLogin.payload).access_token;
    });

    it('should allow commercial token access to commercial routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/c/health',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.tenant).toBe('commercial');
    });

    it('should allow residential token access to residential routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/health',
        headers: {
          authorization: `Bearer ${residentialToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.tenant).toBe('residential');
    });

    it('should BLOCK commercial token from accessing residential routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/health',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('TENANT_ACCESS_DENIED');
      expect(data.detail).toContain('RESIDENTIAL');
    });

    it('should BLOCK residential token from accessing commercial routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/c/health',
        headers: {
          authorization: `Bearer ${residentialToken}`
        }
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('TENANT_ACCESS_DENIED');
      expect(data.detail).toContain('COMMERCIAL');
    });

    it('should block access without authentication', async () => {
      const [commercialResponse, residentialResponse] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/v1/c/health'
        }),
        app.inject({
          method: 'GET',
          url: '/api/v1/r/health'
        })
      ]);

      expect(commercialResponse.statusCode).toBe(401);
      expect(residentialResponse.statusCode).toBe(401);
    });
  });

  describe('JWT Token Validation', () => {
    let commercialToken: string;
    let residentialToken: string;

    beforeAll(async () => {
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

      commercialToken = JSON.parse(commercialLogin.payload).access_token;
      residentialToken = JSON.parse(residentialLogin.payload).access_token;
    });

    it('should validate commercial tokens with correct audience', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.user.tenant_type).toBe('COMMERCIAL');
      expect(data.user.aud).toBe('charly-commercial');
    });

    it('should validate residential tokens with correct audience', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: {
          authorization: `Bearer ${residentialToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.user.tenant_type).toBe('RESIDENTIAL');
      expect(data.user.aud).toBe('charly-residential');
    });

    it('should reject invalid tokens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Cross-Tenant Security', () => {
    it('should reject tampered tokens', async () => {
      // Get a valid token and tamper with it
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: { email: 'demo@example.com', password: 'password123' }
      });

      const { access_token } = JSON.parse(loginResponse.payload);
      const tamperedToken = access_token.slice(0, -10) + '1234567890';

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/c/health',
        headers: {
          authorization: `Bearer ${tamperedToken}`
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});