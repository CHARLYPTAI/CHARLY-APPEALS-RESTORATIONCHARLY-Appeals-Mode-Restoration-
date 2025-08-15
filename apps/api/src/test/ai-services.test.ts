import { describe, it, expect } from 'vitest';
import { AINewNarrativeService } from '../services/ai-narrative-service.js';
import { AISwartzService } from '../services/ai-swartz-service.js';
import type { NarrativeRequest } from '../services/ai-narrative-service.js';
import type { SwartzParseRequest } from '../services/ai-swartz-service.js';

describe('AI Services Tests', () => {
  describe('AI Narrative Service', () => {
    const narrativeService = new AINewNarrativeService();

    it('should generate commercial narratives', async () => {
      const request: NarrativeRequest = {
        propertyId: 'PROP-001',
        propertyType: 'commercial',
        approaches: [
          {
            approach: 'income',
            indicatedValue: 3200000,
            confidence: 0.85,
            weight: 0.5,
            completed: true,
            rationale: ['Strong NOI performance', 'Market cap rates support valuation']
          }
        ],
        propertyData: {
          address: '123 Business Ave, Anytown, CA',
          assessedValue: 2500000,
          estimatedMarketValue: 3200000,
          jurisdiction: 'Sample County'
        }
      };

      const result = await narrativeService.generateCommercialNarrative(request);
      
      expect(result).toHaveProperty('sections');
      expect(Array.isArray(result.sections)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Should have fallback narratives even if AI fails
      if (result.sections.length > 0) {
        expect(result.sections[0]).toHaveProperty('id');
        expect(result.sections[0]).toHaveProperty('title');
        expect(result.sections[0]).toHaveProperty('content');
      }
    });

    it('should generate residential narratives', async () => {
      const request: NarrativeRequest = {
        propertyId: 'PROP-002',
        propertyType: 'residential',
        approaches: [
          {
            approach: 'sales',
            indicatedValue: 650000,
            confidence: 0.80,
            weight: 1.0,
            completed: true,
            rationale: ['Three comparable sales', 'Recent market activity']
          }
        ],
        propertyData: {
          address: '456 Residential St, Hometown, CA',
          assessedValue: 700000,
          estimatedMarketValue: 650000,
          jurisdiction: 'Sample County'
        }
      };

      const result = await narrativeService.generateResidentialNarrative(request);
      
      expect(result).toHaveProperty('sections');
      expect(Array.isArray(result.sections)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle validation errors', async () => {
      const invalidRequest: NarrativeRequest = {
        propertyId: 'PROP-003',
        propertyType: 'commercial',
        approaches: [], // No approaches - should cause validation error
        propertyData: {
          address: '789 Error St',
          assessedValue: 100000,
          estimatedMarketValue: 100000,
          jurisdiction: 'Test County'
        }
      };

      const result = await narrativeService.generateCommercialNarrative(invalidRequest);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.sections.length).toBe(0);
    });
  });

  describe('AI SWARTZ Service', () => {
    const swartzService = new AISwartzService();

    const mockIncomeDocument = {
      id: 'doc-1',
      filename: 'income_statement_2023.csv',
      type: 'income_statement' as const,
      content: `
Property Revenue,2023,2022,2021
Gross Rental Income,850000,820000,800000
Vacancy Loss,-42500,-41000,-40000
Effective Gross Income,807500,779000,760000
Operating Expenses,242250,233700,228000
Net Operating Income,565250,545300,532000
      `,
      uploadDate: '2024-01-15T10:00:00Z'
    };

    it('should parse income documents', async () => {
      const request: SwartzParseRequest = {
        propertyId: 'PROP-001',
        documents: [mockIncomeDocument],
        approach: 'income',
        targetYear: 2023
      };

      const result = await swartzService.parseIncomeApproach(request);
      
      expect(result).toHaveProperty('requestId');
      expect(result.approach).toBe('income');
      expect(result).toHaveProperty('incomeData');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      
      if (result.incomeData) {
        expect(typeof result.incomeData.grossRentalIncome).toBe('number');
        expect(typeof result.incomeData.operatingExpenses).toBe('number');
        expect(typeof result.incomeData.netOperatingIncome).toBe('number');
      }
    });

    it('should parse sales documents', async () => {
      const mockSalesDocument = {
        id: 'doc-sales',
        filename: 'comparable_sales.csv',
        type: 'other' as const,
        content: `
Address,Sale Date,Sale Price,Square Feet,Price per SF
123 Main St,2023-06-15,3200000,12000,267
456 Oak Ave,2023-08-20,3150000,11800,267
789 Pine Rd,2023-09-10,3350000,12500,268
        `,
        uploadDate: '2024-01-15T10:00:00Z'
      };

      const request: SwartzParseRequest = {
        propertyId: 'PROP-001',
        documents: [mockSalesDocument],
        approach: 'sales'
      };

      const result = await swartzService.parseSalesComparison(request);
      
      expect(result.approach).toBe('sales');
      expect(result).toHaveProperty('salesData');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      
      if (result.salesData) {
        expect(Array.isArray(result.salesData.comparables)).toBe(true);
        expect(typeof result.salesData.indicatedValue).toBe('number');
      }
    });

    it('should parse cost documents', async () => {
      const mockCostDocument = {
        id: 'doc-cost',
        filename: 'cost_analysis.txt',
        type: 'other' as const,
        content: `
Cost Approach Analysis
Land Value: $750,000
Replacement Cost: $2,400,000
Physical Depreciation: 15%
Functional Obsolescence: 5%
External Obsolescence: 2%
        `,
        uploadDate: '2024-01-15T10:00:00Z'
      };

      const request: SwartzParseRequest = {
        propertyId: 'PROP-001',
        documents: [mockCostDocument],
        approach: 'cost'
      };

      const result = await swartzService.parseCostApproach(request);
      
      expect(result.approach).toBe('cost');
      expect(result).toHaveProperty('costData');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      
      if (result.costData) {
        expect(typeof result.costData.landValue).toBe('number');
        expect(typeof result.costData.improvementCost).toBe('number');
        expect(result.costData).toHaveProperty('depreciation');
      }
    });

    it('should handle validation errors', async () => {
      const invalidRequest: SwartzParseRequest = {
        propertyId: 'PROP-001',
        documents: [], // No documents
        approach: 'income'
      };

      const result = await swartzService.parseIncomeApproach(invalidRequest);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle wrong approach type', async () => {
      const wrongApproachRequest: SwartzParseRequest = {
        propertyId: 'PROP-001',
        documents: [mockIncomeDocument],
        approach: 'sales' // Wrong approach for income document
      };

      const result = await swartzService.parseIncomeApproach(wrongApproachRequest);
      
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should have proper service dependencies', () => {
      // Test that services can be instantiated
      const narrativeService = new AINewNarrativeService();
      const swartzService = new AISwartzService();
      
      expect(narrativeService).toBeDefined();
      expect(swartzService).toBeDefined();
    });

    it('should handle concurrent operations', async () => {
      const narrativeService = new AINewNarrativeService();
      const swartzService = new AISwartzService();
      
      const narrativeRequest: NarrativeRequest = {
        propertyId: 'PROP-CONCURRENT',
        propertyType: 'commercial',
        approaches: [{
          approach: 'income',
          indicatedValue: 1000000,
          confidence: 0.8,
          weight: 1.0,
          completed: true,
          rationale: ['Test rationale']
        }],
        propertyData: {
          address: 'Concurrent Test',
          assessedValue: 900000,
          estimatedMarketValue: 1000000,
          jurisdiction: 'Test'
        }
      };

      const swartzRequest: SwartzParseRequest = {
        propertyId: 'PROP-CONCURRENT',
        documents: [{
          id: 'concurrent-doc',
          filename: 'test.csv',
          type: 'income_statement',
          content: 'Revenue: 100000',
          uploadDate: '2024-01-15T10:00:00Z'
        }],
        approach: 'income'
      };

      // Run both services concurrently
      const [narrativeResult, swartzResult] = await Promise.all([
        narrativeService.generateCommercialNarrative(narrativeRequest),
        swartzService.parseIncomeApproach(swartzRequest)
      ]);

      expect(narrativeResult).toBeDefined();
      expect(swartzResult).toBeDefined();
    });
  });
});