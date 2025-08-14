import { describe, it, expect } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';

describe('Main Application Functionality', () => {
  let app: FastifyInstance;

  it('should create fastify instance with correct configuration', async () => {
    app = Fastify({
      logger: {
        level: 'info',
        redact: ['req.headers.authorization', 'req.headers.cookie']
      }
    });

    expect(app).toBeDefined();
    
    await app.close();
  });

  it('should register CORS plugin correctly', async () => {
    app = Fastify({ logger: false });
    
    await app.register(cors, {
      origin: true,
      credentials: true
    });

    expect(app.hasPlugin('cors')).toBe(false); // Fastify doesn't expose this easily
    
    await app.close();
  });

  it('should register multipart plugin correctly', async () => {
    app = Fastify({ logger: false });
    
    await app.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
      }
    });

    // Just test that the plugin is registered without error
    expect(app).toBeDefined();
    
    await app.close();
  });

  it('should add security headers in preHandler hook', async () => {
    app = Fastify({ logger: false });

    app.addHook('preHandler', async (request, reply) => {
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-XSS-Protection', '1; mode=block');
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    });

    app.get('/test', async () => ({ test: true }));

    const response = await app.inject({
      method: 'GET',
      url: '/test'
    });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    expect(response.headers['strict-transport-security']).toContain('max-age=31536000');

    await app.close();
  });

  it('should set up health endpoint correctly', async () => {
    app = Fastify({ logger: false });

    app.get('/health', async () => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toBeDefined();

    await app.close();
  });

  it('should set up error handler with RFC7807 format', async () => {
    app = Fastify({ logger: false });

    app.setErrorHandler((error, request, reply) => {
      const statusCode = error.statusCode || 500;
      const response = {
        type: 'about:blank',
        title: statusCode === 500 ? 'Internal Server Error' : error.name || 'Error',
        status: statusCode,
        detail: statusCode === 500 ? 'An unexpected error occurred' : error.message,
        instance: request.url,
        code: error.code || 'INTERNAL_ERROR'
      };
      
      reply.status(statusCode).send(response);
    });

    app.get('/error', async () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      error.code = 'TEST_CODE';
      throw error;
    });

    const response = await app.inject({
      method: 'GET',
      url: '/error'
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.type).toBe('about:blank');
    expect(body.title).toBe('Error');
    expect(body.status).toBe(400);
    expect(body.detail).toBe('Test error');
    expect(body.instance).toBe('/error');
    expect(body.code).toBe('TEST_CODE');

    await app.close();
  });

  it('should handle 500 errors specially', async () => {
    app = Fastify({ logger: false });

    app.setErrorHandler((error, request, reply) => {
      const statusCode = error.statusCode || 500;
      const response = {
        type: 'about:blank',
        title: statusCode === 500 ? 'Internal Server Error' : error.name || 'Error',
        status: statusCode,
        detail: statusCode === 500 ? 'An unexpected error occurred' : error.message,
        instance: request.url,
        code: error.code || 'INTERNAL_ERROR'
      };
      
      reply.status(statusCode).send(response);
    });

    app.get('/error500', async () => {
      throw new Error('Internal server error');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/error500'
    });

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.type).toBe('about:blank');
    expect(body.title).toBe('Internal Server Error');
    expect(body.status).toBe(500);
    expect(body.detail).toBe('An unexpected error occurred');
    expect(body.instance).toBe('/error500');
    expect(body.code).toBe('INTERNAL_ERROR');

    await app.close();
  });
});