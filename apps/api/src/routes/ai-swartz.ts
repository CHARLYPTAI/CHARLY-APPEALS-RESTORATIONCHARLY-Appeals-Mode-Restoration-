import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AISwartzService } from '../services/ai-swartz-service.js';
import type { SwartzParseRequest } from '../services/ai-swartz-service.js';
import type { ApiError } from '../types/api.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';

export async function aiSwartzRoutes(fastify: FastifyInstance) {
  const swartzService = new AISwartzService();

  // Parse income approach documents
  fastify.post('/ai/swartz/income', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'documents'],
        properties: {
          propertyId: { type: 'string' },
          documents: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['id', 'filename', 'type', 'content'],
              properties: {
                id: { type: 'string' },
                filename: { type: 'string' },
                type: { 
                  type: 'string', 
                  enum: ['income_statement', 'rent_roll', 'profit_loss', 'cash_flow', 'other'] 
                },
                content: { type: 'string' },
                uploadDate: { type: 'string' }
              }
            }
          },
          targetYear: { type: 'number', minimum: 2020, maximum: 2030 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            approach: { type: 'string', enum: ['income'] },
            incomeData: {
              type: 'object',
              properties: {
                grossRentalIncome: { type: 'number' },
                vacancyRate: { type: 'number' },
                effectiveGrossIncome: { type: 'number' },
                operatingExpenses: { type: 'number' },
                netOperatingIncome: { type: 'number' },
                capRate: { type: 'number' },
                indicatedValue: { type: 'number' },
                confidence: { type: 'number' },
                methodology: { type: 'string' }
              }
            },
            extractedFields: { type: 'object' },
            confidence: { type: 'number' },
            warnings: { type: 'array', items: { type: 'string' } },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: SwartzParseRequest }>, reply: FastifyReply) => {
    try {
      const parseRequest = { ...request.body, approach: 'income' as const };
      const result = await swartzService.parseIncomeApproach(parseRequest);
      
      if (result.errors.length > 0) {
        fastify.log.warn('Income approach parsing errors:', sanitizeForLogging(result.errors));
      }
      
      return reply.status(200).send(result);
      
    } catch (error) {
      fastify.log.error('Income approach parsing failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Income Approach Parsing Failed',
        status: 500,
        detail: 'An error occurred while parsing income approach documents with AI',
        code: 'AI_INCOME_PARSING_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });

  // Parse sales comparison documents
  fastify.post('/ai/swartz/sales', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'documents'],
        properties: {
          propertyId: { type: 'string' },
          documents: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['id', 'filename', 'type', 'content'],
              properties: {
                id: { type: 'string' },
                filename: { type: 'string' },
                type: { 
                  type: 'string', 
                  enum: ['income_statement', 'rent_roll', 'profit_loss', 'cash_flow', 'other'] 
                },
                content: { type: 'string' },
                uploadDate: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            approach: { type: 'string', enum: ['sales'] },
            salesData: {
              type: 'object',
              properties: {
                comparables: { type: 'array' },
                indicatedValue: { type: 'number' },
                confidence: { type: 'number' }
              }
            },
            extractedFields: { type: 'object' },
            confidence: { type: 'number' },
            warnings: { type: 'array', items: { type: 'string' } },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: SwartzParseRequest }>, reply: FastifyReply) => {
    try {
      const parseRequest = { ...request.body, approach: 'sales' as const };
      const result = await swartzService.parseSalesComparison(parseRequest);
      
      if (result.errors.length > 0) {
        fastify.log.warn('Sales comparison parsing errors:', sanitizeForLogging(result.errors));
      }
      
      return reply.status(200).send(result);
      
    } catch (error) {
      fastify.log.error('Sales comparison parsing failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Sales Comparison Parsing Failed',
        status: 500,
        detail: 'An error occurred while parsing sales comparison documents with AI',
        code: 'AI_SALES_PARSING_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });

  // Parse cost approach documents
  fastify.post('/ai/swartz/cost', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'documents'],
        properties: {
          propertyId: { type: 'string' },
          documents: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['id', 'filename', 'type', 'content'],
              properties: {
                id: { type: 'string' },
                filename: { type: 'string' },
                type: { 
                  type: 'string', 
                  enum: ['income_statement', 'rent_roll', 'profit_loss', 'cash_flow', 'other'] 
                },
                content: { type: 'string' },
                uploadDate: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            approach: { type: 'string', enum: ['cost'] },
            costData: {
              type: 'object',
              properties: {
                landValue: { type: 'number' },
                improvementCost: { type: 'number' },
                depreciation: { type: 'object' },
                indicatedValue: { type: 'number' },
                confidence: { type: 'number' }
              }
            },
            extractedFields: { type: 'object' },
            confidence: { type: 'number' },
            warnings: { type: 'array', items: { type: 'string' } },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: SwartzParseRequest }>, reply: FastifyReply) => {
    try {
      const parseRequest = { ...request.body, approach: 'cost' as const };
      const result = await swartzService.parseCostApproach(parseRequest);
      
      if (result.errors.length > 0) {
        fastify.log.warn('Cost approach parsing errors:', sanitizeForLogging(result.errors));
      }
      
      return reply.status(200).send(result);
      
    } catch (error) {
      fastify.log.error('Cost approach parsing failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Cost Approach Parsing Failed',
        status: 500,
        detail: 'An error occurred while parsing cost approach documents with AI',
        code: 'AI_COST_PARSING_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });

  // Get AI/LLM router status and statistics
  fastify.get('/ai/status', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            providers: { type: 'object' },
            totalRequests: { type: 'number' },
            totalCost: { type: 'number' },
            avgResponseTime: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Import router dynamically to avoid dependency issues if disabled
      const { getRouter } = await import('@charly/llm-router');
      const router = getRouter();
      
      const stats = await router.getProviderStats();
      
      return reply.status(200).send({
        enabled: true,
        providers: stats,
        totalRequests: Object.values(stats).reduce((sum: number, provider: any) => 
          sum + (provider.budget?.requestCount || 0), 0),
        totalCost: Object.values(stats).reduce((sum: number, provider: any) => 
          sum + (provider.budget?.spentCents || 0), 0) / 100,
        avgResponseTime: 250 // Placeholder - would track in production
      });
      
    } catch (error) {
      fastify.log.error('AI status check failed:', sanitizeForLogging(error));
      
      return reply.status(200).send({
        enabled: false,
        providers: {},
        totalRequests: 0,
        totalCost: 0,
        avgResponseTime: 0
      });
    }
  });
}