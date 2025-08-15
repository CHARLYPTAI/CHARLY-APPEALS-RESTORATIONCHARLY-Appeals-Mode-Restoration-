import type { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';

export async function jwtPlugin(fastify: FastifyInstance) {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    sign: {
      algorithm: 'HS256' as const
    },
    verify: {
      algorithms: ['HS256']
    }
  });
}