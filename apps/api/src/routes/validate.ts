import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ValidationService } from '../services/validation-service.js';
import type { CommercialValidationRequest, ResidentialValidationRequest, ApiError } from '../types/api.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';

export async function validateRoutes(fastify: FastifyInstance) {
  const validationService = new ValidationService();

  fastify.post('/validate/commercial', {
    schema: {
      body: {
        type: 'object',
        required: ['property'],
        properties: {
          property: { type: 'object' },
          rent_roll_ref: { type: 'string' },
          income_stmt_ref: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            workfile_id: { type: 'string' },
            normalized: {},
            errors: { type: 'array', items: { type: 'string' } },
            decision_preview: {
              type: 'object',
              properties: {
                label: { type: 'string', enum: ['OVER', 'FAIR', 'UNDER'] },
                confidence: { type: 'number' },
                savings_estimate: { type: 'number' }
              }
            }
          }
        }
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      const rateLimitKey = request.headers['x-api-key'] || request.ip;
      request.rateLimit = { remaining: 100 };
    }
  }, async (request: FastifyRequest<{ Body: CommercialValidationRequest }>, reply: FastifyReply) => {
    try {
      const result = await validationService.validateCommercial(request.body);
      
      reply.header('X-RateLimit-Remaining', '99');
      return result;
      
    } catch (error) {
      fastify.log.error('Commercial validation failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Validation Failed',
        status: 422,
        detail: error instanceof Error ? error.message : 'Unknown validation error',
        code: 'VALIDATION_ERROR'
      };
      
      return reply.status(422).send(apiError);
    }
  });

  fastify.post('/validate/residential', {
    schema: {
      body: {
        type: 'object',
        required: ['property'],
        properties: {
          property: { type: 'object' },
          comp_refs: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: ResidentialValidationRequest }>, reply: FastifyReply) => {
    try {
      const result = await validationService.validateResidential(request.body.property);
      
      reply.header('X-RateLimit-Remaining', '99');
      return result;
      
    } catch (error) {
      fastify.log.error('Residential validation failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Validation Failed',
        status: 422,
        detail: error instanceof Error ? error.message : 'Unknown validation error',
        code: 'VALIDATION_ERROR'
      };
      
      return reply.status(422).send(apiError);
    }
  });
}