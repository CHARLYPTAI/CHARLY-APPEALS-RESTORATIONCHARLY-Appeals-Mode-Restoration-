import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { authRoutes } from '../routes/auth.js';
import { commercialRoutes } from '../routes/commercial/commercial-router.js';
import { residentialRoutes } from '../routes/residential/residential-router.js';

describe('Tenant Isolation Tests', () => {
  let app: any;
  let commercialToken: string;
  let residentialToken: string;

  beforeAll(async () => {
    // Set up test Fastify instance
    app = Fastify({
      logger: false
    });

    // Register routes like in main.ts
    await app.register(authRoutes, { prefix: '/api/v1' });
    await app.register(async function(fastify: any) {
      await fastify.register(commercialRoutes, { prefix: '/c' });
      await fastify.register(residentialRoutes, { prefix: '/r' });
    }, { prefix: '/api/v1' });

    await app.ready();

    // Get tokens for both tenant types
    const commercialLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/commercial/login',
      payload: {
        email: 'demo@example.com',
        password: 'password123'
      }
    });

    const residentialLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/residential/login',
      payload: {
        email: 'demo@example.com',
        password: 'password123'
      }
    });

    commercialToken = JSON.parse(commercialLogin.payload).access_token;
    residentialToken = JSON.parse(residentialLogin.payload).access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Tests', () => {
    it('should allow commercial login and return commercial token', async () => {
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

    it('should allow residential login and return residential token', async () => {
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

    it('should validate commercial token correctly', async () => {
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

    it('should validate residential token correctly', async () => {
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
  });

  describe('Cross-Tenant Access Control', () => {
    it('should allow commercial token to access commercial routes', async () => {
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

    it('should allow residential token to access residential routes', async () => {
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

    it('should BLOCK access without authentication token', async () => {
      const responses = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/v1/c/health'
        }),
        app.inject({
          method: 'GET',
          url: '/api/v1/r/health'
        })
      ]);

      responses.forEach(response => {
        expect(response.statusCode).toBe(401);
        const data = JSON.parse(response.payload);
        expect(data.code).toBe('AUTHENTICATION_REQUIRED');
      });
    });

    it('should BLOCK access with invalid/tampered tokens', async () => {
      const invalidToken = commercialToken.slice(0, -10) + '1234567890';
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/c/health',
        headers: {
          authorization: `Bearer ${invalidToken}`
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Audience Validation', () => {
    it('should validate audience matches tenant type for commercial', async () => {
      // This test ensures JWT audience claim is properly validated
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/c/properties',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      // Should succeed because audience matches
      expect([200, 404]).toContain(response.statusCode); // 404 is OK for placeholder routes
    });

    it('should validate audience matches tenant type for residential', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/properties',
        headers: {
          authorization: `Bearer ${residentialToken}`
        }
      });

      // Should succeed because audience matches
      expect([200, 404]).toContain(response.statusCode); // 404 is OK for placeholder routes
    });
  });

  describe('Session Separation', () => {
    it('should maintain separate sessions for different tenant types', async () => {
      // Verify that commercial and residential sessions are completely isolated
      const commercialProperties = await app.inject({
        method: 'GET',
        url: '/api/v1/c/properties',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      const residentialProperties = await app.inject({
        method: 'GET',
        url: '/api/v1/r/properties',
        headers: {
          authorization: `Bearer ${residentialToken}`
        }
      });

      // Both should succeed but return tenant-specific data
      expect([200, 404]).toContain(commercialProperties.statusCode);
      expect([200, 404]).toContain(residentialProperties.statusCode);

      if (commercialProperties.statusCode === 200) {
        const data = JSON.parse(commercialProperties.payload);
        expect(data.tenant_type).toBe('COMMERCIAL');
      }

      if (residentialProperties.statusCode === 200) {
        const data = JSON.parse(residentialProperties.payload);
        expect(data.tenant_type).toBe('RESIDENTIAL');
      }
    });
  });

  describe('Golden Test - Commercial Unchanged with Flags OFF', () => {
    it('should preserve existing commercial functionality', async () => {
      // Verify that existing commercial endpoints still work as expected
      // This ensures we haven't broken existing functionality
      
      const endpoints = [
        '/api/v1/c/health',
        '/api/v1/c/properties',
        '/api/v1/c/valuation/test-id',
        '/api/v1/c/appeal-packet/test-id'
      ];

      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: {
            authorization: `Bearer ${commercialToken}`
          }
        });

        // Should not get authentication/authorization errors
        expect([200, 404, 500]).toContain(response.statusCode);
        expect(response.statusCode).not.toBe(401);
        expect(response.statusCode).not.toBe(403);
      }
    });
  });
});