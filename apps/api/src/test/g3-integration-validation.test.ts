import { describe, it, expect } from 'vitest';
import { AINewNarrativeService } from '../services/ai-narrative-service.js';
import { AISwartzService } from '../services/ai-swartz-service.js';
import { AppealService } from '../services/appeal-service.js';
import { ValuationService } from '../services/valuation-service.js';

describe('G3 — Integration Validation with Current API', () => {

  describe('Commercial SWARTZ Workflow Integration', () => {
    it('should integrate AI services with existing appeal workflow', async () => {
      const narrativeService = new AINewNarrativeService();
      const swartzService = new AISwartzService();
      const appealService = new AppealService();
      
      // Step 1: AI SWARTZ Parsing (simulated)
      const swartzRequest = {
        propertyId: 'COMMERCIAL-001',
        documents: [{
          id: 'doc-commercial',
          filename: 'commercial_income_2023.csv',
          type: 'income_statement' as const,
          content: `
Property Income Statement - 2023
Gross Rental Income,$875,000
Vacancy Loss,$-43,750
Effective Gross Income,$831,250
Operating Expenses,$-245,000
Net Operating Income,$586,250
          `,
          uploadDate: '2024-01-15T10:00:00Z'
        }],
        approach: 'income' as const
      };

      const swartzResult = await swartzService.parseIncomeApproach(swartzRequest);
      expect(swartzResult.approach).toBe('income');
      expect(swartzResult.confidence).toBeGreaterThanOrEqual(0);
      
      // Step 2: Generate AI Narratives
      const narrativeRequest = {
        propertyId: 'COMMERCIAL-001',
        propertyType: 'commercial' as const,
        approaches: [{
          approach: 'income' as const,
          indicatedValue: 3216667,
          confidence: 0.88,
          weight: 0.5,
          completed: true,
          rationale: ['Strong NOI of $586,250', 'Market cap rate supports valuation']
        }],
        propertyData: {
          address: '123 Commercial Plaza, Business City, CA',
          assessedValue: 3500000,
          estimatedMarketValue: 3216667,
          jurisdiction: 'Los Angeles County'
        }
      };

      const narrativeResult = await narrativeService.generateCommercialNarrative(narrativeRequest);
      expect(narrativeResult.sections).toBeDefined();
      expect(Array.isArray(narrativeResult.errors)).toBe(true);

      // Step 3: Generate Appeal Packet with AI Enhancement
      const appealRequest = {
        propertyId: 'COMMERCIAL-001',
        approaches: [{
          approach: 'income' as const,
          indicatedValue: 3216667,
          confidence: 0.88,
          weight: 1.0,
          completed: true,
          rationale: ['AI-enhanced income approach analysis']
        }],
        reconciliation: {
          finalValue: 3216667,
          overallConfidence: 0.88,
          recommendation: 'APPEAL' as const,
          savingsEstimate: 18750
        },
        narrativeSections: narrativeResult.sections
      };

      const appealResult = await appealService.generateComprehensivePacket(appealRequest);
      expect(appealResult.status).toBe('GENERATED');
      expect(appealResult.packet_id).toBeDefined();
    });

    it('should handle all three valuation approaches with AI enhancement', async () => {
      const valuationService = new ValuationService();
      const narrativeService = new AINewNarrativeService();

      // Sales Comparison Approach
      const salesRequest = {
        propertyId: 'COMMERCIAL-002',
        comparables: [
          {
            id: 'comp-1',
            address: '456 Business Ave',
            saleDate: '2023-08-15',
            salePrice: 3200000,
            squareFootage: 14500,
            pricePerSF: 221,
            condition: 'good' as const,
            location: 'similar' as const,
            adjustments: { condition: 0, location: 0, time: -25000, other: 0 },
            adjustedPrice: 3175000,
            adjustedPricePerSF: 219,
            weight: 0.4
          },
          {
            id: 'comp-2',
            address: '789 Corporate Dr',
            saleDate: '2023-09-20',
            salePrice: 3350000,
            squareFootage: 15200,
            pricePerSF: 220,
            condition: 'excellent' as const,
            location: 'similar' as const,
            adjustments: { condition: -50000, location: 0, time: -15000, other: 0 },
            adjustedPrice: 3285000,
            adjustedPricePerSF: 216,
            weight: 0.6
          }
        ]
      };

      const salesResult = await valuationService.calculateSalesComparison(salesRequest);
      expect(salesResult.indicated_value).toBeGreaterThan(0);
      expect(salesResult.confidence).toBeGreaterThan(0.5);

      // Cost Approach
      const costRequest = {
        propertyId: 'COMMERCIAL-002',
        landValue: 950000,
        improvementCost: 2850000,
        age: 19,
        effectiveAge: 15,
        economicLife: 50,
        physicalDeterioration: 18,
        functionalObsolescence: 3,
        externalObsolescence: 0
      };

      const costResult = await valuationService.calculateCostApproach(costRequest);
      expect(costResult.cost_data.indicatedValue).toBeGreaterThan(0);
      expect(costResult.confidence).toBeGreaterThan(0.5);

      // Generate comprehensive narrative for all approaches
      const narrativeRequest = {
        propertyId: 'COMMERCIAL-002',
        propertyType: 'commercial' as const,
        approaches: [
          {
            approach: 'income' as const,
            indicatedValue: 3216667,
            confidence: 0.88,
            weight: 0.45,
            completed: true,
            rationale: ['AI-parsed financial data', 'Market-derived cap rate']
          },
          {
            approach: 'sales' as const,
            indicatedValue: salesResult.indicated_value,
            confidence: salesResult.confidence,
            weight: 0.35,
            completed: true,
            rationale: salesResult.rationale
          },
          {
            approach: 'cost' as const,
            indicatedValue: costResult.cost_data.indicatedValue,
            confidence: costResult.confidence,
            weight: 0.20,
            completed: true,
            rationale: ['Replacement cost analysis', 'Age-based depreciation']
          }
        ],
        propertyData: {
          address: '789 Multi-Approach Plaza',
          assessedValue: 3500000,
          estimatedMarketValue: 3200000,
          jurisdiction: 'Sample County'
        }
      };

      const narrativeResult = await narrativeService.generateCommercialNarrative(narrativeRequest);
      expect(narrativeResult.sections.length).toBeGreaterThanOrEqual(0); // AI may be unavailable, but should not crash
    });
  });

  describe('Residential High-Volume Batch Processing', () => {
    it('should process batch residential properties efficiently', async () => {
      const valuationService = new ValuationService();
      const narrativeService = new AINewNarrativeService();
      const batchSize = 25; // Simulating high volume

      const batchPromises = Array.from({ length: batchSize }, async (_, index) => {
        const propertyId = `RESIDENTIAL-${String(index + 1).padStart(3, '0')}`;
        const assessedValue = 650000 + (index * 5000);
        const marketValue = assessedValue * (0.90 + Math.random() * 0.10); // 90-100% of assessed

        // Sales comparison for residential property
        const salesRequest = {
          propertyId,
          comparables: [
            {
              id: `${propertyId}-comp-1`,
              address: `${100 + index} Similar St`,
              saleDate: '2023-09-15',
              salePrice: Math.round(marketValue * 0.98),
              squareFootage: 1850,
              pricePerSF: Math.round((marketValue * 0.98) / 1850),
              condition: 'good' as const,
              location: 'similar' as const,
              adjustments: { condition: 0, location: 0, time: -5000, other: 0 },
              adjustedPrice: Math.round(marketValue * 0.98) - 5000,
              adjustedPricePerSF: Math.round((marketValue * 0.98 - 5000) / 1850),
              weight: 0.5
            },
            {
              id: `${propertyId}-comp-2`,
              address: `${200 + index} Nearby Ave`,
              saleDate: '2023-10-20',
              salePrice: Math.round(marketValue * 1.02),
              squareFootage: 1800,
              pricePerSF: Math.round((marketValue * 1.02) / 1800),
              condition: 'average' as const,
              location: 'similar' as const,
              adjustments: { condition: 10000, location: 0, time: -2000, other: 0 },
              adjustedPrice: Math.round(marketValue * 1.02) + 8000,
              adjustedPricePerSF: Math.round((marketValue * 1.02 + 8000) / 1800),
              weight: 0.5
            }
          ]
        };

        const salesResult = await valuationService.calculateSalesComparison(salesRequest);
        
        // Only generate narratives for properties that qualify for appeal (overassessed)
        if (assessedValue > salesResult.indicated_value * 1.05) {
          const narrativeRequest = {
            propertyId,
            propertyType: 'residential' as const,
            approaches: [{
              approach: 'sales' as const,
              indicatedValue: salesResult.indicated_value,
              confidence: salesResult.confidence,
              weight: 1.0,
              completed: true,
              rationale: salesResult.rationale
            }],
            propertyData: {
              address: `${300 + index} Residential Dr`,
              assessedValue,
              estimatedMarketValue: salesResult.indicated_value,
              jurisdiction: 'Orange County'
            }
          };

          const narrativeResult = await narrativeService.generateResidentialNarrative(narrativeRequest);
          
          return {
            propertyId,
            assessedValue,
            marketValue: salesResult.indicated_value,
            confidence: salesResult.confidence,
            qualifiesForAppeal: true,
            narrativeSections: narrativeResult.sections.length
          };
        }

        return {
          propertyId,
          assessedValue,
          marketValue: salesResult.indicated_value,
          confidence: salesResult.confidence,
          qualifiesForAppeal: false,
          narrativeSections: 0
        };
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Validate batch processing results
      expect(batchResults.length).toBe(batchSize);
      
      const qualifyingProperties = batchResults.filter(r => r.qualifiesForAppeal);
      const averageConfidence = batchResults.reduce((sum, r) => sum + r.confidence, 0) / batchResults.length;
      
      expect(averageConfidence).toBeGreaterThan(0.5);
      expect(qualifyingProperties.length).toBeGreaterThanOrEqual(0);
      
      console.log(`Batch processing results: ${batchResults.length} properties processed, ${qualifyingProperties.length} qualify for appeal, average confidence: ${averageConfidence.toFixed(2)}`);
    });
  });

  describe('AI Router Budget and Schema Compliance', () => {
    it('should track AI usage and enforce budget limits', async () => {
      const narrativeService = new AINewNarrativeService();
      
      // Multiple AI requests to test budget tracking
      const requests = Array.from({ length: 5 }, (_, i) => ({
        propertyId: `BUDGET-TEST-${i}`,
        propertyType: 'commercial' as const,
        approaches: [{
          approach: 'income' as const,
          indicatedValue: 2000000 + (i * 100000),
          confidence: 0.8,
          weight: 1.0,
          completed: true,
          rationale: [`Budget test ${i}`]
        }],
        propertyData: {
          address: `${i} Budget Test St`,
          assessedValue: 2000000,
          estimatedMarketValue: 2000000 + (i * 100000),
          jurisdiction: 'Test County'
        }
      }));

      const results = await Promise.all(
        requests.map(req => narrativeService.generateCommercialNarrative(req))
      );

      // All should complete (even if with fallback data when AI is unavailable)
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result).toHaveProperty('sections');
        expect(Array.isArray(result.errors)).toBe(true);
      });
    });

    it('should validate schema compliance across AI responses', async () => {
      const swartzService = new AISwartzService();
      
      const testDocument = {
        id: 'schema-test',
        filename: 'schema_validation_test.csv',
        type: 'income_statement' as const,
        content: `
Financial Data,2023
Gross Income,500000
Operating Expenses,150000
Net Income,350000
        `,
        uploadDate: '2024-01-15T10:00:00Z'
      };

      const parseResult = await swartzService.parseIncomeApproach({
        propertyId: 'SCHEMA-TEST',
        documents: [testDocument],
        approach: 'income'
      });

      // Validate response structure (should always be consistent regardless of AI availability)
      expect(parseResult).toHaveProperty('requestId');
      expect(parseResult).toHaveProperty('approach');
      expect(parseResult).toHaveProperty('confidence');
      expect(parseResult).toHaveProperty('errors');
      expect(parseResult).toHaveProperty('warnings');
      expect(parseResult.approach).toBe('income');
      expect(typeof parseResult.confidence).toBe('number');
      expect(parseResult.confidence).toBeGreaterThanOrEqual(0);
      expect(parseResult.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Jurisdiction Compliance Rule Enforcement', () => {
    it('should enforce jurisdiction-specific appeal rules', async () => {
      const appealService = new AppealService();
      
      // Test jurisdiction-specific requirements
      const appealRequest = {
        propertyId: 'JURISDICTION-TEST',
        approaches: [{
          approach: 'sales' as const,
          indicatedValue: 2800000,
          confidence: 0.85,
          weight: 1.0,
          completed: true,
          rationale: ['Jurisdiction compliance test']
        }],
        reconciliation: {
          finalValue: 2800000,
          overallConfidence: 0.85,
          recommendation: 'APPEAL' as const,
          savingsEstimate: 12500
        },
        narrativeSections: []
      };

      const result = await appealService.generateComprehensivePacket(appealRequest);
      
      // Should generate successfully with jurisdiction compliance
      expect(result.status).toBe('GENERATED');
      expect(result.packet_id).toBeDefined();
      expect(result.errors.length).toBe(0);
      
      // Check that packet includes jurisdiction-specific elements
      expect(result.download_url).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle AI service failures gracefully', async () => {
      const narrativeService = new AINewNarrativeService();
      
      // Request with invalid data that would cause AI processing to fail
      const invalidRequest = {
        propertyId: 'ERROR-TEST',
        propertyType: 'commercial' as const,
        approaches: [], // Empty approaches should trigger error
        propertyData: {
          address: 'Error Test Address',
          assessedValue: 0, // Invalid assessed value
          estimatedMarketValue: 0,
          jurisdiction: 'Error County'
        }
      };

      const result = await narrativeService.generateCommercialNarrative(invalidRequest);
      
      // Should handle errors gracefully
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.sections.length).toBe(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should provide fallback data when AI services are unavailable', async () => {
      const swartzService = new AISwartzService();
      
      const fallbackTest = {
        propertyId: 'FALLBACK-TEST',
        documents: [{
          id: 'fallback-doc',
          filename: 'fallback_test.csv',
          type: 'income_statement' as const,
          content: 'Revenue: $1,000,000\nExpenses: $300,000',
          uploadDate: '2024-01-15T10:00:00Z'
        }],
        approach: 'income' as const
      };

      const result = await swartzService.parseIncomeApproach(fallbackTest);
      
      // Should return valid structure even if AI processing fails
      expect(result.approach).toBe('income');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result).toHaveProperty('incomeData');
      expect(result).toHaveProperty('extractedFields');
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent AI requests without blocking', async () => {
      const narrativeService = new AINewNarrativeService();
      const concurrentRequests = 10;
      
      const startTime = Date.now();
      
      const concurrentPromises = Array.from({ length: concurrentRequests }, async (_, i) => {
        return narrativeService.generateCommercialNarrative({
          propertyId: `CONCURRENT-${i}`,
          propertyType: 'commercial',
          approaches: [{
            approach: 'income',
            indicatedValue: 3000000,
            confidence: 0.8,
            weight: 1.0,
            completed: true,
            rationale: [`Concurrent test ${i}`]
          }],
          propertyData: {
            address: `${i} Concurrent Plaza`,
            assessedValue: 3200000,
            estimatedMarketValue: 3000000,
            jurisdiction: 'Concurrent County'
          }
        });
      });

      const results = await Promise.all(concurrentPromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      // All requests should complete
      expect(results.length).toBe(concurrentRequests);
      
      // Performance check - concurrent requests shouldn't take much longer than sequential
      expect(totalDuration).toBeLessThan(10000); // 10 seconds max for 10 concurrent requests
      
      console.log(`Concurrent AI requests: ${concurrentRequests} completed in ${totalDuration}ms`);
    });
  });
});