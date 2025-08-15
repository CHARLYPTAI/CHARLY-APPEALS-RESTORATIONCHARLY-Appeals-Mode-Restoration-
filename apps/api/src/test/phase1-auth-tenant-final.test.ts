import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { authRoutes } from '../routes/auth.js';
import { requireCommercialTenant, requireResidentialTenant } from '../middleware/tenant-auth.js';
import { jwtPlugin } from '../plugins/jwt.js';

describe('Phase 1 Authentication and Tenant Isolation Final Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Register JWT at the root level first
    await app.register(jwtPlugin);

    // Register auth routes at the main level
    await app.register(authRoutes, { prefix: '/api/v1' });

    // Create a context with JWT available for tenant routes
    await app.register(async function(fastify) {
      // Mock commercial health endpoint
      fastify.get('/c/health', {
        preHandler: [requireCommercialTenant]
      }, async (request: any) => {
        return { 
          status: 'healthy', 
          tenant: 'commercial',
          timestamp: new Date().toISOString(),
          user: request.tenant?.userId
        };
      });

      // Mock residential health endpoint  
      fastify.get('/r/health', {
        preHandler: [requireResidentialTenant]
      }, async (request: any) => {
        return { 
          status: 'healthy', 
          tenant: 'residential',
          timestamp: new Date().toISOString(),
          user: request.tenant?.userId
        };
      });

      // Mock commercial properties endpoint
      fastify.get('/c/properties', {
        preHandler: [requireCommercialTenant]
      }, async (request: any) => {
        return {
          properties: [],
          tenant_type: request.tenant?.tenantType,
          message: 'Commercial properties endpoint'
        };
      });

      // Mock residential properties endpoint
      fastify.get('/r/properties', {
        preHandler: [requireResidentialTenant]
      }, async (request: any) => {
        return {
          properties: [],
          tenant_type: request.tenant?.tenantType,
          message: 'Residential properties endpoint'
        };
      });
    }, { prefix: '/api/v1' });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT Token Generation and Validation', () => {
    it('should generate valid commercial JWT tokens', async () => {
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

    it('should generate valid residential JWT tokens', async () => {
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
          email: 'invalid@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });

    it('should validate JWT tokens correctly', async () => {
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

      // Validate token
      const validateResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: {
          authorization: `Bearer ${access_token}`
        }
      });

      expect(validateResponse.statusCode).toBe(200);
      const data = JSON.parse(validateResponse.payload);
      expect(data.user.tenant_type).toBe('COMMERCIAL');
      expect(data.user.aud).toBe('charly-commercial');
    });
  });

  describe('Tenant Isolation - Access Control', () => {
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

    it('should allow commercial tokens to access commercial routes', async () => {
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
      expect(data.user).toBe('user-123');
    });

    it('should allow residential tokens to access residential routes', async () => {
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
      expect(data.user).toBe('user-123');
    });

    it('should BLOCK commercial tokens from accessing residential routes', async () => {
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

    it('should BLOCK residential tokens from accessing commercial routes', async () => {
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

    it('should BLOCK access without authentication tokens', async () => {
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
      
      const commercialData = JSON.parse(commercialResponse.payload);
      const residentialData = JSON.parse(residentialResponse.payload);
      
      expect(commercialData.code).toBe('AUTHENTICATION_REQUIRED');
      expect(residentialData.code).toBe('AUTHENTICATION_REQUIRED');
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
      const data = JSON.parse(response.payload);
      expect(data.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('API Route Segregation - /api/v1/r/* vs /api/v1/c/*', () => {
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

    it('should properly segregate commercial routes under /api/v1/c/*', async () => {
      const endpoints = ['/api/v1/c/health', '/api/v1/c/properties'];
      
      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: {
            authorization: `Bearer ${commercialToken}`
          }
        });

        // Should succeed with commercial token
        expect(response.statusCode).toBe(200);
        
        // Should fail with residential token
        const blockedResponse = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: {
            authorization: `Bearer ${residentialToken}`
          }
        });
        expect(blockedResponse.statusCode).toBe(403);
      }
    });

    it('should properly segregate residential routes under /api/v1/r/*', async () => {
      const endpoints = ['/api/v1/r/health', '/api/v1/r/properties'];
      
      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: {
            authorization: `Bearer ${residentialToken}`
          }
        });

        // Should succeed with residential token
        expect(response.statusCode).toBe(200);
        
        // Should fail with commercial token
        const blockedResponse = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: {
            authorization: `Bearer ${commercialToken}`
          }
        });
        expect(blockedResponse.statusCode).toBe(403);
      }
    });
  });

  describe('Audience Validation', () => {
    it('should validate audience claims in JWT tokens', async () => {
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

      // Validate commercial token has correct audience
      const commercialValidation = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: { authorization: `Bearer ${commercialToken}` }
      });

      const commercialData = JSON.parse(commercialValidation.payload);
      expect(commercialData.user.aud).toBe('charly-commercial');
      expect(commercialData.user.tenant_type).toBe('COMMERCIAL');

      // Validate residential token has correct audience
      const residentialValidation = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/validate',
        headers: { authorization: `Bearer ${residentialToken}` }
      });

      const residentialData = JSON.parse(residentialValidation.payload);
      expect(residentialData.user.aud).toBe('charly-residential');
      expect(residentialData.user.tenant_type).toBe('RESIDENTIAL');
    });
  });

  describe('Security Validation', () => {
    it('should reject malformed authorization headers', async () => {
      const testCases = [
        { headers: { authorization: 'invalid-format' }, description: 'missing Bearer prefix' },
        { headers: { authorization: 'Bearer' }, description: 'missing token' },
        { headers: { authorization: '' }, description: 'empty header' },
        { headers: {}, description: 'missing header' }
      ];

      for (const testCase of testCases) {
        const response = await app.inject({
          method: 'GET',
          url: '/api/v1/c/health',
          headers: testCase.headers
        });

        expect(response.statusCode).toBe(401);
        const data = JSON.parse(response.payload);
        expect(data.code).toBe('AUTHENTICATION_REQUIRED');
      }
    });

    it('should ensure tenant context is properly set', async () => {
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

      // Test commercial context
      const commercialResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/c/properties',
        headers: { authorization: `Bearer ${commercialToken}` }
      });

      expect(commercialResponse.statusCode).toBe(200);
      const commercialData = JSON.parse(commercialResponse.payload);
      expect(commercialData.tenant_type).toBe('COMMERCIAL');

      // Test residential context
      const residentialResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/r/properties',
        headers: { authorization: `Bearer ${residentialToken}` }
      });

      expect(residentialResponse.statusCode).toBe(200);
      const residentialData = JSON.parse(residentialResponse.payload);
      expect(residentialData.tenant_type).toBe('RESIDENTIAL');
    });
  });
});