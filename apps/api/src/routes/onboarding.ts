import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OnboardingService } from '../services/onboarding-service.js';
import type { 
  CustomerRegistrationRequest, 
  OnboardingStepRequest,
  ApiError 
} from '../types/onboarding.js';
import { validateUUID } from '../utils/validation.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';

export async function onboardingRoutes(fastify: FastifyInstance) {
  const onboardingService = new OnboardingService();

  fastify.post('/onboarding/customers', {
    schema: {
      body: {
        type: 'object',
        required: ['organization', 'primary_contact', 'jurisdictions', 'expected_monthly_appeals'],
        properties: {
          organization: {
            type: 'object',
            required: ['name', 'type', 'size', 'address', 'phone'],
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 255 },
              type: { type: 'string', enum: ['property_management', 'commercial_real_estate', 'law_firm', 'other'] },
              size: { type: 'string', enum: ['small', 'medium', 'large', 'enterprise'] },
              address: {
                type: 'object',
                required: ['street', 'city', 'state', 'zip', 'country'],
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zip: { type: 'string' },
                  country: { type: 'string' }
                }
              },
              phone: { type: 'string' },
              website: { type: 'string', format: 'uri' }
            }
          },
          primary_contact: {
            type: 'object',
            required: ['first_name', 'last_name', 'email', 'phone', 'title'],
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              title: { type: 'string' }
            }
          },
          billing_contact: {
            type: 'object',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              title: { type: 'string' }
            }
          },
          jurisdictions: { 
            type: 'array', 
            items: { type: 'string' },
            minItems: 1 
          },
          expected_monthly_appeals: { type: 'number', minimum: 1 },
          integration_preferences: {
            type: 'object',
            properties: {
              api_access: { type: 'boolean' },
              webhook_url: { type: 'string', format: 'uri' },
              sso_required: { type: 'boolean' },
              white_label: { type: 'boolean' }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            customer_id: { type: 'string' },
            organization_id: { type: 'string' },
            api_key: { type: 'string' },
            onboarding_status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
            next_steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step: { type: 'string' },
                  description: { type: 'string' },
                  deadline: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      request.rateLimit = { remaining: 10 };
    }
  }, async (request: FastifyRequest<{ Body: CustomerRegistrationRequest }>, reply: FastifyReply) => {
    try {
      const result = await onboardingService.registerCustomer(request.body);
      
      reply.header('X-RateLimit-Remaining', '9');
      return reply.status(201).send(result);
      
    } catch (error) {
      fastify.log.error('Customer registration failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Registration Failed',
        status: 422,
        detail: error instanceof Error ? error.message : 'Unknown error',
        code: 'REGISTRATION_ERROR'
      };
      
      return reply.status(422).send(apiError);
    }
  });

  fastify.get('/onboarding/customers/:customer_id/status', {
    schema: {
      params: {
        type: 'object',
        required: ['customer_id'],
        properties: {
          customer_id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { customer_id: string } }>, reply: FastifyReply) => {
    try {
      const customerIdValidation = validateUUID(request.params.customer_id, 'customer_id');
      if (!customerIdValidation.valid) {
        const apiError: ApiError = {
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: customerIdValidation.errors?.join(', ') || 'Invalid customer ID format',
          code: 'INVALID_CUSTOMER_ID'
        };
        return reply.status(400).send(apiError);
      }

      const status = await onboardingService.getOnboardingStatus(customerIdValidation.data!);
      
      reply.header('X-RateLimit-Remaining', '99');
      return status;
      
    } catch (error) {
      fastify.log.error('Failed to get onboarding status:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Status Retrieval Failed',
        status: 404,
        detail: error instanceof Error ? error.message : 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      };
      
      return reply.status(404).send(apiError);
    }
  });

  fastify.post('/onboarding/customers/:customer_id/steps', {
    schema: {
      params: {
        type: 'object',
        required: ['customer_id'],
        properties: {
          customer_id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['step_type'],
        properties: {
          step_type: { 
            type: 'string', 
            enum: ['sample_data_upload', 'jurisdiction_verification', 'api_integration_test', 'final_review'] 
          },
          data: {}
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { customer_id: string },
    Body: Omit<OnboardingStepRequest, 'customer_id'>
  }>, reply: FastifyReply) => {
    try {
      const customerIdValidation = validateUUID(request.params.customer_id, 'customer_id');
      if (!customerIdValidation.valid) {
        const apiError: ApiError = {
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: customerIdValidation.errors?.join(', ') || 'Invalid customer ID format',
          code: 'INVALID_CUSTOMER_ID'
        };
        return reply.status(400).send(apiError);
      }

      const stepRequest: OnboardingStepRequest = {
        customer_id: customerIdValidation.data!,
        ...request.body
      };
      
      const result = await onboardingService.processOnboardingStep(stepRequest);
      
      reply.header('X-RateLimit-Remaining', '99');
      return result;
      
    } catch (error) {
      fastify.log.error('Onboarding step failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Onboarding Step Failed',
        status: 422,
        detail: error instanceof Error ? error.message : 'Unknown error',
        code: 'STEP_PROCESSING_ERROR'
      };
      
      return reply.status(422).send(apiError);
    }
  });

  fastify.get('/onboarding/customers/:customer_id/kpis', {
    schema: {
      params: {
        type: 'object',
        required: ['customer_id'],
        properties: {
          customer_id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { customer_id: string } }>, reply: FastifyReply) => {
    try {
      const customerIdValidation = validateUUID(request.params.customer_id, 'customer_id');
      if (!customerIdValidation.valid) {
        const apiError: ApiError = {
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: customerIdValidation.errors?.join(', ') || 'Invalid customer ID format',
          code: 'INVALID_CUSTOMER_ID'
        };
        return reply.status(400).send(apiError);
      }

      const kpis = await onboardingService.getKPIData(customerIdValidation.data!);
      
      reply.header('X-RateLimit-Remaining', '99');
      return kpis;
      
    } catch (error) {
      fastify.log.error('Failed to get KPI data:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'KPI Retrieval Failed',
        status: 404,
        detail: error instanceof Error ? error.message : 'KPI data not found',
        code: 'KPI_NOT_FOUND'
      };
      
      return reply.status(404).send(apiError);
    }
  });
}