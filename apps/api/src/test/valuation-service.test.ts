import { describe, it, expect, beforeEach } from 'vitest';
import { ValuationService, type SalesComparisonRequest, type CostApproachRequest } from '../services/valuation-service.js';

describe('ValuationService', () => {
  let valuationService: ValuationService;

  beforeEach(() => {
    valuationService = new ValuationService();
  });

  describe('Sales Comparison Approach', () => {
    const validSalesComparisonRequest: SalesComparisonRequest = {
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
          adjustedPrice: 3152000,
          adjustedPricePerSF: 110.60,
          weight: 0.4
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
          adjustedPrice: 2945000,
          adjustedPricePerSF: 109.89,
          weight: 0.6
        }
      ]
    };

    it('should calculate sales comparison valuation correctly', async () => {
      const result = await valuationService.calculateSalesComparison(validSalesComparisonRequest);

      expect(result.workfile_id).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.indicated_value).toBeGreaterThan(0);
      expect(result.weighted_avg_price_per_sf).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.rationale.length).toBeGreaterThan(0);
      expect(result.comparables).toHaveLength(2);
    });

    it('should recalculate adjusted prices based on adjustments', async () => {
      const result = await valuationService.calculateSalesComparison(validSalesComparisonRequest);

      const comp1 = result.comparables.find(c => c.id === 'comp1');
      const comp2 = result.comparables.find(c => c.id === 'comp2');

      expect(comp1?.adjustedPrice).toBe(3152000); // 3150000 + 2000
      expect(comp2?.adjustedPrice).toBe(2945000); // 2950000 - 5000 - 8000 + 8000
    });

    it('should calculate weighted average correctly', async () => {
      const result = await valuationService.calculateSalesComparison(validSalesComparisonRequest);

      // Expected: (3152000 * 0.4) + (2945000 * 0.6) = 1260800 + 1767000 = 3027800
      expect(result.indicated_value).toBe(3027800);
    });

    it('should validate that weights sum to 1.0', async () => {
      const invalidRequest = {
        ...validSalesComparisonRequest,
        comparables: [
          { ...validSalesComparisonRequest.comparables[0], weight: 0.3 },
          { ...validSalesComparisonRequest.comparables[1], weight: 0.4 } // Sum = 0.7
        ]
      };

      const result = await valuationService.calculateSalesComparison(invalidRequest);

      expect(result.errors.some(err => err.includes('weights must sum to 1.0'))).toBe(true);
    });

    it('should handle empty comparables array', async () => {
      const emptyRequest: SalesComparisonRequest = {
        propertyId: 'test',
        comparables: []
      };

      const result = await valuationService.calculateSalesComparison(emptyRequest);

      expect(result.errors).toContain('At least one comparable is required');
      expect(result.indicated_value).toBe(0);
    });

    it('should handle missing property ID', async () => {
      const invalidRequest = {
        ...validSalesComparisonRequest,
        propertyId: ''
      };

      const result = await valuationService.calculateSalesComparison(invalidRequest);

      expect(result.errors).toContain('Property ID is required');
    });

    it('should calculate confidence based on comparables quality', async () => {
      // Test with excellent comparables (recent sales, minimal adjustments)
      const excellentRequest: SalesComparisonRequest = {
        propertyId: 'test',
        comparables: [
          {
            id: 'comp1',
            address: 'Test Address 1',
            saleDate: new Date().toISOString().split('T')[0], // Today
            salePrice: 1000000,
            squareFootage: 10000,
            pricePerSF: 100,
            condition: 'good',
            location: 'similar',
            adjustments: { condition: 0, location: 0, time: 0, other: 0 }, // No adjustments
            adjustedPrice: 1000000,
            adjustedPricePerSF: 100,
            weight: 0.5
          },
          {
            id: 'comp2',
            address: 'Test Address 2',
            saleDate: new Date().toISOString().split('T')[0], // Today
            salePrice: 1050000,
            squareFootage: 10000,
            pricePerSF: 105,
            condition: 'good',
            location: 'similar',
            adjustments: { condition: 0, location: 0, time: 0, other: 0 }, // No adjustments
            adjustedPrice: 1050000,
            adjustedPricePerSF: 105,
            weight: 0.5
          }
        ]
      };

      const result = await valuationService.calculateSalesComparison(excellentRequest);

      expect(result.confidence).toBeGreaterThan(0.8); // Should be high confidence
    });

    it('should generate appropriate rationale', async () => {
      const result = await valuationService.calculateSalesComparison(validSalesComparisonRequest);

      expect(result.rationale.some(r => r.includes('Analysis based on 2 comparable'))).toBe(true);
      expect(result.rationale.some(r => r.includes('price range'))).toBe(true);
    });
  });

  describe('Cost Approach', () => {
    const validCostApproachRequest: CostApproachRequest = {
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

    it('should calculate cost approach valuation correctly', async () => {
      const result = await valuationService.calculateCostApproach(validCostApproachRequest);

      expect(result.workfile_id).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.cost_data.landValue).toBe(800000);
      expect(result.cost_data.totalReplacementCost).toBe(2500000);
      expect(result.cost_data.indicatedValue).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate depreciation correctly', async () => {
      const result = await valuationService.calculateCostApproach(validCostApproachRequest);

      // Expected depreciation components
      const expectedPhysical = 2500000 * 0.15; // 375000
      const expectedFunctional = 2500000 * 0.05; // 125000
      const expectedExternal = 2500000 * 0.00; // 0
      const expectedAge = 2500000 * (8/50); // 400000 (age-based)

      expect(result.cost_data.depreciation.physical).toBe(expectedPhysical);
      expect(result.cost_data.depreciation.functional).toBe(expectedFunctional);
      expect(result.cost_data.depreciation.external).toBe(expectedExternal);
      expect(result.cost_data.depreciation.total).toBeGreaterThan(0);
    });

    it('should calculate final indicated value correctly', async () => {
      const result = await valuationService.calculateCostApproach(validCostApproachRequest);

      // Final value should be land value + depreciated improvement value
      const expectedValue = result.cost_data.landValue + result.cost_data.improvementValue;
      expect(result.cost_data.indicatedValue).toBe(Math.round(expectedValue));
    });

    it('should cap depreciation at 95%', async () => {
      const excessiveDepreciationRequest: CostApproachRequest = {
        ...validCostApproachRequest,
        age: 100,
        effectiveAge: 100,
        physicalDeterioration: 90,
        functionalObsolescence: 90,
        externalObsolescence: 90
      };

      const result = await valuationService.calculateCostApproach(excessiveDepreciationRequest);

      const totalDepreciationRate = result.cost_data.depreciation.total / result.cost_data.totalReplacementCost;
      expect(totalDepreciationRate).toBeLessThanOrEqual(0.95);
    });

    it('should validate required fields', async () => {
      const invalidRequest: CostApproachRequest = {
        propertyId: '',
        landValue: -1,
        improvementCost: 0,
        age: -5,
        effectiveAge: -3,
        economicLife: 0,
        physicalDeterioration: 0,
        functionalObsolescence: 0,
        externalObsolescence: 0
      };

      const result = await valuationService.calculateCostApproach(invalidRequest);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Property ID is required');
      expect(result.errors).toContain('Land value must be greater than 0');
      expect(result.errors).toContain('Improvement cost must be greater than 0');
      expect(result.errors).toContain('Age and economic life values must be valid');
    });

    it('should calculate higher confidence for newer properties', async () => {
      const newPropertyRequest: CostApproachRequest = {
        ...validCostApproachRequest,
        age: 2,
        effectiveAge: 2
      };

      const oldPropertyRequest: CostApproachRequest = {
        ...validCostApproachRequest,
        age: 45,
        effectiveAge: 45
      };

      const newResult = await valuationService.calculateCostApproach(newPropertyRequest);
      const oldResult = await valuationService.calculateCostApproach(oldPropertyRequest);

      expect(newResult.confidence).toBeGreaterThan(oldResult.confidence);
    });

    it('should handle zero land value as validation error', async () => {
      const request: CostApproachRequest = {
        ...validCostApproachRequest,
        landValue: 0
      };

      const result = await valuationService.calculateCostApproach(request);

      expect(result.errors).toContain('Land value must be greater than 0');
    });

    it('should handle negative economic life as validation error', async () => {
      const request: CostApproachRequest = {
        ...validCostApproachRequest,
        economicLife: -10
      };

      const result = await valuationService.calculateCostApproach(request);

      expect(result.errors).toContain('Age and economic life values must be valid');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully in sales comparison', async () => {
      // Create a service that will throw an error
      const mockService = new ValuationService();
      
      // Mock a method to throw an error during calculation
      const originalMethod = mockService['calculateSalesComparisonConfidence'];
      mockService['calculateSalesComparisonConfidence'] = () => {
        throw new Error('Confidence calculation failed');
      };

      const request: SalesComparisonRequest = {
        propertyId: 'test',
        comparables: [
          {
            id: 'comp1',
            address: 'Test',
            saleDate: '2023-01-01',
            salePrice: 1000000,
            squareFootage: 10000,
            pricePerSF: 100,
            condition: 'good',
            location: 'similar',
            adjustments: { condition: 0, location: 0, time: 0, other: 0 },
            adjustedPrice: 1000000,
            adjustedPricePerSF: 100,
            weight: 1.0
          }
        ]
      };

      const result = await mockService.calculateSalesComparison(request);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Sales comparison calculation failed');
      
      // Restore original method
      mockService['calculateSalesComparisonConfidence'] = originalMethod;
    });

    it('should handle service errors gracefully in cost approach', async () => {
      // Test that service errors are properly caught and returned
      const invalidRequest: any = null;

      try {
        await valuationService.calculateCostApproach(invalidRequest);
      } catch (error) {
        // Should not throw, but return error in response
        expect(true).toBe(false); // Should not reach here
      }
    });
  });
});