import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JurisdictionService } from '../services/jurisdiction-service.js';
import type { ApiError } from '../types/onboarding.js';
import { validateRequiredString } from '../utils/validation.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';

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
      const idValidation = validateRequiredString(request.params.id, 'jurisdiction id');
      if (!idValidation.valid) {
        const apiError: ApiError = {
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: idValidation.errors?.join(', ') || 'Invalid jurisdiction id',
          code: 'INVALID_JURISDICTION_ID'
        };
        return reply.status(400).send(apiError);
      }

      const jurisdiction = await jurisdictionService.getJurisdiction(idValidation.data!);
      
      reply.header('X-RateLimit-Remaining', '99');
      return jurisdiction;
      
    } catch (error) {
      fastify.log.error('Failed to get jurisdiction:', sanitizeForLogging(error));
      
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
      let stateFilter: string | undefined = undefined;
      
      if (request.query.state !== undefined) {
        const stateValidation = validateRequiredString(request.query.state, 'state filter');
        if (!stateValidation.valid) {
          const apiError: ApiError = {
            type: 'about:blank',
            title: 'Invalid Request',
            status: 400,
            detail: stateValidation.errors?.join(', ') || 'Invalid state filter',
            code: 'INVALID_STATE_FILTER'
          };
          return reply.status(400).send(apiError);
        }
        stateFilter = stateValidation.data;
      }

      const jurisdictions = await jurisdictionService.getJurisdictions(stateFilter);
      
      reply.header('X-RateLimit-Remaining', '99');
      return jurisdictions;
      
    } catch (error) {
      fastify.log.error('Failed to get jurisdictions:', sanitizeForLogging(error));
      
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