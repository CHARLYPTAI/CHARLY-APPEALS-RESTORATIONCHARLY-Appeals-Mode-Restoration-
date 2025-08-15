import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ValuationService, type SalesComparisonRequest, type CostApproachRequest } from '../services/valuation-service.js';
import type { ApiError } from '../types/api.js';
import { validateUUID } from '../utils/validation.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';

export async function valuationRoutes(fastify: FastifyInstance) {
  const valuationService = new ValuationService();

  // Sales Comparison Approach
  fastify.post('/valuation/sales-comparison', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'comparables'],
        properties: {
          propertyId: { type: 'string' },
          comparables: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['id', 'address', 'saleDate', 'salePrice', 'squareFootage', 'condition', 'location', 'adjustments', 'weight'],
              properties: {
                id: { type: 'string' },
                address: { type: 'string' },
                saleDate: { type: 'string', format: 'date' },
                salePrice: { type: 'number', minimum: 0 },
                squareFootage: { type: 'number', minimum: 1 },
                pricePerSF: { type: 'number', minimum: 0 },
                condition: { type: 'string', enum: ['excellent', 'good', 'average', 'fair', 'poor'] },
                location: { type: 'string', enum: ['superior', 'similar', 'inferior'] },
                adjustments: {
                  type: 'object',
                  required: ['condition', 'location', 'time', 'other'],
                  properties: {
                    condition: { type: 'number' },
                    location: { type: 'number' },
                    time: { type: 'number' },
                    other: { type: 'number' }
                  }
                },
                weight: { type: 'number', minimum: 0, maximum: 1 }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            workfile_id: { type: 'string' },
            indicated_value: { type: 'number' },
            weighted_avg_price_per_sf: { type: 'number' },
            confidence: { type: 'number' },
            rationale: { type: 'array', items: { type: 'string' } },
            comparables: { type: 'array' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: SalesComparisonRequest }>, reply: FastifyReply) => {
    try {
      const result = await valuationService.calculateSalesComparison(request.body);
      
      if (result.errors.length > 0) {
        fastify.log.warn('Sales comparison validation errors:', sanitizeForLogging(result.errors));
      }
      
      return reply.status(200).send(result);
      
    } catch (error) {
      fastify.log.error('Sales comparison calculation failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Sales Comparison Calculation Failed',
        status: 500,
        detail: 'An error occurred while calculating the sales comparison valuation',
        code: 'SALES_COMPARISON_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });

  // Cost Approach
  fastify.post('/valuation/cost-approach', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'landValue', 'improvementCost', 'age', 'effectiveAge', 'economicLife'],
        properties: {
          propertyId: { type: 'string' },
          landValue: { type: 'number', minimum: 0 },
          improvementCost: { type: 'number', minimum: 0 },
          age: { type: 'number', minimum: 0 },
          effectiveAge: { type: 'number', minimum: 0 },
          economicLife: { type: 'number', minimum: 1 },
          physicalDeterioration: { type: 'number', minimum: 0, maximum: 100 },
          functionalObsolescence: { type: 'number', minimum: 0, maximum: 100 },
          externalObsolescence: { type: 'number', minimum: 0, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            workfile_id: { type: 'string' },
            cost_data: {
              type: 'object',
              properties: {
                landValue: { type: 'number' },
                improvementValue: { type: 'number' },
                totalReplacementCost: { type: 'number' },
                depreciation: {
                  type: 'object',
                  properties: {
                    physical: { type: 'number' },
                    functional: { type: 'number' },
                    external: { type: 'number' },
                    total: { type: 'number' }
                  }
                },
                depreciatedValue: { type: 'number' },
                indicatedValue: { type: 'number' }
              }
            },
            confidence: { type: 'number' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: CostApproachRequest }>, reply: FastifyReply) => {
    try {
      const result = await valuationService.calculateCostApproach(request.body);
      
      if (result.errors.length > 0) {
        fastify.log.warn('Cost approach validation errors:', sanitizeForLogging(result.errors));
      }
      
      return reply.status(200).send(result);
      
    } catch (error) {
      fastify.log.error('Cost approach calculation failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Cost Approach Calculation Failed',
        status: 500,
        detail: 'An error occurred while calculating the cost approach valuation',
        code: 'COST_APPROACH_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });

  // Get valuation summary for a property (combines all approaches)
  fastify.get('/valuation/summary/:property_id', {
    schema: {
      params: {
        type: 'object',
        required: ['property_id'],
        properties: {
          property_id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            property_id: { type: 'string' },
            approaches: {
              type: 'object',
              properties: {
                income: { type: 'object' },
                sales: { type: 'object' },
                cost: { type: 'object' }
              }
            },
            reconciliation: {
              type: 'object',
              properties: {
                final_value: { type: 'number' },
                approach_weights: { type: 'object' },
                confidence: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { property_id: string } }>, reply: FastifyReply) => {
    try {
      const propertyId = request.params.property_id;
      
      // Mock response for now - in production this would aggregate actual calculations
      const summary = {
        property_id: propertyId,
        approaches: {
          income: {
            indicated_value: 3206604,
            confidence: 0.87,
            method: 'Direct Capitalization'
          },
          sales: {
            indicated_value: 3168500,
            confidence: 0.84,
            comparables_count: 3
          },
          cost: {
            indicated_value: 3150000,
            confidence: 0.76,
            depreciation_total: 0.25
          }
        },
        reconciliation: {
          final_value: 3180000,
          approach_weights: {
            income: 0.45,
            sales: 0.35,
            cost: 0.20
          },
          confidence: 0.83
        }
      };
      
      return reply.status(200).send(summary);
      
    } catch (error) {
      fastify.log.error('Valuation summary failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Valuation Summary Failed',
        status: 500,
        detail: 'An error occurred while retrieving the valuation summary',
        code: 'VALUATION_SUMMARY_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });
}