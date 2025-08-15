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
          property: {
            type: 'object',
            required: ['property_address'],
            properties: {
              property_address: { type: 'string', minLength: 5 },
              assessed_value: { type: 'number', minimum: 0 },
              market_value: { type: 'number', minimum: 0 },
              jurisdiction: { type: 'string' },
              tax_year: { type: 'number', minimum: 2000, maximum: 2030 },
              homestead_exemption: { type: 'boolean' },
              square_footage: { type: 'number', minimum: 100 },
              lot_size: { type: 'number', minimum: 0 },
              year_built: { type: 'number', minimum: 1800, maximum: 2030 },
              bedrooms: { type: 'number', minimum: 0, maximum: 20 },
              bathrooms: { type: 'number', minimum: 0, maximum: 20 },
              property_type: { 
                type: 'string', 
                enum: ['single_family', 'condo', 'townhome', 'duplex', 'other'] 
              },
              garage_spaces: { type: 'number', minimum: 0, maximum: 10 },
              property_data: { type: 'object' }
            }
          },
          comp_refs: { type: 'array', items: { type: 'string' } },
          neighborhood_analysis: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            workfile_id: { type: 'string' },
            normalized: { type: 'object' },
            errors: { type: 'array', items: { type: 'string' } },
            decision_preview: {
              type: 'object',
              properties: {
                label: { type: 'string', enum: ['OVER', 'FAIR', 'UNDER'] },
                confidence: { type: 'number' },
                savings_estimate: { type: 'number' }
              }
            },
            residential_analysis: {
              type: 'object',
              properties: {
                neighborhood_stats: { type: 'object' },
                property_features: { type: 'object' },
                market_trends: { type: 'object' }
              }
            }
          }
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