import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { authRoutes } from '../routes/auth.js';
import { createTenantMiddleware } from '../middleware/tenant-auth.js';

describe('Auth and Tenant Isolation Core Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    
    // Register auth routes only
    await app.register(authRoutes, { prefix: '/api/v1' });
    
    // Add simple protected route for testing
    app.get('/api/v1/test/commercial', {
      preHandler: [createTenantMiddleware('COMMERCIAL')]
    }, async (request: any) => {
      return { 
        success: true, 
        tenant: request.tenant?.tenantType,
        userId: request.tenant?.userId 
      };
    });

    app.get('/api/v1/test/residential', {
      preHandler: [createTenantMiddleware('RESIDENTIAL')]
    }, async (request: any) => {
      return { 
        success: true, 
        tenant: request.tenant?.tenantType,
        userId: request.tenant?.userId 
      };
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT Authentication', () => {
    it('should generate valid commercial JWT token', async () => {
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
      expect(data.token_type).toBe('Bearer');
      expect(data.expires_in).toBe(3600);
    });

    it('should generate valid residential JWT token', async () => {
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
      expect(data.token_type).toBe('Bearer');
      expect(data.expires_in).toBe(3600);
    });

    it('should reject invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Tenant Isolation', () => {
    let commercialToken: string;
    let residentialToken: string;

    beforeAll(async () => {
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

      commercialToken = JSON.parse(commercialLogin.payload).access_token;
      residentialToken = JSON.parse(residentialLogin.payload).access_token;
    });

    it('should allow commercial token to access commercial endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/test/commercial',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.tenant).toBe('COMMERCIAL');
    });

    it('should allow residential token to access residential endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/test/residential',
        headers: {
          authorization: `Bearer ${residentialToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.tenant).toBe('RESIDENTIAL');
    });

    it('should BLOCK commercial token from residential endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/test/residential',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('TENANT_ACCESS_DENIED');
    });

    it('should BLOCK residential token from commercial endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/test/commercial',
        headers: {
          authorization: `Bearer ${residentialToken}`
        }
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('TENANT_ACCESS_DENIED');
    });

    it('should validate JWT audience claims', async () => {
      const validateCommercial = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      const validateResidential = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: {
          authorization: `Bearer ${residentialToken}`
        }
      });

      expect(validateCommercial.statusCode).toBe(200);
      expect(validateResidential.statusCode).toBe(200);

      const commercialData = JSON.parse(validateCommercial.payload);
      const residentialData = JSON.parse(validateResidential.payload);

      expect(commercialData.user.aud).toBe('charly-commercial');
      expect(commercialData.user.tenant_type).toBe('COMMERCIAL');

      expect(residentialData.user.aud).toBe('charly-residential');
      expect(residentialData.user.tenant_type).toBe('RESIDENTIAL');
    });
  });

  describe('Security Validation', () => {
    it('should reject requests without authorization header', async () => {
      const responses = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/v1/test/commercial'
        }),
        app.inject({
          method: 'GET',
          url: '/api/v1/test/residential'
        })
      ]);

      responses.forEach(response => {
        expect(response.statusCode).toBe(401);
        const data = JSON.parse(response.payload);
        expect(data.code).toBe('AUTHENTICATION_REQUIRED');
      });
    });

    it('should reject malformed tokens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/test/commercial',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});