import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { jurisdictionsRoutes } from '../routes/jurisdictions.js';

describe('Jurisdiction Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    await app.register(jurisdictionsRoutes, { prefix: '/api/v1' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/jurisdictions/:id', () => {
    it('should return Harris County jurisdiction data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/harris-county-tx'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdiction = JSON.parse(response.body);
      expect(jurisdiction).toEqual({
        jurisdiction_id: 'harris-county-tx',
        name: 'Harris County',
        state: 'TX',
        appeal_window_start: 'January 1',
        appeal_window_end: 'March 31',
        deadline_rule: '30 days after notice of appraised value',
        fee: '$250-$500 depending on property value',
        forms: ['50-132 Notice of Protest', '50-139 Owner Statement'],
        efile_available: true,
        evidence_preshare_required: true,
        decision_standard: 'Preponderance of evidence',
        citations: ['Texas Property Tax Code § 41.43', 'Texas Property Tax Code § 41.44']
      });
    });

    it('should return Cook County jurisdiction data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/cook-county-il'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdiction = JSON.parse(response.body);
      expect(jurisdiction.jurisdiction_id).toBe('cook-county-il');
      expect(jurisdiction.name).toBe('Cook County');
      expect(jurisdiction.state).toBe('IL');
      expect(jurisdiction.efile_available).toBe(false);
    });

    it('should return Maricopa County jurisdiction data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/maricopa-county-az'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdiction = JSON.parse(response.body);
      expect(jurisdiction.jurisdiction_id).toBe('maricopa-county-az');
      expect(jurisdiction.name).toBe('Maricopa County');
      expect(jurisdiction.state).toBe('AZ');
      expect(jurisdiction.efile_available).toBe(true);
    });

    it('should return 404 for non-existent jurisdiction', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/non-existent-jurisdiction'
      });

      expect(response.statusCode).toBe(404);
      
      const error = JSON.parse(response.body);
      expect(error.type).toBe('about:blank');
      expect(error.title).toBe('Jurisdiction Not Found');
      expect(error.status).toBe(404);
      expect(error.code).toBe('JURISDICTION_NOT_FOUND');
      expect(error.detail).toContain('non-existent-jurisdiction');
    });

    it('should include rate limit headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/harris-county-tx'
      });

      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers['x-ratelimit-remaining']).toBe('99');
    });

    it('should validate response schema structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/harris-county-tx'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdiction = JSON.parse(response.body);
      
      // Verify all required fields are present
      expect(jurisdiction).toHaveProperty('jurisdiction_id');
      expect(jurisdiction).toHaveProperty('name');
      expect(jurisdiction).toHaveProperty('state');
      expect(jurisdiction).toHaveProperty('appeal_window_start');
      expect(jurisdiction).toHaveProperty('appeal_window_end');
      expect(jurisdiction).toHaveProperty('deadline_rule');
      expect(jurisdiction).toHaveProperty('fee');
      expect(jurisdiction).toHaveProperty('forms');
      expect(jurisdiction).toHaveProperty('efile_available');
      expect(jurisdiction).toHaveProperty('evidence_preshare_required');
      expect(jurisdiction).toHaveProperty('decision_standard');
      expect(jurisdiction).toHaveProperty('citations');

      // Verify field types
      expect(typeof jurisdiction.jurisdiction_id).toBe('string');
      expect(typeof jurisdiction.name).toBe('string');
      expect(typeof jurisdiction.state).toBe('string');
      expect(typeof jurisdiction.appeal_window_start).toBe('string');
      expect(typeof jurisdiction.appeal_window_end).toBe('string');
      expect(typeof jurisdiction.deadline_rule).toBe('string');
      expect(typeof jurisdiction.fee).toBe('string');
      expect(Array.isArray(jurisdiction.forms)).toBe(true);
      expect(typeof jurisdiction.efile_available).toBe('boolean');
      expect(typeof jurisdiction.evidence_preshare_required).toBe('boolean');
      expect(typeof jurisdiction.decision_standard).toBe('string');
      expect(Array.isArray(jurisdiction.citations)).toBe(true);
    });

    it('should handle special characters in jurisdiction ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/test-jurisdiction-with-special-chars-!@#'
      });

      expect(response.statusCode).toBe(404);
      
      const error = JSON.parse(response.body);
      expect(error.code).toBe('JURISDICTION_NOT_FOUND');
    });

    it('should handle empty jurisdiction ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/'
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/jurisdictions', () => {
    it('should return all jurisdictions when no state filter provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdictions = JSON.parse(response.body);
      expect(Array.isArray(jurisdictions)).toBe(true);
      expect(jurisdictions).toHaveLength(3);
      
      const jurisdictionIds = jurisdictions.map((j: any) => j.jurisdiction_id);
      expect(jurisdictionIds).toContain('harris-county-tx');
      expect(jurisdictionIds).toContain('cook-county-il');
      expect(jurisdictionIds).toContain('maricopa-county-az');
    });

    it('should filter jurisdictions by state TX', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions?state=TX'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdictions = JSON.parse(response.body);
      expect(Array.isArray(jurisdictions)).toBe(true);
      expect(jurisdictions).toHaveLength(1);
      expect(jurisdictions[0].jurisdiction_id).toBe('harris-county-tx');
      expect(jurisdictions[0].state).toBe('TX');
    });

    it('should filter jurisdictions by state IL', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions?state=IL'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdictions = JSON.parse(response.body);
      expect(Array.isArray(jurisdictions)).toBe(true);
      expect(jurisdictions).toHaveLength(1);
      expect(jurisdictions[0].jurisdiction_id).toBe('cook-county-il');
      expect(jurisdictions[0].state).toBe('IL');
    });

    it('should filter jurisdictions by state AZ', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions?state=AZ'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdictions = JSON.parse(response.body);
      expect(Array.isArray(jurisdictions)).toBe(true);
      expect(jurisdictions).toHaveLength(1);
      expect(jurisdictions[0].jurisdiction_id).toBe('maricopa-county-az');
      expect(jurisdictions[0].state).toBe('AZ');
    });

    it('should return empty array for non-existent state', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions?state=CA'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdictions = JSON.parse(response.body);
      expect(Array.isArray(jurisdictions)).toBe(true);
      expect(jurisdictions).toHaveLength(0);
    });

    it('should reject invalid state format (not 2 characters)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions?state=TEX'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject lowercase state codes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions?state=tx'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle empty state parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions?state='
      });

      expect(response.statusCode).toBe(400);
    });

    it('should include rate limit headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions'
      });

      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers['x-ratelimit-remaining']).toBe('99');
    });

    it('should validate all jurisdictions have required schema structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdictions = JSON.parse(response.body);
      
      jurisdictions.forEach((jurisdiction: any) => {
        // Verify all required fields are present
        expect(jurisdiction).toHaveProperty('jurisdiction_id');
        expect(jurisdiction).toHaveProperty('name');
        expect(jurisdiction).toHaveProperty('state');
        expect(jurisdiction).toHaveProperty('appeal_window_start');
        expect(jurisdiction).toHaveProperty('appeal_window_end');
        expect(jurisdiction).toHaveProperty('deadline_rule');
        expect(jurisdiction).toHaveProperty('fee');
        expect(jurisdiction).toHaveProperty('forms');
        expect(jurisdiction).toHaveProperty('efile_available');
        expect(jurisdiction).toHaveProperty('evidence_preshare_required');
        expect(jurisdiction).toHaveProperty('decision_standard');
        expect(jurisdiction).toHaveProperty('citations');

        // Verify field types
        expect(typeof jurisdiction.jurisdiction_id).toBe('string');
        expect(typeof jurisdiction.name).toBe('string');
        expect(typeof jurisdiction.state).toBe('string');
        expect(typeof jurisdiction.appeal_window_start).toBe('string');
        expect(typeof jurisdiction.appeal_window_end).toBe('string');
        expect(typeof jurisdiction.deadline_rule).toBe('string');
        expect(typeof jurisdiction.fee).toBe('string');
        expect(Array.isArray(jurisdiction.forms)).toBe(true);
        expect(typeof jurisdiction.efile_available).toBe('boolean');
        expect(typeof jurisdiction.evidence_preshare_required).toBe('boolean');
        expect(typeof jurisdiction.decision_standard).toBe('string');
        expect(Array.isArray(jurisdiction.citations)).toBe(true);

        // Verify content constraints
        expect(jurisdiction.jurisdiction_id.length).toBeGreaterThan(0);
        expect(jurisdiction.name.length).toBeGreaterThan(0);
        expect(jurisdiction.state.length).toBe(2);
        expect(jurisdiction.forms.length).toBeGreaterThan(0);
        expect(jurisdiction.citations.length).toBeGreaterThan(0);
      });
    });

    it('should handle multiple query parameters gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions?state=TX&extra=ignored'
      });

      expect(response.statusCode).toBe(200);
      
      const jurisdictions = JSON.parse(response.body);
      expect(jurisdictions).toHaveLength(1);
      expect(jurisdictions[0].state).toBe('TX');
    });

    it('should maintain consistent ordering', async () => {
      const response1 = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions'
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions'
      });

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);
      
      const jurisdictions1 = JSON.parse(response1.body);
      const jurisdictions2 = JSON.parse(response2.body);
      
      expect(jurisdictions1).toEqual(jurisdictions2);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This would test actual server error scenarios in a real implementation
      // For now, we test the error response format
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/non-existent'
      });

      expect(response.statusCode).toBe(404);
      
      const error = JSON.parse(response.body);
      expect(error).toHaveProperty('type');
      expect(error).toHaveProperty('title');
      expect(error).toHaveProperty('status');
      expect(error).toHaveProperty('detail');
      expect(error).toHaveProperty('code');
    });

    it('should return proper RFC7807 Problem+JSON format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/invalid-id'
      });

      expect(response.statusCode).toBe(404);
      
      const error = JSON.parse(response.body);
      expect(error.type).toBe('about:blank');
      expect(error.title).toBe('Jurisdiction Not Found');
      expect(error.status).toBe(404);
      expect(error.detail).toContain('invalid-id');
      expect(error.code).toBe('JURISDICTION_NOT_FOUND');
    });
  });

  describe('HTTP Methods', () => {
    it('should reject POST requests to jurisdiction endpoints', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/jurisdictions/harris-county-tx'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject PUT requests to jurisdiction endpoints', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/jurisdictions/harris-county-tx'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject DELETE requests to jurisdiction endpoints', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/jurisdictions/harris-county-tx'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Content-Type Handling', () => {
    it('should return JSON content type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/harris-county-tx'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle Accept header properly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/jurisdictions/harris-county-tx',
        headers: {
          'Accept': 'application/json'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});