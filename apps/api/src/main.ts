import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { uploadsRoutes } from './routes/uploads.js';
import { validateRoutes } from './routes/validate.js';
import { appealPacketRoutes } from './routes/appeal-packet.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { jurisdictionsRoutes } from './routes/jurisdictions.js';

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
  }
}

async function start() {
  try {
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

    fastify.addHook('preHandler', async (request, reply) => {
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-XSS-Protection', '1; mode=block');
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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

    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);
      
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

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`CHARLY API server listening on ${host}:${port}`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();