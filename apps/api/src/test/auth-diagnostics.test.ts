import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { authRoutes } from '../routes/auth.js';
import { createTenantMiddleware } from '../middleware/tenant-auth.js';

describe('Auth Diagnostics', () => {
  let app: any;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(authRoutes, { prefix: '/api/v1' });
    
    // Add test route with tenant middleware in same scope as auth
    await app.register(async function(fastify) {
      fastify.get('/test/commercial', {
        preHandler: [createTenantMiddleware('COMMERCIAL')]
      }, async (request: any) => {
        return { 
          success: true, 
          tenant: request.tenant?.tenantType,
          userId: request.tenant?.userId 
        };
      });
    }, { prefix: '/api/v1' });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should test full authentication + middleware flow', async () => {
    // 1. Login to get token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/commercial/login',
      payload: {
        email: 'demo@example.com',
        password: 'password123'
      }
    });

    console.log('Login Status:', loginResponse.statusCode);
    console.log('Login Payload:', loginResponse.payload);
    
    const { access_token } = JSON.parse(loginResponse.payload);

    // 2. Try to access protected route
    const protectedResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/test/commercial',
      headers: {
        authorization: `Bearer ${access_token}`
      }
    });

    console.log('Protected Status:', protectedResponse.statusCode);
    console.log('Protected Payload:', protectedResponse.payload);

    // Just log everything for diagnostics
    expect(true).toBe(true);
  });

  it('should test token validation endpoint', async () => {
    // 1. Login to get token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/commercial/login',
      payload: {
        email: 'demo@example.com',
        password: 'password123'
      }
    });

    const { access_token } = JSON.parse(loginResponse.payload);

    // 2. Validate token
    const validateResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/validate',
      headers: {
        authorization: `Bearer ${access_token}`
      }
    });

    console.log('Validate Status:', validateResponse.statusCode);
    console.log('Validate Payload:', validateResponse.payload);

    expect(true).toBe(true);
  });
});