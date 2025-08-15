import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { uploadsRoutes } from './routes/uploads.js';
import { validateRoutes } from './routes/validate.js';
import { appealPacketRoutes } from './routes/appeal-packet.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { jurisdictionsRoutes } from './routes/jurisdictions.js';
import { sanitizeForLogging } from './utils/log-sanitizer.js';
import securityHeaders from './plugins/security-headers.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie']
  }
});

declare module 'fastify' {
  interface FastifyRequest {
    rateLimit?: {
      remaining: number;
    };
    correlationId?: string;
  }
}

async function start() {
  try {
    await fastify.register(securityHeaders);
    
    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://commercial.charlyapp.com', 'https://residential.charlyapp.com']
        : true,
      credentials: true
    });

    await fastify.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
      }
    });

    fastify.addHook('onRequest', async (request, reply) => {
      // Add correlation ID to request (onRequest runs before validation)
      const correlationId = request.headers['x-correlation-id'] as string || 
        require('uuid').v4();
      request.correlationId = correlationId;
      reply.header('x-correlation-id', correlationId);
    });

    fastify.get('/health', async (request, reply) => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });

    await fastify.register(async function(fastify) {
      await fastify.register(uploadsRoutes, { prefix: '/api/v1' });
      await fastify.register(validateRoutes, { prefix: '/api/v1' });
      await fastify.register(appealPacketRoutes, { prefix: '/api/v1' });
      await fastify.register(onboardingRoutes, { prefix: '/api/v1' });
      await fastify.register(jurisdictionsRoutes, { prefix: '/api/v1' });
    });

    // RFC7807 compliant 404 handler
    fastify.setNotFoundHandler((request, reply) => {
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

    // Centralized error handler with correlation ID
    fastify.setErrorHandler((error, request, reply) => {
      const correlationId = request.correlationId || 'unknown';
      
      fastify.log.error({
        error: sanitizeForLogging(error),
        correlationId,
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString()
      }, 'Request error');

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

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`CHARLY API server listening on ${host}:${port}`);
    
  } catch (err) {
    fastify.log.error(sanitizeForLogging(err));
    process.exit(1);
  }
}

start();