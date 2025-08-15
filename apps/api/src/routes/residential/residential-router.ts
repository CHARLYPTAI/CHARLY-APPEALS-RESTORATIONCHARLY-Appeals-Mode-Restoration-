import { FastifyInstance } from 'fastify';
import { requireResidentialTenant } from '../../middleware/tenant-auth.js';
import { uploadsRoutes } from '../uploads.js';
import { validateRoutes } from '../validate.js';
import { appealPacketRoutes } from '../appeal-packet.js';
import { onboardingRoutes } from '../onboarding.js';
import { jurisdictionsRoutes } from '../jurisdictions.js';
import { valuationRoutes } from '../valuation.js';
import { resultsRoutes } from '../results.js';
import { aiSwartzRoutes } from '../ai-swartz.js';

export async function residentialRoutes(fastify: FastifyInstance) {
  // All residential routes require residential tenant access
  fastify.addHook('preHandler', requireResidentialTenant);

  // Residential health check
  fastify.get('/health', async (request) => {
    return { 
      status: 'healthy', 
      tenant: 'residential',
      timestamp: new Date().toISOString(),
      user: request.tenant?.userId
    };
  });

  // Register all residential routes under tenant protection
  // These routes will automatically work with the residential data models
  // due to the Row Level Security (RLS) implementation
  await fastify.register(uploadsRoutes);
  await fastify.register(validateRoutes);
  await fastify.register(appealPacketRoutes);
  await fastify.register(onboardingRoutes);
  await fastify.register(jurisdictionsRoutes);
  await fastify.register(valuationRoutes);
  await fastify.register(resultsRoutes);
  await fastify.register(aiSwartzRoutes);

  // Residential-specific property management endpoints
  fastify.get('/properties', async (request) => {
    try {
      const client = await request.tenant!.getDbClient();
      try {
        const result = await client.query(
          'SELECT id, property_address, assessed_value, market_value, jurisdiction, tax_year, homestead_exemption, square_footage, lot_size, year_built, created_at FROM residential_properties WHERE user_id = $1 ORDER BY created_at DESC',
          [request.tenant!.userId]
        );
        
        return {
          properties: result.rows,
          tenant_type: request.tenant?.tenantType,
          count: result.rows.length
        };
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error('Failed to fetch residential properties:', error);
      return fastify.httpErrors.internalServerError('Failed to fetch properties');
    }
  });

  fastify.post('/properties', {
    schema: {
      body: {
        type: 'object',
        required: ['property_address'],
        properties: {
          property_address: { type: 'string' },
          assessed_value: { type: 'number' },
          market_value: { type: 'number' },
          jurisdiction: { type: 'string' },
          tax_year: { type: 'number' },
          homestead_exemption: { type: 'boolean' },
          square_footage: { type: 'number' },
          lot_size: { type: 'number' },
          year_built: { type: 'number' },
          property_data: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const client = await request.tenant!.getDbClient();
      try {
        const result = await client.query(
          `INSERT INTO residential_properties 
           (user_id, tenant_type, property_address, assessed_value, market_value, jurisdiction, tax_year, homestead_exemption, square_footage, lot_size, year_built, property_data) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
           RETURNING *`,
          [
            request.tenant!.userId,
            'RESIDENTIAL',
            request.body.property_address,
            request.body.assessed_value || null,
            request.body.market_value || null,
            request.body.jurisdiction || null,
            request.body.tax_year || null,
            request.body.homestead_exemption || false,
            request.body.square_footage || null,
            request.body.lot_size || null,
            request.body.year_built || null,
            request.body.property_data || {}
          ]
        );
        
        return reply.status(201).send({
          property: result.rows[0],
          message: 'Residential property created successfully'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error('Failed to create residential property:', error);
      return fastify.httpErrors.internalServerError('Failed to create property');
    }
  });

  fastify.get('/properties/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const client = await request.tenant!.getDbClient();
      try {
        const result = await client.query(
          'SELECT * FROM residential_properties WHERE id = $1 AND user_id = $2',
          [id, request.tenant!.userId]
        );
        
        if (result.rows.length === 0) {
          return fastify.httpErrors.notFound('Property not found');
        }
        
        return {
          property: result.rows[0],
          tenant_type: request.tenant?.tenantType
        };
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error('Failed to fetch residential property:', error);
      return fastify.httpErrors.internalServerError('Failed to fetch property');
    }
  });

  // Residential-specific AI processing for residential formats
  fastify.post('/ai/residential/parse', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'documents', 'approach'],
        properties: {
          propertyId: { type: 'string' },
          approach: { type: 'string', enum: ['sales', 'cost', 'income'] },
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
                  enum: ['property_tax_record', 'comparable_sales', 'building_records', 'assessor_data', 'other'] 
                },
                content: { type: 'string' },
                uploadDate: { type: 'string' }
              }
            }
          },
          targetYear: { type: 'number', minimum: 2020, maximum: 2030 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // This will use the same AI/SWARTZ parsing but with residential-specific prompts
      // The residential parsing adapts the Commercial SWARTZ logic for residential formats
      const { approach } = request.body;
      
      // Import SWARTZ service dynamically
      const { AISwartzService } = await import('../../services/ai-swartz-service.js');
      const swartzService = new AISwartzService();
      
      let result;
      const parseRequest = {
        ...request.body,
        approach: approach as 'sales' | 'cost' | 'income',
        residential: true  // Flag to use residential-specific parsing logic
      };
      
      switch (approach) {
        case 'sales':
          result = await swartzService.parseSalesComparison(parseRequest);
          break;
        case 'cost':
          result = await swartzService.parseCostApproach(parseRequest);
          break;
        case 'income':
          // For residential, income approach is rare but possible (rental properties)
          result = await swartzService.parseIncomeApproach(parseRequest);
          break;
        default:
          return fastify.httpErrors.badRequest('Invalid approach specified');
      }
      
      return reply.status(200).send({
        ...result,
        tenant_type: 'RESIDENTIAL',
        residential_specific: true
      });
      
    } catch (error) {
      fastify.log.error('Residential AI parsing failed:', error);
      return fastify.httpErrors.internalServerError('Residential document parsing failed');
    }
  });

  // Residential-specific narrative generation
  fastify.post('/narratives/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'approaches', 'propertyData'],
        properties: {
          propertyId: { type: 'string' },
          approaches: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['approach', 'indicatedValue', 'confidence', 'weight', 'completed', 'rationale'],
              properties: {
                approach: { type: 'string', enum: ['income', 'sales', 'cost'] },
                indicatedValue: { type: 'number', minimum: 0 },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                weight: { type: 'number', minimum: 0, maximum: 1 },
                completed: { type: 'boolean' },
                rationale: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          propertyData: {
            type: 'object',
            required: ['address', 'assessedValue', 'estimatedMarketValue', 'jurisdiction'],
            properties: {
              address: { type: 'string' },
              assessedValue: { type: 'number' },
              estimatedMarketValue: { type: 'number' },
              jurisdiction: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Import narrative service dynamically
      const { AINewNarrativeService } = await import('../../services/ai-narrative-service.js');
      const narrativeService = new AINewNarrativeService();
      
      const narrativeRequest = {
        ...request.body,
        propertyType: 'residential' as const
      };
      
      const result = await narrativeService.generateResidentialNarrative(narrativeRequest);
      
      return reply.status(200).send({
        ...result,
        tenant_type: 'RESIDENTIAL',
        residential_specific: true
      });
      
    } catch (error) {
      fastify.log.error('Residential narrative generation failed:', error);
      return fastify.httpErrors.internalServerError('Residential narrative generation failed');
    }
  });

  // Residential-specific appeal packet generation
  fastify.post('/appeal-packet/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'approaches', 'reconciliation'],
        properties: {
          propertyId: { type: 'string' },
          approaches: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['approach', 'indicatedValue', 'confidence', 'weight', 'completed', 'rationale'],
              properties: {
                approach: { type: 'string', enum: ['income', 'sales', 'cost'] },
                indicatedValue: { type: 'number', minimum: 0 },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                weight: { type: 'number', minimum: 0, maximum: 1 },
                completed: { type: 'boolean' },
                rationale: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          reconciliation: {
            type: 'object',
            required: ['finalValue', 'overallConfidence', 'recommendation', 'savingsEstimate'],
            properties: {
              finalValue: { type: 'number', minimum: 0 },
              overallConfidence: { type: 'number', minimum: 0, maximum: 1 },
              recommendation: { type: 'string', enum: ['APPEAL', 'MONITOR', 'NO_ACTION'] },
              savingsEstimate: { type: 'number', minimum: 0 }
            }
          },
          narrativeSections: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'title', 'content'],
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' }
              }
            }
          },
          propertyData: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              assessedValue: { type: 'number' },
              jurisdiction: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Import appeal service dynamically
      const { AppealService } = await import('../../services/appeal-service.js');
      const appealService = new AppealService();
      
      // Add residential property type to request
      const appealRequest = {
        ...request.body,
        propertyType: 'residential' as const
      };
      
      const result = await appealService.generateComprehensivePacket(appealRequest);
      
      return reply.status(200).send({
        ...result,
        tenant_type: 'RESIDENTIAL',
        residential_specific: true
      });
      
    } catch (error) {
      fastify.log.error('Residential appeal packet generation failed:', error);
      return fastify.httpErrors.internalServerError('Residential appeal packet generation failed');
    }
  });
}