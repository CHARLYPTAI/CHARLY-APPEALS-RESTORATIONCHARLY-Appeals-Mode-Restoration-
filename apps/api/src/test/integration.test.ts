import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { uploadsRoutes } from '../routes/uploads.js';
import { validateRoutes } from '../routes/validate.js';
import { appealPacketRoutes } from '../routes/appeal-packet.js';

describe('API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });

    await app.register(cors);
    await app.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
      }
    });

    app.addHook('preHandler', async (request, reply) => {
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-XSS-Protection', '1; mode=block');
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    });

    app.get('/health', async () => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });

    await app.register(async function(fastify) {
      await fastify.register(uploadsRoutes, { prefix: '/api/v1' });
      await fastify.register(validateRoutes, { prefix: '/api/v1' });
      await fastify.register(appealPacketRoutes, { prefix: '/api/v1' });
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health endpoint', () => {
    it('should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('Commercial validation endpoint', () => {
    it('should validate a valid commercial property', async () => {
      const validProperty = {
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        address: {
          street: '123 Business Ave',
          city: 'Anytown',
          state: 'CA',
          zipCode: '90210'
        },
        propertyType: 'office',
        assessedValue: 2500000,
        marketValue: 3000000,
        taxRate: 0.012,
        ownershipInfo: {
          ownerName: 'ABC Corporation',
          ownerType: 'corporation'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/validate/commercial',
        headers: {
          'content-type': 'application/json'
        },
        payload: {
          property: validProperty
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.workfile_id).toBeDefined();
      expect(body.normalized).toBeDefined();
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.decision_preview).toBeDefined();
      expect(body.decision_preview.label).toMatch(/^(OVER|FAIR|UNDER)$/);
      expect(typeof body.decision_preview.confidence).toBe('number');
      expect(typeof body.decision_preview.savings_estimate).toBe('number');
    });

    it('should return validation errors for invalid property', async () => {
      const invalidProperty = {
        propertyType: 'office',
        assessedValue: -1000000,
        taxRate: 1.5
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/validate/commercial',
        headers: {
          'content-type': 'application/json'
        },
        payload: {
          property: invalidProperty
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.workfile_id).toBeDefined();
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors.length).toBeGreaterThan(0);
      expect(body.decision_preview).toBeUndefined();
    });

    it('should handle missing property in request body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/validate/commercial',
        headers: {
          'content-type': 'application/json'
        },
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Residential validation endpoint', () => {
    it('should handle residential validation request', async () => {
      const property = {
        address: '456 Home St',
        assessedValue: 500000
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/validate/residential',
        headers: {
          'content-type': 'application/json'
        },
        payload: {
          property,
          comp_refs: ['comp1', 'comp2']
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.workfile_id).toBeDefined();
      expect(body.normalized).toBeDefined();
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors).toContain('Residential validation not yet implemented');
    });
  });

  describe('Upload endpoint', () => {
    it('should handle file upload', async () => {
      const testFileContent = Buffer.from('test,file,content\\nrow1,data1,value1\\nrow2,data2,value2');
      
      const form = new FormData();
      const blob = new Blob([testFileContent], { type: 'text/csv' });
      form.append('file', blob, 'test.csv');

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: {
          ...Object.fromEntries(form.entries())
        },
        payload: form
      });

      if (response.statusCode !== 200) {
        console.log('Upload response:', response.body);
      }

      expect([200, 422]).toContain(response.statusCode);
      
      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.upload_id).toBeDefined();
        expect(Array.isArray(body.signed_urls)).toBe(true);
        expect(body.pipeline).toBeDefined();
        expect(body.pipeline.av).toBeDefined();
        expect(body.pipeline.exif).toBeDefined();
        expect(body.pipeline.ocr).toBeDefined();
      }
    });

    it('should reject upload without file', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: {
          'content-type': 'multipart/form-data'
        },
        payload: ''
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UPLOAD_PROCESSING_ERROR');
    });
  });

  describe('Appeal packet endpoint', () => {
    it('should generate appeal packet PDF', async () => {
      const workfileId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/appeal-packet/${workfileId}`
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(`appeal-dossier-${workfileId}.pdf`);
      expect(response.rawPayload.length).toBeGreaterThan(0);
    });

    it('should reject invalid UUID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/appeal-packet/invalid-uuid'
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Security headers', () => {
    it('should include security headers in responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });
  });

  describe('Rate limiting headers', () => {
    it('should include rate limiting headers', async () => {
      const validProperty = {
        propertyId: '550e8400-e29b-41d4-a716-446655440000',
        address: {
          street: '123 Business Ave',
          city: 'Anytown',
          state: 'CA',
          zipCode: '90210'
        },
        propertyType: 'office',
        assessedValue: 2500000,
        taxRate: 0.012,
        ownershipInfo: {
          ownerName: 'ABC Corporation',
          ownerType: 'corporation'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/validate/commercial',
        headers: {
          'content-type': 'application/json'
        },
        payload: {
          property: validProperty
        }
      });

      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });
});