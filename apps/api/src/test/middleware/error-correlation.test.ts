import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';

describe('Error Handling and Correlation ID', () => {
  let fastify: any;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
    
    // Replicate main.ts correlation and error handling setup
    fastify.addHook('onRequest', async (request: any, reply: any) => {
      const correlationId = request.headers['x-correlation-id'] as string || 
        require('uuid').v4();
      request.correlationId = correlationId;
      reply.header('x-correlation-id', correlationId);
    });

    // RFC7807 compliant 404 handler
    fastify.setNotFoundHandler((request: any, reply: any) => {
      const correlationId = request.correlationId || 'unknown';
      
      const problemDetails = {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: `Route ${request.method}:${request.url} not found`,
        instance: request.url,
        correlationId,
        code: 'NOT_FOUND'
      };
      
      reply.status(404).send(problemDetails);
    });

    fastify.setErrorHandler((error: any, request: any, reply: any) => {
      const correlationId = request.correlationId || 'unknown';
      
      let problemDetails: any;

      if (error.validation) {
        const validationErrors: Record<string, string[]> = {};
        if (Array.isArray(error.validation)) {
          error.validation.forEach((err: any) => {
            const field = err.instancePath?.replace('/', '') || err.schemaPath || 'unknown';
            if (!validationErrors[field]) {
              validationErrors[field] = [];
            }
            validationErrors[field].push(err.message || 'Invalid value');
          });
        }

        problemDetails = {
          type: 'about:blank',
          title: 'Validation Error',
          status: 400,
          detail: 'Request validation failed',
          instance: request.url,
          correlationId,
          code: 'VALIDATION_ERROR',
          errors: validationErrors
        };
      } else if (error.statusCode === 404) {
        problemDetails = {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: error.message || 'Resource not found',
          instance: request.url,
          correlationId,
          code: 'NOT_FOUND'
        };
      } else if (error.statusCode && error.statusCode < 500) {
        problemDetails = {
          type: 'about:blank',
          title: error.name || 'Client Error',
          status: error.statusCode,
          detail: error.message,
          instance: request.url,
          correlationId,
          code: error.code || 'CLIENT_ERROR'
        };
      } else {
        problemDetails = {
          type: 'about:blank',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred',
          instance: request.url,
          correlationId,
          code: 'INTERNAL_ERROR'
        };
      }

      reply.status(problemDetails.status).send(problemDetails);
    });
  });

  afterEach(async () => {
    await fastify.close();
  });

  it('should generate correlation ID when not provided', async () => {
    fastify.get('/test', async (request: any) => {
      return { correlationId: request.correlationId };
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/test'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(response.headers['x-correlation-id']).toBe(body.correlationId);
  });

  it('should use provided correlation ID from header', async () => {
    const providedId = 'test-correlation-id-123';
    
    fastify.get('/test', async (request: any) => {
      return { correlationId: request.correlationId };
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/test',
      headers: {
        'x-correlation-id': providedId
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.correlationId).toBe(providedId);
    expect(response.headers['x-correlation-id']).toBe(providedId);
  });

  it('should handle generic errors as 500 with correlation ID', async () => {
    fastify.get('/generic-error', async () => {
      throw new Error('Internal database connection failed');
    });

    const correlationId = 'test-correlation-456';
    const response = await fastify.inject({
      method: 'GET',
      url: '/generic-error',
      headers: {
        'x-correlation-id': correlationId
      }
    });

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      correlationId,
      instance: '/generic-error'
    });
    expect(body.detail).not.toContain('database');
    expect(response.headers['x-correlation-id']).toBe(correlationId);
  });

  it('should handle Fastify validation errors with correlation ID', async () => {
    fastify.post('/validation', {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' }
          }
        }
      }
    }, async () => {
      return { success: true };
    });

    const response = await fastify.inject({
      method: 'POST',
      url: '/validation',
      payload: { name: '', email: 'invalid-email' },
      headers: {
        'x-correlation-id': 'validation-test-123'
      }
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      type: 'about:blank',
      title: 'Validation Error',
      status: 400,
      detail: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      correlationId: 'validation-test-123'
    });
    expect(body.errors).toBeDefined();
    expect(response.headers['x-correlation-id']).toBe('validation-test-123');
  });

  it('should handle 404 errors with correlation ID', async () => {
    const correlationId = 'not-found-test-789';
    const response = await fastify.inject({
      method: 'GET',
      url: '/non-existent-route',
      headers: {
        'x-correlation-id': correlationId
      }
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Route GET:/non-existent-route not found',
      code: 'NOT_FOUND',
      correlationId,
      instance: '/non-existent-route'
    });
    expect(response.headers['x-correlation-id']).toBe(correlationId);
  });

  it('should handle client errors (4xx) with correlation ID', async () => {
    fastify.get('/client-error', async () => {
      const error: any = new Error('Bad request');
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      throw error;
    });

    const correlationId = 'client-error-test-456';
    const response = await fastify.inject({
      method: 'GET',
      url: '/client-error',
      headers: {
        'x-correlation-id': correlationId
      }
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      type: 'about:blank',
      title: 'Error',
      status: 400,
      detail: 'Bad request',
      code: 'BAD_REQUEST',
      correlationId,
      instance: '/client-error'
    });
    expect(response.headers['x-correlation-id']).toBe(correlationId);
  });

  it('should handle large payload errors (413) with correlation ID', async () => {
    fastify.post('/upload', async () => {
      const error: any = new Error('Payload too large');
      error.statusCode = 413;
      throw error;
    });

    const correlationId = 'payload-test-789';
    const response = await fastify.inject({
      method: 'POST',
      url: '/upload',
      headers: {
        'x-correlation-id': correlationId
      }
    });

    expect(response.statusCode).toBe(413);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      type: 'about:blank',
      title: 'Error',
      status: 413,
      detail: 'Payload too large',
      correlationId,
      instance: '/upload'
    });
    expect(response.headers['x-correlation-id']).toBe(correlationId);
  });
});