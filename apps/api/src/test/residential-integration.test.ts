import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { authRoutes } from '../routes/auth.js';
import { residentialRoutes } from '../routes/residential/residential-router.js';
import fastifyJwt from '@fastify/jwt';

describe('Residential Integration Tests', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Register plugins and routes
    await app.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'test-secret' });
    await app.register(authRoutes, { prefix: '/api/v1' });
    await app.register(residentialRoutes, { prefix: '/api/v1/r' });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Get a valid residential auth token for testing
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/residential/login',
      payload: {
        email: 'demo@example.com',
        password: 'password123'
      }
    });

    expect(loginResponse.statusCode).toBe(200);
    const loginData = JSON.parse(loginResponse.body);
    authToken = loginData.access_token;
    expect(authToken).toBeDefined();
  });

  describe('Residential Property Management', () => {
    it('should create a new residential property', async () => {
      const propertyData = {
        property_address: '123 Residential Ave, Test City, CA 90210',
        assessed_value: 500000,
        market_value: 550000,
        jurisdiction: 'Test County',
        tax_year: 2024,
        homestead_exemption: true,
        square_footage: 2000,
        lot_size: 0.5,
        year_built: 2000,
        bedrooms: 4,
        bathrooms: 3,
        property_type: 'single_family',
        garage_spaces: 2
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/r/properties',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: propertyData
      });

      expect(response.statusCode).toBe(201);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.property).toBeDefined();
      expect(responseData.property.id).toBeDefined();
      expect(responseData.property.property_address).toBe(propertyData.property_address);
      expect(responseData.property.tenant_type).toBe('RESIDENTIAL');
      expect(responseData.message).toBe('Residential property created successfully');
    });

    it('should list residential properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/properties',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.properties).toBeDefined();
      expect(Array.isArray(responseData.properties)).toBe(true);
      expect(responseData.tenant_type).toBe('RESIDENTIAL');
      expect(responseData.count).toBeDefined();
    });

    it('should get a specific residential property', async () => {
      // First create a property
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/r/properties',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          property_address: '456 Test Lane, Test City, CA 90210'
        }
      });

      const createData = JSON.parse(createResponse.body);
      const propertyId = createData.property.id;

      // Then get it
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/r/properties/${propertyId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.property).toBeDefined();
      expect(responseData.property.id).toBe(propertyId);
      expect(responseData.tenant_type).toBe('RESIDENTIAL');
    });

    it('should return 404 for non-existent property', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/properties/550e8400-e29b-41d4-a716-446655440000',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Residential AI Processing', () => {
    it('should process residential sales approach documents', async () => {
      const aiRequest = {
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        approach: 'sales',
        documents: [
          {
            id: 'doc-1',
            filename: 'comparable-sales.pdf',
            type: 'comparable_sales',
            content: 'Sample comparable sales data for residential property analysis...',
            uploadDate: new Date().toISOString()
          }
        ],
        targetYear: 2024
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/r/ai/residential/parse',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: aiRequest
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.tenant_type).toBe('RESIDENTIAL');
      expect(responseData.residential_specific).toBe(true);
      expect(responseData.requestId).toBeDefined();
      expect(responseData.approach).toBe('sales');
    });

    it('should process residential cost approach documents', async () => {
      const aiRequest = {
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        approach: 'cost',
        documents: [
          {
            id: 'doc-2',
            filename: 'construction-costs.pdf',
            type: 'building_records',
            content: 'Sample construction cost data for residential property...',
            uploadDate: new Date().toISOString()
          }
        ],
        targetYear: 2024
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/r/ai/residential/parse',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: aiRequest
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.tenant_type).toBe('RESIDENTIAL');
      expect(responseData.residential_specific).toBe(true);
      expect(responseData.approach).toBe('cost');
    });

    it('should process residential income approach documents', async () => {
      const aiRequest = {
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        approach: 'income',
        documents: [
          {
            id: 'doc-3',
            filename: 'rental-income.pdf',
            type: 'property_tax_record',
            content: 'Sample rental income data for residential investment property...',
            uploadDate: new Date().toISOString()
          }
        ],
        targetYear: 2024
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/r/ai/residential/parse',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: aiRequest
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.tenant_type).toBe('RESIDENTIAL');
      expect(responseData.residential_specific).toBe(true);
      expect(responseData.approach).toBe('income');
    });

    it('should validate approach parameter', async () => {
      const invalidRequest = {
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        approach: 'invalid_approach',
        documents: [
          {
            id: 'doc-1',
            filename: 'test.pdf',
            type: 'other',
            content: 'test content',
            uploadDate: new Date().toISOString()
          }
        ]
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/r/ai/residential/parse',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: invalidRequest
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Residential Narrative Generation', () => {
    it('should generate residential narratives', async () => {
      const narrativeRequest = {
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        approaches: [
          {
            approach: 'sales',
            indicatedValue: 480000,
            confidence: 0.85,
            weight: 1.0,
            completed: true,
            rationale: [
              'Comparable sales analysis shows market value around $480,000',
              'Recent sales in neighborhood support this valuation',
              'Property features are consistent with market expectations'
            ]
          }
        ],
        propertyData: {
          address: '123 Residential Ave, Test City, CA 90210',
          assessedValue: 500000,
          estimatedMarketValue: 480000,
          jurisdiction: 'Test County'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/r/narratives/generate',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: narrativeRequest
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.tenant_type).toBe('RESIDENTIAL');
      expect(responseData.residential_specific).toBe(true);
      expect(responseData.sections).toBeDefined();
      expect(Array.isArray(responseData.sections)).toBe(true);
    });
  });

  describe('Residential Appeal Packet Generation', () => {
    it('should generate residential appeal packets', async () => {
      const appealRequest = {
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        approaches: [
          {
            approach: 'sales',
            indicatedValue: 480000,
            confidence: 0.85,
            weight: 1.0,
            completed: true,
            rationale: [
              'Sales comparison analysis supports $480,000 valuation',
              'Market data from past 12 months'
            ]
          }
        ],
        reconciliation: {
          finalValue: 480000,
          overallConfidence: 0.85,
          recommendation: 'APPEAL',
          savingsEstimate: 2400
        },
        narrativeSections: [],
        propertyData: {
          address: '123 Residential Ave, Test City, CA 90210',
          assessedValue: 500000,
          jurisdiction: 'Test County'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/r/appeal-packet/generate',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: appealRequest
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.tenant_type).toBe('RESIDENTIAL');
      expect(responseData.residential_specific).toBe(true);
      expect(responseData.packet_id).toBeDefined();
      expect(responseData.status).toBe('GENERATED');
      expect(responseData.download_url).toBeDefined();
    });
  });

  describe('Tenant Isolation', () => {
    it('should require residential authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/properties'
        // No auth header
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject commercial tokens', async () => {
      // Get a commercial token
      const commercialLoginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/commercial/login',
        payload: {
          email: 'demo@example.com',
          password: 'password123'
        }
      });

      const commercialData = JSON.parse(commercialLoginResponse.body);
      const commercialToken = commercialData.access_token;

      // Try to use it for residential endpoints
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/properties',
        headers: {
          authorization: `Bearer ${commercialToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status for residential tenant', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/r/health',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.body);
      
      expect(responseData.status).toBe('healthy');
      expect(responseData.tenant).toBe('residential');
      expect(responseData.timestamp).toBeDefined();
      expect(responseData.user).toBeDefined();
    });
  });
});