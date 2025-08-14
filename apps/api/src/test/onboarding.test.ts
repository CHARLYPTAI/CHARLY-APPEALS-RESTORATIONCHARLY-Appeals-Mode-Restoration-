import { describe, it, expect, beforeEach } from 'vitest';
import { OnboardingService } from '../services/onboarding-service.js';
import type { 
  CustomerRegistrationRequest,
  OnboardingStepRequest 
} from '../types/onboarding.js';

describe('OnboardingService', () => {
  let onboardingService: OnboardingService;

  beforeEach(() => {
    onboardingService = new OnboardingService();
  });

  describe('registerCustomer', () => {
    const validRegistrationRequest: CustomerRegistrationRequest = {
      organization: {
        name: 'Test Property Management',
        type: 'property_management',
        size: 'medium',
        address: {
          street: '123 Business Ave',
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
      jurisdictions: ['harris-county-tx', 'cook-county-il'],
      expected_monthly_appeals: 25,
      integration_preferences: {
        api_access: true,
        webhook_url: 'https://test.com/webhook',
        sso_required: false,
        white_label: true
      }
    };

    it('should successfully register a new customer', async () => {
      const result = await onboardingService.registerCustomer(validRegistrationRequest);

      expect(result).toHaveProperty('customer_id');
      expect(result).toHaveProperty('organization_id');
      expect(result).toHaveProperty('api_key');
      expect(result.api_key).toMatch(/^ck_[a-f0-9]{64}$/);
      expect(result.onboarding_status).toBe('pending');
      expect(result.next_steps).toHaveLength(2);
      expect(result.next_steps[0].step).toBe('sample_data_upload');
      expect(result.next_steps[1].step).toBe('jurisdiction_verification');
    });

    it('should generate unique customer IDs for different registrations', async () => {
      const result1 = await onboardingService.registerCustomer(validRegistrationRequest);
      const result2 = await onboardingService.registerCustomer(validRegistrationRequest);

      expect(result1.customer_id).not.toBe(result2.customer_id);
      expect(result1.organization_id).not.toBe(result2.organization_id);
      expect(result1.api_key).not.toBe(result2.api_key);
    });

    it('should handle minimal registration request', async () => {
      const minimalRequest: CustomerRegistrationRequest = {
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

      const result = await onboardingService.registerCustomer(minimalRequest);
      
      expect(result).toHaveProperty('customer_id');
      expect(result.onboarding_status).toBe('pending');
    });
  });

  describe('getOnboardingStatus', () => {
    let customerId: string;

    beforeEach(async () => {
      const registrationRequest: CustomerRegistrationRequest = {
        organization: {
          name: 'Test Org',
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
      };

      const result = await onboardingService.registerCustomer(registrationRequest);
      customerId = result.customer_id;
    });

    it('should return onboarding status for valid customer', async () => {
      const status = await onboardingService.getOnboardingStatus(customerId);

      expect(status.customer_id).toBe(customerId);
      expect(status.status).toBe('pending');
      expect(status.progress.current_step).toBe(1);
      expect(status.progress.total_steps).toBe(4);
      expect(status.progress.completion_percentage).toBe(0);
      expect(status.steps).toHaveLength(4);
      expect(status.kpis.time_from_registration).toBeGreaterThanOrEqual(0);
      expect(status.kpis.sample_packets_generated).toBe(0);
      expect(status.kpis.integration_test_success).toBe(false);
    });

    it('should throw error for non-existent customer', async () => {
      const nonExistentId = 'non-existent-id';
      
      await expect(onboardingService.getOnboardingStatus(nonExistentId))
        .rejects.toThrow('Customer not found');
    });
  });

  describe('processOnboardingStep', () => {
    let customerId: string;

    beforeEach(async () => {
      const registrationRequest: CustomerRegistrationRequest = {
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
      };

      const result = await onboardingService.registerCustomer(registrationRequest);
      customerId = result.customer_id;
    });

    it('should process sample_data_upload step successfully', async () => {
      const stepRequest: OnboardingStepRequest = {
        customer_id: customerId,
        step_type: 'sample_data_upload',
        data: { files: ['sample1.pdf', 'sample2.csv'] }
      };

      const result = await onboardingService.processOnboardingStep(stepRequest);

      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('files_processed');
      expect(result.result).toHaveProperty('processing_time_ms');
      expect(result.result).toHaveProperty('validation_errors');
      expect(result.result).toHaveProperty('appeal_packets_generated');
      expect(result.result).toHaveProperty('data_entry_reduction');
      expect(result.next_step).toBe('jurisdiction_verification');
    });

    it('should process jurisdiction_verification step successfully', async () => {
      // First complete sample_data_upload
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'sample_data_upload'
      });

      const stepRequest: OnboardingStepRequest = {
        customer_id: customerId,
        step_type: 'jurisdiction_verification',
        data: { verify_all: true }
      };

      const result = await onboardingService.processOnboardingStep(stepRequest);

      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('jurisdictions_verified');
      expect(result.result).toHaveProperty('jurisdictions_configured');
      expect(result.result).toHaveProperty('rules_loaded');
      expect(result.next_step).toBe('api_integration_test');
    });

    it('should process api_integration_test step successfully', async () => {
      // Complete prerequisite steps
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'sample_data_upload'
      });
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'jurisdiction_verification'
      });

      const stepRequest: OnboardingStepRequest = {
        customer_id: customerId,
        step_type: 'api_integration_test',
        data: { run_all_tests: true }
      };

      const result = await onboardingService.processOnboardingStep(stepRequest);

      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('test_results');
      expect(result.result).toHaveProperty('all_tests_passed');
      expect(result.result).toHaveProperty('integration_ready');
      expect(result.next_step).toBe('final_review');
    });

    it('should process final_review step successfully', async () => {
      // Complete all prerequisite steps
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'sample_data_upload'
      });
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'jurisdiction_verification'
      });
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'api_integration_test'
      });

      const stepRequest: OnboardingStepRequest = {
        customer_id: customerId,
        step_type: 'final_review',
        data: {}
      };

      const result = await onboardingService.processOnboardingStep(stepRequest);

      expect(result.status).toBe('completed');
      expect(result.result).toHaveProperty('onboarding_complete');
      expect(result.result).toHaveProperty('account_activated');
      expect(result.result).toHaveProperty('production_ready');
      expect(result.next_step).toBeUndefined();
    });

    it('should fail final_review if prerequisite steps not completed', async () => {
      const stepRequest: OnboardingStepRequest = {
        customer_id: customerId,
        step_type: 'final_review',
        data: {}
      };

      const result = await onboardingService.processOnboardingStep(stepRequest);

      expect(result.status).toBe('failed');
      expect(result.errors).toContain('Cannot complete final review: previous steps not completed');
    });

    it('should throw error for non-existent customer', async () => {
      const stepRequest: OnboardingStepRequest = {
        customer_id: 'non-existent-id',
        step_type: 'sample_data_upload'
      };

      await expect(onboardingService.processOnboardingStep(stepRequest))
        .rejects.toThrow('Customer not found');
    });

    it('should throw error for invalid step type', async () => {
      const stepRequest: OnboardingStepRequest = {
        customer_id: customerId,
        step_type: 'invalid_step' as any
      };

      await expect(onboardingService.processOnboardingStep(stepRequest))
        .rejects.toThrow('Invalid step type: invalid_step');
    });

    it('should throw error for already completed step', async () => {
      // Complete the step first
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'sample_data_upload'
      });

      // Try to complete it again
      const stepRequest: OnboardingStepRequest = {
        customer_id: customerId,
        step_type: 'sample_data_upload'
      };

      await expect(onboardingService.processOnboardingStep(stepRequest))
        .rejects.toThrow('Step sample_data_upload already completed');
    });

    it('should update onboarding status to in_progress after first step', async () => {
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'sample_data_upload'
      });

      const status = await onboardingService.getOnboardingStatus(customerId);
      expect(status.status).toBe('in_progress');
      expect(status.progress.completion_percentage).toBe(25);
    });

    it('should update onboarding status to completed after all steps', async () => {
      // Complete all steps
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'sample_data_upload'
      });
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'jurisdiction_verification'
      });
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'api_integration_test'
      });
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'final_review'
      });

      const status = await onboardingService.getOnboardingStatus(customerId);
      expect(status.status).toBe('completed');
      expect(status.progress.completion_percentage).toBe(100);
    });
  });

  describe('getKPIData', () => {
    let customerId: string;

    beforeEach(async () => {
      const registrationRequest: CustomerRegistrationRequest = {
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
      };

      const result = await onboardingService.registerCustomer(registrationRequest);
      customerId = result.customer_id;
    });

    it('should return KPI data for valid customer', async () => {
      const kpiData = await onboardingService.getKPIData(customerId);

      expect(Array.isArray(kpiData)).toBe(true);
      expect(kpiData).toHaveLength(1); // Should have registration event
      expect(kpiData[0].customer_id).toBe(customerId);
      expect(kpiData[0].event_type).toBe('registration');
      expect(kpiData[0].timestamp).toBeDefined();
    });

    it('should track KPI events during onboarding steps', async () => {
      // Complete sample data upload to trigger KPI event
      await onboardingService.processOnboardingStep({
        customer_id: customerId,
        step_type: 'sample_data_upload'
      });

      const kpiData = await onboardingService.getKPIData(customerId);

      expect(kpiData).toHaveLength(2); // Registration + first_upload
      expect(kpiData[1].event_type).toBe('first_upload');
      expect(kpiData[1].metadata).toHaveProperty('data_entry_reduction');
    });

    it('should throw error for non-existent customer', async () => {
      await expect(onboardingService.getKPIData('non-existent-id'))
        .rejects.toThrow('Customer not found');
    });
  });

  describe('API Key Generation', () => {
    it('should generate valid API keys', async () => {
      const registrationRequest: CustomerRegistrationRequest = {
        organization: {
          name: 'API Test Org',
          type: 'other',
          size: 'medium',
          address: {
            street: '999 API Lane',
            city: 'Austin',
            state: 'TX',
            zip: '78703',
            country: 'US'
          },
          phone: '512-555-0999'
        },
        primary_contact: {
          first_name: 'API',
          last_name: 'Tester',
          email: 'api@test.com',
          phone: '512-555-0998',
          title: 'Developer'
        },
        jurisdictions: ['harris-county-tx'],
        expected_monthly_appeals: 5,
        integration_preferences: {
          api_access: true,
          sso_required: false,
          white_label: false
        }
      };

      const result = await onboardingService.registerCustomer(registrationRequest);
      
      // Validate API key format: ck_ + 64 hex characters
      expect(result.api_key).toMatch(/^ck_[a-f0-9]{64}$/);
      expect(result.api_key).toHaveLength(67); // 3 + 64
    });

    it('should generate unique API keys', async () => {
      const registrationRequest: CustomerRegistrationRequest = {
        organization: {
          name: 'Unique Test Org',
          type: 'other',
          size: 'small',
          address: {
            street: '888 Unique St',
            city: 'Austin',
            state: 'TX',
            zip: '78704',
            country: 'US'
          },
          phone: '512-555-0888'
        },
        primary_contact: {
          first_name: 'Unique',
          last_name: 'User',
          email: 'unique@test.com',
          phone: '512-555-0887',
          title: 'User'
        },
        jurisdictions: ['harris-county-tx'],
        expected_monthly_appeals: 1,
        integration_preferences: {
          api_access: true,
          sso_required: false,
          white_label: false
        }
      };

      const apiKeys = new Set<string>();
      
      // Generate multiple API keys and ensure they're unique
      for (let i = 0; i < 10; i++) {
        const result = await onboardingService.registerCustomer(registrationRequest);
        apiKeys.add(result.api_key);
      }
      
      expect(apiKeys.size).toBe(10); // All keys should be unique
    });
  });
});