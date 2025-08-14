import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { onboardingRoutes } from '../routes/onboarding.js';
import type { CustomerRegistrationRequest } from '../types/onboarding.js';

describe('Onboarding Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    await app.register(onboardingRoutes, { prefix: '/api/v1' });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/onboarding/customers', () => {
    const validRegistration: CustomerRegistrationRequest = {
      organization: {
        name: 'Test Company',
        type: 'property_management',
        size: 'medium',
        address: {
          street: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          country: 'US'
        },
        phone: '512-555-0100',
        website: 'https://test.com'
      },
      primary_contact: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: '512-555-0101',
        title: 'Manager'
      },
      jurisdictions: ['harris-county-tx'],
      expected_monthly_appeals: 10,
      integration_preferences: {
        api_access: true,
        webhook_url: 'https://test.com/webhook',
        sso_required: false,
        white_label: false
      }
    };

    it('should successfully register a customer with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: validRegistration
      });

      expect(response.statusCode).toBe(201);
      
      const result = JSON.parse(response.body);
      expect(result).toHaveProperty('customer_id');
      expect(result).toHaveProperty('organization_id');
      expect(result).toHaveProperty('api_key');
      expect(result.api_key).toMatch(/^ck_[a-f0-9]{64}$/);
      expect(result.onboarding_status).toBe('pending');
      expect(Array.isArray(result.next_steps)).toBe(true);
      expect(result.next_steps.length).toBeGreaterThan(0);
    });

    it('should reject registration with missing organization name', async () => {
      const invalidRegistration = {
        ...validRegistration,
        organization: {
          ...validRegistration.organization,
          name: ''
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: invalidRegistration
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with invalid email', async () => {
      const invalidRegistration = {
        ...validRegistration,
        primary_contact: {
          ...validRegistration.primary_contact,
          email: 'invalid-email'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: invalidRegistration
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with empty jurisdictions array', async () => {
      const invalidRegistration = {
        ...validRegistration,
        jurisdictions: []
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: invalidRegistration
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with invalid organization type', async () => {
      const invalidRegistration = {
        ...validRegistration,
        organization: {
          ...validRegistration.organization,
          type: 'invalid_type' as any
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: invalidRegistration
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with invalid organization size', async () => {
      const invalidRegistration = {
        ...validRegistration,
        organization: {
          ...validRegistration.organization,
          size: 'invalid_size' as any
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: invalidRegistration
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with missing required fields', async () => {
      const invalidRegistration = {
        organization: {
          name: 'Test'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: invalidRegistration
      });

      expect(response.statusCode).toBe(400);
    });

    it('should accept registration with minimal valid data', async () => {
      const minimalRegistration: CustomerRegistrationRequest = {
        organization: {
          name: 'Minimal Org',
          type: 'other',
          size: 'small',
          address: {
            street: '1 Main St',
            city: 'City',
            state: 'TX',
            zip: '12345',
            country: 'US'
          },
          phone: '555-0100'
        },
        primary_contact: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: '555-0101',
          title: 'Owner'
        },
        jurisdictions: ['harris-county-tx'],
        expected_monthly_appeals: 1,
        integration_preferences: {
          api_access: false,
          sso_required: false,
          white_label: false
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: minimalRegistration
      });

      expect(response.statusCode).toBe(201);
    });

    it('should validate webhook URL format when provided', async () => {
      const invalidWebhookRegistration = {
        ...validRegistration,
        integration_preferences: {
          ...validRegistration.integration_preferences,
          webhook_url: 'invalid-url'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: invalidWebhookRegistration
      });

      expect(response.statusCode).toBe(400);
    });

    it('should accept valid webhook URL', async () => {
      const validWebhookRegistration = {
        ...validRegistration,
        integration_preferences: {
          ...validRegistration.integration_preferences,
          webhook_url: 'https://example.com/webhook'
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: validWebhookRegistration
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('GET /api/v1/onboarding/customers/:customer_id/status', () => {
    let customerId: string;

    beforeEach(async () => {
      const registrationResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: {
          organization: {
            name: 'Status Test Org',
            type: 'law_firm',
            size: 'large',
            address: {
              street: '456 Legal Blvd',
              city: 'Dallas',
              state: 'TX',
              zip: '75201',
              country: 'US'
            },
            phone: '214-555-0200'
          },
          primary_contact: {
            first_name: 'Alice',
            last_name: 'Attorney',
            email: 'alice@lawfirm.com',
            phone: '214-555-0201',
            title: 'Partner'
          },
          jurisdictions: ['harris-county-tx'],
          expected_monthly_appeals: 50,
          integration_preferences: {
            api_access: true,
            sso_required: true,
            white_label: false
          }
        }
      });

      const registrationResult = JSON.parse(registrationResponse.body);
      customerId = registrationResult.customer_id;
    });

    it('should return onboarding status for valid customer', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/onboarding/customers/${customerId}/status`
      });

      expect(response.statusCode).toBe(200);
      
      const status = JSON.parse(response.body);
      expect(status.customer_id).toBe(customerId);
      expect(status.status).toBe('pending');
      expect(status.progress).toHaveProperty('current_step');
      expect(status.progress).toHaveProperty('total_steps');
      expect(status.progress).toHaveProperty('completion_percentage');
      expect(Array.isArray(status.steps)).toBe(true);
      expect(status.kpis).toHaveProperty('time_from_registration');
      expect(status.kpis).toHaveProperty('sample_packets_generated');
      expect(status.kpis).toHaveProperty('integration_test_success');
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/onboarding/customers/non-existent-id/status'
      });

      expect(response.statusCode).toBe(404);
      
      const error = JSON.parse(response.body);
      expect(error.code).toBe('CUSTOMER_NOT_FOUND');
    });

    it('should include rate limit headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/onboarding/customers/${customerId}/status`
      });

      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('POST /api/v1/onboarding/customers/:customer_id/steps', () => {
    let customerId: string;

    beforeEach(async () => {
      const registrationResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: {
          organization: {
            name: 'Step Test Org',
            type: 'commercial_real_estate',
            size: 'enterprise',
            address: {
              street: '789 Commerce St',
              city: 'Houston',
              state: 'TX',
              zip: '77002',
              country: 'US'
            },
            phone: '713-555-0300'
          },
          primary_contact: {
            first_name: 'Bob',
            last_name: 'Builder',
            email: 'bob@realestate.com',
            phone: '713-555-0301',
            title: 'CEO'
          },
          jurisdictions: ['harris-county-tx', 'maricopa-county-az'],
          expected_monthly_appeals: 100,
          integration_preferences: {
            api_access: true,
            webhook_url: 'https://realestate.com/webhook',
            sso_required: true,
            white_label: true
          }
        }
      });

      const registrationResult = JSON.parse(registrationResponse.body);
      customerId = registrationResult.customer_id;
    });

    it('should process sample_data_upload step successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: {
          step_type: 'sample_data_upload',
          data: { files: ['sample1.pdf', 'sample2.csv'] }
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('files_processed');
      expect(result.next_step).toBe('jurisdiction_verification');
    });

    it('should process jurisdiction_verification step successfully', async () => {
      // First complete sample_data_upload
      await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: { step_type: 'sample_data_upload' }
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: {
          step_type: 'jurisdiction_verification',
          data: { verify_all: true }
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('jurisdictions_verified');
      expect(result.next_step).toBe('api_integration_test');
    });

    it('should process api_integration_test step successfully', async () => {
      // Complete prerequisite steps
      await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: { step_type: 'sample_data_upload' }
      });
      await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: { step_type: 'jurisdiction_verification' }
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: {
          step_type: 'api_integration_test',
          data: { run_all_tests: true }
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('test_results');
      expect(result.next_step).toBe('final_review');
    });

    it('should process final_review step successfully', async () => {
      // Complete all prerequisite steps
      await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: { step_type: 'sample_data_upload' }
      });
      await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: { step_type: 'jurisdiction_verification' }
      });
      await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: { step_type: 'api_integration_test' }
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: {
          step_type: 'final_review',
          data: {}
        }
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('onboarding_complete');
      expect(result.next_step).toBeUndefined();
    });

    it('should reject invalid step type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: {
          step_type: 'invalid_step',
          data: {}
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject request with missing step_type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: {
          data: {}
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 422 for non-existent customer', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers/non-existent-id/steps',
        payload: {
          step_type: 'sample_data_upload',
          data: {}
        }
      });

      expect(response.statusCode).toBe(422);
      
      const error = JSON.parse(response.body);
      expect(error.code).toBe('STEP_PROCESSING_ERROR');
    });
  });

  describe('GET /api/v1/onboarding/customers/:customer_id/kpis', () => {
    let customerId: string;

    beforeEach(async () => {
      const registrationResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: {
          organization: {
            name: 'KPI Test Org',
            type: 'property_management',
            size: 'small',
            address: {
              street: '321 KPI St',
              city: 'San Antonio',
              state: 'TX',
              zip: '78201',
              country: 'US'
            },
            phone: '210-555-0400'
          },
          primary_contact: {
            first_name: 'Carol',
            last_name: 'Manager',
            email: 'carol@kpitest.com',
            phone: '210-555-0401',
            title: 'Manager'
          },
          jurisdictions: ['harris-county-tx'],
          expected_monthly_appeals: 10,
          integration_preferences: {
            api_access: false,
            sso_required: false,
            white_label: false
          }
        }
      });

      const registrationResult = JSON.parse(registrationResponse.body);
      customerId = registrationResult.customer_id;
    });

    it('should return KPI data for valid customer', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/onboarding/customers/${customerId}/kpis`
      });

      expect(response.statusCode).toBe(200);
      
      const kpiData = JSON.parse(response.body);
      expect(Array.isArray(kpiData)).toBe(true);
      expect(kpiData.length).toBeGreaterThan(0);
      expect(kpiData[0]).toHaveProperty('customer_id');
      expect(kpiData[0]).toHaveProperty('event_type');
      expect(kpiData[0]).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/onboarding/customers/non-existent-id/kpis'
      });

      expect(response.statusCode).toBe(404);
      
      const error = JSON.parse(response.body);
      expect(error.code).toBe('KPI_NOT_FOUND');
    });

    it('should track KPI events after onboarding steps', async () => {
      // Complete a step to generate KPI events
      await app.inject({
        method: 'POST',
        url: `/api/v1/onboarding/customers/${customerId}/steps`,
        payload: { step_type: 'sample_data_upload' }
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/onboarding/customers/${customerId}/kpis`
      });

      expect(response.statusCode).toBe(200);
      
      const kpiData = JSON.parse(response.body);
      expect(kpiData.length).toBeGreaterThan(1); // Should have registration + upload events
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: 'invalid json',
        headers: { 'content-type': 'application/json' }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should include proper error structure', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      
      // Fastify validation errors have different structure
      const error = JSON.parse(response.body);
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('message');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/customers',
        payload: {
          organization: {
            name: 'Rate Limit Test',
            type: 'other',
            size: 'small',
            address: {
              street: '1 Rate St',
              city: 'City',
              state: 'TX',
              zip: '12345',
              country: 'US'
            },
            phone: '555-0100'
          },
          primary_contact: {
            first_name: 'Rate',
            last_name: 'Tester',
            email: 'rate@test.com',
            phone: '555-0101',
            title: 'Tester'
          },
          jurisdictions: ['harris-county-tx'],
          expected_monthly_appeals: 1,
          integration_preferences: {
            api_access: false,
            sso_required: false,
            white_label: false
          }
        }
      });

      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });
});