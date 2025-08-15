import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationService } from '../services/validation-service.js';
import type { CommercialValidationRequest } from '../types/api.js';

// Mock the charly packages
vi.mock('../mocks/charly-packages.js', () => ({
  validateCommercialPropertySafe: vi.fn(),
  makeAssessmentDecision: vi.fn()
}));

describe('ValidationService', () => {
  let validationService: ValidationService;
  let mockValidateCommercialPropertySafe: any;
  let mockMakeAssessmentDecision: any;

  beforeEach(async () => {
    validationService = new ValidationService();
    
    // Get mocked functions
    const charlyPackages = await import('../mocks/charly-packages.js');
    mockValidateCommercialPropertySafe = vi.mocked(charlyPackages.validateCommercialPropertySafe);
    mockMakeAssessmentDecision = vi.mocked(charlyPackages.makeAssessmentDecision);
    
    vi.clearAllMocks();
  });

  describe('validateCommercial', () => {
    const validRequest: CommercialValidationRequest = {
      property: {
        assessedValue: 1000000,
        marketValue: 1200000,
        taxRate: 0.012,
        address: {
          street: '123 Business St',
          city: 'Austin',
          state: 'TX',
          zip: '78701'
        }
      },
      rent_roll_ref: 'rent-roll-123',
      income_stmt_ref: 'income-stmt-456'
    };

    it('should successfully validate a valid commercial property', async () => {
      const propertyData = {
        assessedValue: 1000000,
        marketValue: 1200000,
        taxRate: 0.012
      };

      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: true,
        data: propertyData
      });

      mockMakeAssessmentDecision.mockReturnValue({
        label: 'OVER',
        confidence: 0.85,
        savingsEstimate: 2400
      });

      const result = await validationService.validateCommercial(validRequest);

      expect(result.workfile_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.normalized).toEqual(propertyData);
      expect(result.errors).toEqual([]);
      expect(result.decision_preview).toEqual({
        label: 'OVER',
        confidence: 0.85,
        savings_estimate: 2400
      });

      expect(mockValidateCommercialPropertySafe).toHaveBeenCalledWith(validRequest.property);
      expect(mockMakeAssessmentDecision).toHaveBeenCalledWith({
        assessedValue: 1000000,
        estimatedMarketValue: 1200000,
        valueConfidence: 0.8,
        taxRate: 0.012,
        jurisdictionPriors: {
          successRate: 0.65,
          averageFees: 5000,
          averageTimeToResolution: 180,
          reassessmentRisk: 0.15
        }
      });
    });

    it('should return validation errors for invalid property', async () => {
      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: false,
        errors: ['Valid assessed value is required', 'Valid tax rate is required']
      });

      const result = await validationService.validateCommercial(validRequest);

      expect(result.workfile_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.normalized).toEqual(validRequest.property);
      expect(result.errors).toEqual(['Valid assessed value is required', 'Valid tax rate is required']);
      expect(result.decision_preview).toBeUndefined();

      expect(mockValidateCommercialPropertySafe).toHaveBeenCalledWith(validRequest.property);
      expect(mockMakeAssessmentDecision).not.toHaveBeenCalled();
    });

    it('should handle property without market value', async () => {
      const requestWithoutMarketValue = {
        ...validRequest,
        property: {
          assessedValue: 1000000,
          taxRate: 0.012
        }
      };

      const propertyData = {
        assessedValue: 1000000,
        taxRate: 0.012
      };

      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: true,
        data: propertyData
      });

      const result = await validationService.validateCommercial(requestWithoutMarketValue);

      expect(result.workfile_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.normalized).toEqual(propertyData);
      expect(result.errors).toEqual([]);
      expect(result.decision_preview).toBeUndefined();

      expect(mockMakeAssessmentDecision).not.toHaveBeenCalled();
    });

    it('should handle decision engine errors gracefully', async () => {
      const propertyData = {
        assessedValue: 1000000,
        marketValue: 1200000,
        taxRate: 0.012
      };

      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: true,
        data: propertyData
      });

      mockMakeAssessmentDecision.mockImplementation(() => {
        throw new Error('Decision engine unavailable');
      });

      const result = await validationService.validateCommercial(validRequest);

      expect(result.workfile_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.normalized).toEqual(propertyData);
      expect(result.errors).toEqual(['Decision preview failed: Decision engine unavailable']);
      expect(result.decision_preview).toBeUndefined();
    });

    it('should generate unique workfile IDs for different requests', async () => {
      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: true,
        data: { assessedValue: 1000000, taxRate: 0.012 }
      });

      const result1 = await validationService.validateCommercial(validRequest);
      const result2 = await validationService.validateCommercial(validRequest);

      expect(result1.workfile_id).not.toBe(result2.workfile_id);
    });

    it('should handle minimal valid property data', async () => {
      const minimalRequest: CommercialValidationRequest = {
        property: {
          assessedValue: 500000,
          taxRate: 0.01
        }
      };

      const propertyData = {
        assessedValue: 500000,
        taxRate: 0.01
      };

      mockValidateCommercialPropertySafe.mockReturnValue({
        valid: true,
        data: propertyData
      });

      const result = await validationService.validateCommercial(minimalRequest);

      expect(result.workfile_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.normalized).toEqual(propertyData);
      expect(result.errors).toEqual([]);
      expect(result.decision_preview).toBeUndefined();
    });
  });

  describe('validateResidential', () => {
    it('should return not implemented error for residential validation', async () => {
      const property = {
        address: '123 Home St',
        assessedValue: 400000
      };

      const result = await validationService.validateResidential(property);

      expect(result.workfile_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.normalized).toEqual(property);
      expect(result.errors).toEqual(['Residential validation not yet implemented']);
      expect(result.decision_preview).toBeUndefined();
    });

    it('should handle null property input', async () => {
      const result = await validationService.validateResidential(null);

      expect(result.workfile_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.normalized).toBeNull();
      expect(result.errors).toEqual(['Residential validation not yet implemented']);
    });

    it('should handle undefined property input', async () => {
      const result = await validationService.validateResidential(undefined);

      expect(result.workfile_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.normalized).toBeUndefined();
      expect(result.errors).toEqual(['Residential validation not yet implemented']);
    });

    it('should generate unique workfile IDs for residential validation', async () => {
      const property = { address: '456 Another St' };

      const result1 = await validationService.validateResidential(property);
      const result2 = await validationService.validateResidential(property);

      expect(result1.workfile_id).not.toBe(result2.workfile_id);
    });
  });
});