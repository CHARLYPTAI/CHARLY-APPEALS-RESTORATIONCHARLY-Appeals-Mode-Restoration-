import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../services/validation-service.js';
import type { ResidentialProperty } from '../types/api.js';

describe('ValidationService - Residential', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateResidential', () => {
    const validResidentialProperty: ResidentialProperty = {
      property_address: '123 Main Street, Anytown, CA 90210',
      assessed_value: 450000,
      market_value: 500000,
      jurisdiction: 'Sample County',
      tax_year: 2024,
      homestead_exemption: true,
      square_footage: 1800,
      lot_size: 0.25,
      year_built: 1995,
      bedrooms: 3,
      bathrooms: 2,
      property_type: 'single_family',
      garage_spaces: 2,
      property_data: {}
    };

    it('should successfully validate a valid residential property', async () => {
      const result = await validationService.validateResidential(validResidentialProperty);

      expect(result.workfile_id).toBeDefined();
      expect(result.workfile_id).toMatch(/^[a-f0-9-]+$/); // UUID format
      expect(result.errors).toEqual([]);
      expect(result.normalized).toBeDefined();
      expect(result.decision_preview).toBeDefined();
      expect(result.decision_preview?.label).toBe('UNDER'); // 450k vs 500k should be UNDER
    });

    it('should detect overassessed property correctly', async () => {
      const overassessedProperty: ResidentialProperty = {
        ...validResidentialProperty,
        assessed_value: 600000, // Much higher than market value
        market_value: 500000
      };

      const result = await validationService.validateResidential(overassessedProperty);

      expect(result.decision_preview?.label).toBe('OVER');
      expect(result.decision_preview?.confidence).toBeGreaterThan(0.5);
      expect(result.decision_preview?.savings_estimate).toBeGreaterThan(0);
    });

    it('should detect fairly assessed property correctly', async () => {
      const fairProperty: ResidentialProperty = {
        ...validResidentialProperty,
        assessed_value: 500000,
        market_value: 505000 // Very close values
      };

      const result = await validationService.validateResidential(fairProperty);

      expect(result.decision_preview?.label).toBe('FAIR');
      expect(result.decision_preview?.savings_estimate).toBe(0);
    });

    it('should detect underassessed property correctly', async () => {
      const underassessedProperty: ResidentialProperty = {
        ...validResidentialProperty,
        assessed_value: 400000,
        market_value: 500000 // Assessed much lower than market
      };

      const result = await validationService.validateResidential(underassessedProperty);

      expect(result.decision_preview?.label).toBe('UNDER');
      expect(result.decision_preview?.savings_estimate).toBe(0);
    });

    it('should require property address', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        property_address: ''
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain('Property address is required');
    });

    it('should validate property address length', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        property_address: '123' // Too short
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain('Property address must be at least 5 characters');
    });

    it('should validate negative assessed value', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        assessed_value: -1000
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain('Assessed value must be non-negative');
    });

    it('should validate negative market value', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        market_value: -1000
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain('Market value must be non-negative');
    });

    it('should validate minimum square footage', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        square_footage: 50 // Too small
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain('Square footage must be at least 100');
    });

    it('should validate year built range', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        year_built: 1750 // Too old
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain(`Year built must be between 1800 and ${new Date().getFullYear() + 2}`);
    });

    it('should validate bedroom count', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        bedrooms: 25 // Too many
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain('Bedrooms must be between 0 and 20');
    });

    it('should validate bathroom count', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        bathrooms: -1 // Negative
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain('Bathrooms must be between 0 and 20');
    });

    it('should validate property type enum', async () => {
      const invalidProperty: ResidentialProperty = {
        ...validResidentialProperty,
        property_type: 'invalid_type' as any
      };

      const result = await validationService.validateResidential(invalidProperty);

      expect(result.errors).toContain('Property type must be one of: single_family, condo, townhome, duplex, other');
    });

    it('should normalize property data correctly', async () => {
      const propertyWithSpaces: ResidentialProperty = {
        ...validResidentialProperty,
        property_address: '  123 Main Street  ',
        jurisdiction: '  Sample County  '
      };

      const result = await validationService.validateResidential(propertyWithSpaces);
      const normalized = result.normalized as ResidentialProperty;

      expect(normalized.property_address).toBe('123 Main Street');
      expect(normalized.jurisdiction).toBe('Sample County');
      expect(normalized.homestead_exemption).toBe(true);
      expect(normalized.property_type).toBe('single_family');
    });

    it('should set default values for optional fields', async () => {
      const minimalProperty: ResidentialProperty = {
        property_address: '123 Main Street, Anytown, CA'
      };

      const result = await validationService.validateResidential(minimalProperty);
      const normalized = result.normalized as ResidentialProperty;

      expect(normalized.tax_year).toBe(new Date().getFullYear());
      expect(normalized.homestead_exemption).toBe(false);
      expect(normalized.property_type).toBe('single_family');
      expect(normalized.property_data).toEqual({});
    });

    it('should handle missing decision preview data gracefully', async () => {
      const propertyWithoutValues: ResidentialProperty = {
        property_address: '123 Main Street, Anytown, CA'
        // No assessed_value or market_value
      };

      const result = await validationService.validateResidential(propertyWithoutValues);

      expect(result.errors).toEqual([]);
      expect(result.decision_preview).toBeUndefined();
    });

    it('should validate all residential property types', async () => {
      const propertyTypes = ['single_family', 'condo', 'townhome', 'duplex', 'other'];

      for (const propertyType of propertyTypes) {
        const property: ResidentialProperty = {
          ...validResidentialProperty,
          property_type: propertyType as any
        };

        const result = await validationService.validateResidential(property);
        
        expect(result.errors).toEqual([]);
        expect((result.normalized as ResidentialProperty).property_type).toBe(propertyType);
      }
    });

    it('should calculate savings estimate correctly', async () => {
      const overassessedProperty: ResidentialProperty = {
        ...validResidentialProperty,
        assessed_value: 600000,
        market_value: 500000 // $100k overassessed
      };

      const result = await validationService.validateResidential(overassessedProperty);

      // Should estimate savings as (600k - 500k) * 0.012 = $1,200 annual
      expect(result.decision_preview?.savings_estimate).toBeCloseTo(1200, 0);
    });
  });
});