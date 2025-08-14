import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JurisdictionService } from '../services/jurisdiction-service.js';
import type { ApiError } from '../types/onboarding.js';

export async function jurisdictionsRoutes(fastify: FastifyInstance) {
  const jurisdictionService = new JurisdictionService();

  fastify.get('/jurisdictions/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            jurisdiction_id: { type: 'string' },
            name: { type: 'string' },
            state: { type: 'string' },
            appeal_window_start: { type: 'string' },
            appeal_window_end: { type: 'string' },
            deadline_rule: { type: 'string' },
            fee: { type: 'string' },
            forms: { type: 'array', items: { type: 'string' } },
            efile_available: { type: 'boolean' },
            evidence_preshare_required: { type: 'boolean' },
            decision_standard: { type: 'string' },
            citations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const jurisdiction = await jurisdictionService.getJurisdiction(request.params.id);
      
      reply.header('X-RateLimit-Remaining', '99');
      return jurisdiction;
      
    } catch (error) {
      fastify.log.error('Failed to get jurisdiction:', error);
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Jurisdiction Not Found',
        status: 404,
        detail: error instanceof Error ? error.message : 'Jurisdiction not found',
        code: 'JURISDICTION_NOT_FOUND'
      };
      
      return reply.status(404).send(apiError);
    }
  });

  fastify.get('/jurisdictions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          state: { type: 'string', pattern: '^[A-Z]{2}$' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jurisdiction_id: { type: 'string' },
              name: { type: 'string' },
              state: { type: 'string' },
              appeal_window_start: { type: 'string' },
              appeal_window_end: { type: 'string' },
              deadline_rule: { type: 'string' },
              fee: { type: 'string' },
              forms: { type: 'array', items: { type: 'string' } },
              efile_available: { type: 'boolean' },
              evidence_preshare_required: { type: 'boolean' },
              decision_standard: { type: 'string' },
              citations: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { state?: string } }>, reply: FastifyReply) => {
    try {
      const jurisdictions = await jurisdictionService.getJurisdictions(request.query.state);
      
      reply.header('X-RateLimit-Remaining', '99');
      return jurisdictions;
      
    } catch (error) {
      fastify.log.error('Failed to get jurisdictions:', error);
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Jurisdictions Retrieval Failed',
        status: 500,
        detail: error instanceof Error ? error.message : 'Unknown error',
        code: 'JURISDICTIONS_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });
}