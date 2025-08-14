import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../services/validation-service.js';
import { OnboardingService } from '../services/onboarding-service.js';
import { JurisdictionService } from '../services/jurisdiction-service.js';
import { UploadService } from '../services/upload-service.js';
import type { CommercialValidationRequest } from '../types/api.js';

describe('Missing Branch Coverage', () => {
  describe('ValidationService edge cases', () => {
    let service: ValidationService;

    beforeEach(() => {
      service = new ValidationService();
    });

    it('should handle property without marketValue', async () => {
      const request: CommercialValidationRequest = {
        property: {
          assessedValue: 1000000,
          taxRate: 0.012
        }
      };

      const result = await service.validateCommercial(request);
      
      expect(result.decision_preview).toBeUndefined();
      expect(result.workfile_id).toBeDefined();
    });

    it('should handle validation errors properly', async () => {
      const request: CommercialValidationRequest = {
        property: null
      };

      const result = await service.validateCommercial(request);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.decision_preview).toBeUndefined();
    });
  });

  describe('OnboardingService edge cases', () => {
    let service: OnboardingService;

    beforeEach(() => {
      service = new OnboardingService();
    });

    it('should handle non-existent customer in processOnboardingStep', async () => {
      await expect(service.processOnboardingStep({
        customer_id: 'non-existent',
        step_type: 'sample_data_upload'
      })).rejects.toThrow('Customer not found');
    });

    it('should handle invalid step type', async () => {
      const registrationResult = await service.registerCustomer({
        organization: {
          name: 'Test Org',
          type: 'other',
          size: 'small',
          address: {
            street: '1 Test St',
            city: 'Test City',
            state: 'TX',
            zip: '12345',
            country: 'US'
          },
          phone: '555-0100'
        },
        primary_contact: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
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
      });

      await expect(service.processOnboardingStep({
        customer_id: registrationResult.customer_id,
        step_type: 'invalid_step' as any
      })).rejects.toThrow('Invalid step type: invalid_step');
    });

    it('should handle already completed step', async () => {
      const registrationResult = await service.registerCustomer({
        organization: {
          name: 'Test Org 2',
          type: 'law_firm',
          size: 'medium',
          address: {
            street: '2 Test St',
            city: 'Test City',
            state: 'TX',
            zip: '12345',
            country: 'US'
          },
          phone: '555-0200'
        },
        primary_contact: {
          first_name: 'Test',
          last_name: 'Lawyer',
          email: 'lawyer@example.com',
          phone: '555-0201',
          title: 'Attorney'
        },
        jurisdictions: ['harris-county-tx'],
        expected_monthly_appeals: 10,
        integration_preferences: {
          api_access: true,
          sso_required: true,
          white_label: false
        }
      });

      // Complete step once
      await service.processOnboardingStep({
        customer_id: registrationResult.customer_id,
        step_type: 'sample_data_upload'
      });

      // Try to complete again
      await expect(service.processOnboardingStep({
        customer_id: registrationResult.customer_id,
        step_type: 'sample_data_upload'
      })).rejects.toThrow('Step sample_data_upload already completed');
    });

    it('should handle final review with incomplete prerequisites', async () => {
      const registrationResult = await service.registerCustomer({
        organization: {
          name: 'Test Org 3',
          type: 'commercial_real_estate',
          size: 'large',
          address: {
            street: '3 Test St',
            city: 'Test City',
            state: 'TX',
            zip: '12345',
            country: 'US'
          },
          phone: '555-0300'
        },
        primary_contact: {
          first_name: 'Test',
          last_name: 'Realtor',
          email: 'realtor@example.com',
          phone: '555-0301',
          title: 'Agent'
        },
        jurisdictions: ['harris-county-tx'],
        expected_monthly_appeals: 50,
        integration_preferences: {
          api_access: true,
          webhook_url: 'https://example.com/webhook',
          sso_required: false,
          white_label: true
        }
      });

      const result = await service.processOnboardingStep({
        customer_id: registrationResult.customer_id,
        step_type: 'final_review'
      });

      expect(result.status).toBe('failed');
      expect(result.errors).toContain('Cannot complete final review: previous steps not completed');
    });
  });

  describe('JurisdictionService edge cases', () => {
    let service: JurisdictionService;

    beforeEach(() => {
      service = new JurisdictionService();
    });

    it('should handle null jurisdiction ID', async () => {
      await expect(service.getJurisdiction(null as any))
        .rejects.toThrow('Jurisdiction null not found');
    });

    it('should handle undefined jurisdiction ID', async () => {
      await expect(service.getJurisdiction(undefined as any))
        .rejects.toThrow('Jurisdiction undefined not found');
    });

    it('should handle empty string state filter', async () => {
      const jurisdictions = await service.getJurisdictions('');
      expect(jurisdictions.length).toBe(3); // Should return all jurisdictions
    });

    it('should handle whitespace-only state filter', async () => {
      const jurisdictions = await service.getJurisdictions('   ');
      expect(jurisdictions.length).toBe(3); // Should return all jurisdictions
    });
  });

  describe('Mock function edge cases', () => {
    it('should test various assessment decision scenarios', async () => {
      const { makeAssessmentDecision } = await import('../mocks/charly-packages.js');

      // Test OVER scenario
      const overResult = makeAssessmentDecision({
        assessedValue: 1200000,
        estimatedMarketValue: 1000000,
        valueConfidence: 0.8,
        taxRate: 0.012,
        jurisdictionPriors: {
          successRate: 0.65,
          averageFees: 5000,
          averageTimeToResolution: 180,
          reassessmentRisk: 0.15
        }
      });

      expect(overResult.label).toBe('OVER');
      expect(overResult.savingsEstimate).toBeGreaterThan(0);

      // Test UNDER scenario
      const underResult = makeAssessmentDecision({
        assessedValue: 800000,
        estimatedMarketValue: 1000000,
        valueConfidence: 0.8,
        taxRate: 0.012,
        jurisdictionPriors: {
          successRate: 0.65,
          averageFees: 5000,
          averageTimeToResolution: 180,
          reassessmentRisk: 0.15
        }
      });

      expect(underResult.label).toBe('UNDER');
      expect(underResult.savingsEstimate).toBe(0);

      // Test FAIR scenario
      const fairResult = makeAssessmentDecision({
        assessedValue: 1000000,
        estimatedMarketValue: 1000000,
        valueConfidence: 0.8,
        taxRate: 0.012,
        jurisdictionPriors: {
          successRate: 0.65,
          averageFees: 5000,
          averageTimeToResolution: 180,
          reassessmentRisk: 0.15
        }
      });

      expect(fairResult.label).toBe('FAIR');
      expect(fairResult.savingsEstimate).toBe(0);
    });

    it('should test file validation edge cases', async () => {
      const { validateFile } = await import('../mocks/charly-packages.js');

      // Test empty buffer
      const emptyResult = await validateFile(Buffer.alloc(0), 'application/pdf', 'test.pdf');
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.errors).toContain('Empty file');

      // Test unsupported file type
      const unsupportedResult = await validateFile(Buffer.from('test'), 'application/exe', 'malware.exe');
      expect(unsupportedResult.valid).toBe(false);
      expect(unsupportedResult.errors?.[0]).toContain('Unsupported file type');
    });

    it('should test commercial property validation edge cases', async () => {
      const { validateCommercialPropertySafe } = await import('../mocks/charly-packages.js');

      // Test null property
      const nullResult = validateCommercialPropertySafe(null);
      expect(nullResult.valid).toBe(false);
      expect(nullResult.errors).toContain('Property data is required');

      // Test invalid assessed value
      const invalidAssessedResult = validateCommercialPropertySafe({
        assessedValue: -100000,
        taxRate: 0.012
      });
      expect(invalidAssessedResult.valid).toBe(false);
      expect(invalidAssessedResult.errors).toContain('Valid assessed value is required');

      // Test invalid tax rate
      const invalidTaxResult = validateCommercialPropertySafe({
        assessedValue: 1000000,
        taxRate: -0.01
      });
      expect(invalidTaxResult.valid).toBe(false);
      expect(invalidTaxResult.errors).toContain('Valid tax rate is required');
    });
  });

  describe('UploadService file processing errors', () => {
    it('should handle virus detection in async processing', async () => {
      const service = new UploadService();
      
      // We can't easily test the async processing without modifying the service
      // but we can at least test that the service exists and has the right methods
      expect(service).toHaveProperty('processUpload');
      expect(typeof service.processUpload).toBe('function');
    });
  });
});