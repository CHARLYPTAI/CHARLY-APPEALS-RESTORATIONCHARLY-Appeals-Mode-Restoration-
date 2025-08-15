import type { FastifyInstance } from 'fastify';
import { requireCommercialTenant } from '../../middleware/tenant-auth.js';
import { uploadsRoutes } from '../uploads.js';
import { validateRoutes } from '../validate.js';
import { appealPacketRoutes } from '../appeal-packet.js';
import { onboardingRoutes } from '../onboarding.js';
import { jurisdictionsRoutes } from '../jurisdictions.js';
import { valuationRoutes } from '../valuation.js';
import { resultsRoutes } from '../results.js';
import { aiSwartzRoutes } from '../ai-swartz.js';

export async function commercialRoutes(fastify: FastifyInstance) {
  // All commercial routes require commercial tenant access
  fastify.addHook('preHandler', requireCommercialTenant);

  // Commercial health check
  fastify.get('/health', async (request) => {
    return { 
      status: 'healthy', 
      tenant: 'commercial',
      timestamp: new Date().toISOString(),
      user: request.tenant?.userId
    };
  });

  // Register existing commercial routes under tenant protection
  await fastify.register(uploadsRoutes);
  await fastify.register(validateRoutes);
  await fastify.register(appealPacketRoutes);
  await fastify.register(onboardingRoutes);
  await fastify.register(jurisdictionsRoutes);
  await fastify.register(valuationRoutes);
  await fastify.register(resultsRoutes);
  await fastify.register(aiSwartzRoutes);
}