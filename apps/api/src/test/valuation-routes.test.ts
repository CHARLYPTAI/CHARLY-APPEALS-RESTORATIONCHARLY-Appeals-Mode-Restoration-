import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { valuationRoutes } from '../routes/valuation.js';

describe('Valuation Routes', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
    
    // Add basic error handler for validation errors
    fastify.setErrorHandler((error, request, reply) => {
      if (error.validation) {
        const validationErrors: Record<string, string[]> = {};
        if (Array.isArray(error.validation)) {
          error.validation.forEach((err: any) => {
            const field = err.instancePath?.replace('/', '') || err.schemaPath || 'unknown';
            if (!validationErrors[field]) {
              validationErrors[field] = [];
            }
            validationErrors[field].push(err.message || 'Invalid value');
          });
        }

        const problemDetails = {
          type: 'about:blank',
          title: 'Validation Error',
          status: 400,
          detail: 'Request validation failed',
          code: 'VALIDATION_ERROR',
          errors: validationErrors
        };
        reply.status(400).send(problemDetails);
      } else {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    });

    // Add correlation ID hook
    fastify.addHook('onRequest', async (request, reply) => {
      const correlationId = request.headers['x-correlation-id'] as string || 'test-correlation-id';
      reply.header('x-correlation-id', correlationId);
    });
    
    await fastify.register(valuationRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('POST /valuation/sales-comparison', () => {
    const validPayload = {
      propertyId: 'OBZ-2023-001',
      comparables: [
        {
          id: 'comp1',
          address: '1200 Business Park Drive',
          saleDate: '2023-08-15',
          salePrice: 3150000,
          squareFootage: 28500,
          pricePerSF: 110.53,
          condition: 'good',
          location: 'similar',
          adjustments: {
            condition: 0,
            location: 0,
            time: 2000,
            other: 0
          },
          weight: 0.5
        },
        {
          id: 'comp2',
          address: '1300 Technology Boulevard',
          saleDate: '2023-06-22',
          salePrice: 2950000,
          squareFootage: 26800,
          pricePerSF: 110.07,
          condition: 'excellent',
          location: 'superior',
          adjustments: {
            condition: -5000,
            location: -8000,
            time: 8000,
            other: 0
          },
          weight: 0.5
        }
      ]
    };

    it('should return 200 with valid sales comparison calculation', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: validPayload
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.workfile_id).toBeDefined();
      expect(result.indicated_value).toBeGreaterThan(0);
      expect(result.weighted_avg_price_per_sf).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.rationale).toBeInstanceOf(Array);
      expect(result.rationale.length).toBeGreaterThan(0);
      expect(result.comparables).toBeInstanceOf(Array);
      expect(result.comparables).toHaveLength(2);
      expect(result.errors).toBeInstanceOf(Array);
    });

    it('should return 400 for missing propertyId', async () => {
      const invalidPayload = {
        ...validPayload,
        propertyId: undefined
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: invalidPayload
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.title).toBe('Validation Error');
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty comparables array', async () => {
      const invalidPayload = {
        ...validPayload,
        comparables: []
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: invalidPayload
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.title).toBe('Validation Error');
    });

    it('should return 400 for invalid comparable data', async () => {
      const invalidPayload = {
        ...validPayload,
        comparables: [
          {
            id: 'comp1',
            address: '1200 Business Park Drive',
            saleDate: 'invalid-date',
            salePrice: -1000000, // Invalid negative price
            squareFootage: 0, // Invalid zero footage
            condition: 'invalid-condition',
            location: 'invalid-location',
            adjustments: {
              condition: 0,
              location: 0,
              time: 0,
              other: 0
            },
            weight: 1.5 // Invalid weight > 1
          }
        ]
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: invalidPayload
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 200 even with validation errors in business logic', async () => {
      const payloadWithLogicErrors = {
        ...validPayload,
        comparables: [
          { ...validPayload.comparables[0], weight: 0.3 },
          { ...validPayload.comparables[1], weight: 0.4 } // Weights don't sum to 1.0
        ]
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: payloadWithLogicErrors
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('weights must sum to 1.0');
    });
  });

  describe('POST /valuation/cost-approach', () => {
    const validPayload = {
      propertyId: 'OBZ-2023-001',
      landValue: 800000,
      improvementCost: 2500000,
      age: 10,
      effectiveAge: 8,
      economicLife: 50,
      physicalDeterioration: 15,
      functionalObsolescence: 5,
      externalObsolescence: 0
    };

    it('should return 200 with valid cost approach calculation', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/cost-approach',
        payload: validPayload
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.workfile_id).toBeDefined();
      expect(result.cost_data).toBeDefined();
      expect(result.cost_data.landValue).toBe(800000);
      expect(result.cost_data.totalReplacementCost).toBe(2500000);
      expect(result.cost_data.indicatedValue).toBeGreaterThan(0);
      expect(result.cost_data.depreciation).toBeDefined();
      expect(result.cost_data.depreciation.total).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.errors).toBeInstanceOf(Array);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidPayload = {
        propertyId: 'test'
        // Missing all other required fields
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/cost-approach',
        payload: invalidPayload
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.title).toBe('Validation Error');
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for negative values', async () => {
      const invalidPayload = {
        ...validPayload,
        landValue: -100000,
        improvementCost: -500000,
        age: -5
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/cost-approach',
        payload: invalidPayload
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid percentage values', async () => {
      const invalidPayload = {
        ...validPayload,
        physicalDeterioration: 150, // > 100%
        functionalObsolescence: -10, // < 0%
        externalObsolescence: 200 // > 100%
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/cost-approach',
        payload: invalidPayload
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 200 even with business logic validation errors', async () => {
      const payloadWithLogicErrors = {
        ...validPayload,
        landValue: 0, // Should be > 0
        improvementCost: 0 // Should be > 0
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/cost-approach',
        payload: payloadWithLogicErrors
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /valuation/summary/:property_id', () => {
    it('should return 200 with valuation summary', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/valuation/summary/OBZ-2023-001'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.property_id).toBe('OBZ-2023-001');
      expect(result.approaches).toBeDefined();
      expect(result.approaches.income).toBeDefined();
      expect(result.approaches.sales).toBeDefined();
      expect(result.approaches.cost).toBeDefined();
      expect(result.reconciliation).toBeDefined();
      expect(result.reconciliation.final_value).toBeGreaterThan(0);
      expect(result.reconciliation.approach_weights).toBeDefined();
      expect(result.reconciliation.confidence).toBeGreaterThan(0);
      expect(result.reconciliation.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle any property ID (mock data)', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/valuation/summary/ANY-PROPERTY-ID'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.property_id).toBe('ANY-PROPERTY-ID');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/valuation/non-existent'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(500); // Fastify returns 500 for JSON parse errors
    });

    it('should include correlation ID in error responses', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: {},
        headers: {
          'x-correlation-id': 'test-correlation-123'
        }
      });

      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    it('should validate date format in sales comparison', async () => {
      const invalidPayload = {
        propertyId: 'test',
        comparables: [
          {
            id: 'comp1',
            address: 'Test Address',
            saleDate: 'not-a-date',
            salePrice: 1000000,
            squareFootage: 10000,
            pricePerSF: 100,
            condition: 'good',
            location: 'similar',
            adjustments: {
              condition: 0,
              location: 0,
              time: 0,
              other: 0
            },
            weight: 1.0
          }
        ]
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: invalidPayload
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate enum values for condition and location', async () => {
      const invalidPayload = {
        propertyId: 'test',
        comparables: [
          {
            id: 'comp1',
            address: 'Test Address',
            saleDate: '2023-01-01',
            salePrice: 1000000,
            squareFootage: 10000,
            pricePerSF: 100,
            condition: 'invalid-condition',
            location: 'invalid-location',
            adjustments: {
              condition: 0,
              location: 0,
              time: 0,
              other: 0
            },
            weight: 1.0
          }
        ]
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/valuation/sales-comparison',
        payload: invalidPayload
      });

      expect(response.statusCode).toBe(400);
    });
  });
});