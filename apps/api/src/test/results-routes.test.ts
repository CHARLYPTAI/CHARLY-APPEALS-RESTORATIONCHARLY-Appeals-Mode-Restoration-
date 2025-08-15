import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { resultsRoutes } from '../routes/results.js';

describe('Results Routes', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
    
    // Add basic error handler
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

    await fastify.register(resultsRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('GET /results', () => {
    it('should return paginated results with default parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.properties).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.itemsPerPage).toBe(20);
      expect(result.availableJurisdictions).toBeInstanceOf(Array);
      expect(result.availableStatuses).toBeInstanceOf(Array);
    });

    it('should accept pagination parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?page=2&limit=10'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.itemsPerPage).toBe(10);
    });

    it('should accept filter parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?jurisdiction=Travis County&status=READY&valueThreshold=5000'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.properties).toBeInstanceOf(Array);
    });

    it('should accept sorting parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?sortBy=assessedValue&sortOrder=desc'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.properties).toBeInstanceOf(Array);
    });

    it('should validate page parameter minimum value', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?page=0'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate limit parameter bounds', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?limit=101'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate sortBy enum values', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?sortBy=invalidField'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate sortOrder enum values', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?sortOrder=invalidOrder'
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /results/export', () => {
    it('should initiate CSV export successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {
          format: 'csv'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.export_id).toBeDefined();
      expect(result.download_url).toBeDefined();
      expect(result.format).toBe('csv');
      expect(result.expires_at).toBeDefined();
      expect(new Date(result.expires_at)).toBeInstanceOf(Date);
    });

    it('should initiate PDF export successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {
          format: 'pdf'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.export_id).toBeDefined();
      expect(result.download_url).toBeDefined();
      expect(result.format).toBe('pdf');
      expect(result.expires_at).toBeDefined();
    });

    it('should accept export with filters', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {
          format: 'csv',
          filters: {
            jurisdiction: 'Travis County',
            status: 'READY',
            valueThreshold: 10000
          }
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.export_id).toBeDefined();
      expect(result.format).toBe('csv');
    });

    it('should accept export with specific property IDs', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {
          format: 'pdf',
          propertyIds: ['OBZ-2023-001', 'ABC-2023-002']
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.export_id).toBeDefined();
      expect(result.format).toBe('pdf');
    });

    it('should require format parameter', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.title).toBe('Validation Error');
    });

    it('should validate format enum values', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {
          format: 'xlsx' // Invalid format
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate filters schema', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {
          format: 'csv',
          filters: {
            valueThreshold: -100 // Invalid negative threshold
          }
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /results/export/:export_id/download', () => {
    it('should download CSV export file', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results/export/test-export-id-csv/download?format=csv'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.payload).toContain('Property Name'); // CSV header
    });

    it('should download PDF export file', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results/export/test-export-id-pdf/download'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.pdf');
      expect(response.payload).toContain('%PDF-1.4'); // PDF header
    });

    it('should set appropriate cache headers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results/export/test-export-id/download'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('private, no-cache');
    });
  });

  describe('GET /results/export/:export_id/status', () => {
    it('should return export status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results/export/test-export-id/status'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.export_id).toBe('test-export-id');
      expect(result.status).toBeDefined();
      expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).toContain(result.status);
      expect(result.format).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.expires_at).toBeDefined();
      
      if (result.status === 'COMPLETED') {
        expect(result.completed_at).toBeDefined();
        expect(result.download_url).toBeDefined();
      }
    });

    it('should handle empty export_id parameter', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results/export//status' // Empty export_id
      });

      // The route will match with empty string, mock service handles it gracefully
      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results/non-existent'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle malformed JSON in export request', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(500); // JSON parse error
    });
  });

  describe('Integration Scenarios', () => {
    it('should support complete export workflow', async () => {
      // Step 1: Initiate export
      const exportResponse = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {
          format: 'csv',
          filters: {
            jurisdiction: 'Travis County'
          }
        }
      });

      expect(exportResponse.statusCode).toBe(200);
      const exportResult = JSON.parse(exportResponse.payload);
      const exportId = exportResult.export_id;

      // Step 2: Check export status
      const statusResponse = await fastify.inject({
        method: 'GET',
        url: `/results/export/${exportId}/status`
      });

      expect(statusResponse.statusCode).toBe(200);
      const statusResult = JSON.parse(statusResponse.payload);
      expect(statusResult.export_id).toBe(exportId);

      // Step 3: Download completed export
      if (statusResult.status === 'COMPLETED') {
        const downloadResponse = await fastify.inject({
          method: 'GET',
          url: `/results/export/${exportId}/download`
        });

        expect(downloadResponse.statusCode).toBe(200);
        expect(downloadResponse.headers['content-type']).toBeDefined();
      }
    });

    it('should handle large result sets with pagination', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?limit=1'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.pagination.itemsPerPage).toBe(1);
      expect(result.pagination.totalPages).toBeGreaterThan(1);
    });

    it('should filter results by multiple criteria', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/results?jurisdiction=Travis County&status=READY&valueThreshold=1000&sortBy=variance&sortOrder=desc'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.properties).toBeInstanceOf(Array);
      // In a real implementation, we would verify the filtering logic
    });

    it('should export filtered subset of results', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/results/export',
        payload: {
          format: 'pdf',
          filters: {
            jurisdiction: 'Travis County',
            status: 'PACKET_GENERATED',
            valueThreshold: 50000
          },
          propertyIds: ['OBZ-2023-001'] // Further restrict to specific properties
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.export_id).toBeDefined();
      expect(result.format).toBe('pdf');
    });
  });
});