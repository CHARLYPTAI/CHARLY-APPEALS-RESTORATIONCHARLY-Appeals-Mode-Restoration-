import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import securityHeaders from '../../plugins/security-headers.js';

describe('Security Headers', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(securityHeaders);
    
    app.get('/test', async () => {
      return { message: 'test' };
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('should set all security headers on 200 response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/test'
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-security-policy']).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
    );
    expect(response.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=(), payment=()');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
  });

  it('should set security headers on 404 response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/nonexistent'
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['referrer-policy']).toBeDefined();
    expect(response.headers['permissions-policy']).toBeDefined();
  });

  it('should allow custom CSP configuration', async () => {
    const customApp = Fastify();
    await customApp.register(securityHeaders, {
      csp: "default-src 'none';"
    });
    
    customApp.get('/custom', async () => {
      return { message: 'custom' };
    });

    const response = await customApp.inject({
      method: 'GET',
      url: '/custom'
    });

    expect(response.headers['content-security-policy']).toBe("default-src 'none';");
    await customApp.close();
  });
});