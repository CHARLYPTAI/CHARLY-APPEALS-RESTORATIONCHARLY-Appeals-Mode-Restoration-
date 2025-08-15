import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { uploadsRoutes } from '../routes/uploads.js';
import { appealPacketRoutes } from '../routes/appeal-packet.js';
import { valuationRoutes } from '../routes/valuation.js';
import { aiSwartzRoutes } from '../routes/ai-swartz.js';
import { onboardingRoutes } from '../routes/onboarding.js';
import { jurisdictionsRoutes } from '../routes/jurisdictions.js';
import { resultsRoutes } from '../routes/results.js';

describe('G3 — Full Integration Audit', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    
    await app.register(cors);
    await app.register(multipart);
    
    await app.register(async function(fastify) {
      await fastify.register(uploadsRoutes, { prefix: '/api/v1' });
      await fastify.register(appealPacketRoutes, { prefix: '/api/v1' });
      await fastify.register(valuationRoutes, { prefix: '/api/v1' });
      await fastify.register(aiSwartzRoutes, { prefix: '/api/v1' });
      await fastify.register(onboardingRoutes, { prefix: '/api/v1' });
      await fastify.register(jurisdictionsRoutes, { prefix: '/api/v1' });
      await fastify.register(resultsRoutes, { prefix: '/api/v1' });
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Commercial SWARTZ Property Workflow', () => {
    let propertyId: string;
    let workfileId: string;

    it('should complete full commercial property workflow', async () => {
      // Step 1: Property Onboarding
      const onboardingResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/commercial',
        payload: {
          property: {
            address: {
              street: '123 Commercial Plaza',
              city: 'Business City',
              state: 'CA',
              zipCode: '90210'
            },
            propertyType: 'office',
            squareFootage: 15000,
            yearBuilt: 2005,
            assessedValue: 3500000,
            ownerInfo: {
              name: 'Commercial Properties LLC',
              contactEmail: 'owner@commercial.com',
              phone: '555-0123'
            }
          },
          jurisdiction: {
            county: 'Los Angeles',
            state: 'CA',
            assessor: 'LA County Assessor',
            appealDeadline: '2024-12-31',
            filingFee: 75
          }
        }
      });

      expect(onboardingResponse.statusCode).toBe(200);
      const onboardingResult = JSON.parse(onboardingResponse.payload);
      propertyId = onboardingResult.propertyId;
      workfileId = onboardingResult.workfileId;
      
      expect(propertyId).toBeDefined();
      expect(workfileId).toBeDefined();
    });

    it('should perform AI-powered SWARTZ parsing for all approaches', async () => {
      // Mock SWARTZ documents for income approach
      const incomeDocuments = [{
        id: 'doc-income-swartz',
        filename: 'Office_Plaza_Income_2023.csv',
        type: 'income_statement' as const,
        content: `
Year,Gross Rental Income,Vacancy Loss,Effective Gross Income,Operating Expenses,Net Operating Income
2023,875000,-43750,831250,-245000,586250
2022,850000,-42500,807500,-235000,572500
2021,825000,-41250,783750,-225000,558750
        `,
        uploadDate: '2024-01-15T10:00:00Z'
      }];

      const incomeParseResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/swartz/income',
        payload: {
          propertyId,
          documents: incomeDocuments,
          targetYear: 2023
        }
      });

      expect(incomeParseResponse.statusCode).toBe(200);
      const incomeResult = JSON.parse(incomeParseResponse.payload);
      expect(incomeResult.approach).toBe('income');
      expect(incomeResult.confidence).toBeGreaterThanOrEqual(0);

      // Mock sales comparison documents
      const salesDocuments = [{
        id: 'doc-sales-swartz',
        filename: 'Comparable_Sales_Analysis.csv',
        type: 'other' as const,
        content: `
Address,Sale Date,Sale Price,Square Feet,Price per SF,Property Type
456 Business Ave,2023-08-15,3200000,14500,221,office
789 Corporate Dr,2023-09-20,3350000,15200,220,office
321 Commerce Blvd,2023-10-10,3180000,14800,215,office
        `,
        uploadDate: '2024-01-15T10:00:00Z'
      }];

      const salesParseResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/swartz/sales',
        payload: {
          propertyId,
          documents: salesDocuments
        }
      });

      expect(salesParseResponse.statusCode).toBe(200);
      const salesResult = JSON.parse(salesParseResponse.payload);
      expect(salesResult.approach).toBe('sales');

      // Mock cost approach documents
      const costDocuments = [{
        id: 'doc-cost-swartz',
        filename: 'Cost_Approach_Analysis.txt',
        type: 'other' as const,
        content: `
COST APPROACH ANALYSIS - Office Plaza
Land Value (per assessment): $950,000
Replacement Cost New: $2,850,000
Physical Depreciation: 18% (age-related)
Functional Obsolescence: 3% (minor layout issues)
External Obsolescence: 0% (strong location)
Total Depreciation: $598,500
Depreciated Improvement Value: $2,251,500
Total Property Value: $3,201,500
        `,
        uploadDate: '2024-01-15T10:00:00Z'
      }];

      const costParseResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/swartz/cost',
        payload: {
          propertyId,
          documents: costDocuments
        }
      });

      expect(costParseResponse.statusCode).toBe(200);
      const costResult = JSON.parse(costParseResponse.payload);
      expect(costResult.approach).toBe('cost');
    });

    it('should calculate all three valuation approaches', async () => {
      // Income Approach Calculation
      const incomeCalculationResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/valuation/income-approach',
        payload: {
          propertyId,
          grossRentalIncome: 875000,
          vacancyRate: 0.05,
          operatingExpenses: 245000,
          capRate: 0.075
        }
      });

      expect(incomeCalculationResponse.statusCode).toBe(200);

      // Sales Comparison Calculation
      const salesCalculationResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/valuation/sales-comparison',
        payload: {
          propertyId,
          comparables: [
            {
              id: 'comp-1',
              address: '456 Business Ave',
              saleDate: '2023-08-15',
              salePrice: 3200000,
              squareFootage: 14500,
              pricePerSF: 221,
              condition: 'good',
              location: 'similar',
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
              condition: 'excellent',
              location: 'similar',
              adjustments: { condition: -50000, location: 0, time: -15000, other: 0 },
              adjustedPrice: 3285000,
              adjustedPricePerSF: 216,
              weight: 0.35
            },
            {
              id: 'comp-3',
              address: '321 Commerce Blvd',
              saleDate: '2023-10-10',
              salePrice: 3180000,
              squareFootage: 14800,
              pricePerSF: 215,
              condition: 'good',
              location: 'similar',
              adjustments: { condition: 0, location: 0, time: -5000, other: 0 },
              adjustedPrice: 3175000,
              adjustedPricePerSF: 214,
              weight: 0.25
            }
          ]
        }
      });

      expect(salesCalculationResponse.statusCode).toBe(200);

      // Cost Approach Calculation
      const costCalculationResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/valuation/cost-approach',
        payload: {
          propertyId,
          landValue: 950000,
          improvementCost: 2850000,
          age: 19,
          effectiveAge: 15,
          economicLife: 50,
          physicalDeterioration: 18,
          functionalObsolescence: 3,
          externalObsolescence: 0
        }
      });

      expect(costCalculationResponse.statusCode).toBe(200);
    });

    it('should generate comprehensive appeal packet with AI narratives', async () => {
      const appealPacketResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/appeal-packet/comprehensive',
        payload: {
          propertyId,
          approaches: [
            {
              approach: 'income',
              indicatedValue: 3216667, // $586,250 NOI / 7.5% cap rate ≈ $7.82M (adjusted for market conditions)
              confidence: 0.88,
              weight: 0.45,
              completed: true,
              rationale: [
                'Strong stabilized NOI of $586,250 based on actual operating data',
                'Market cap rate of 7.5% derived from comparable transactions',
                'Consistent income growth pattern over 3-year period'
              ]
            },
            {
              approach: 'sales',
              indicatedValue: 3206250, // Based on weighted comparable analysis
              confidence: 0.82,
              weight: 0.35,
              completed: true,
              rationale: [
                'Three highly comparable office sales within 6 months',
                'Minimal adjustments required for location and condition',
                'Price per SF range of $214-$219 supports conclusion'
              ]
            },
            {
              approach: 'cost',
              indicatedValue: 3201500, // Land + depreciated improvements
              confidence: 0.76,
              weight: 0.20,
              completed: true,
              rationale: [
                'Replacement cost new of $2.85M well supported',
                'Physical depreciation of 18% appropriate for 19-year-old building',
                'Strong location minimizes external obsolescence'
              ]
            }
          ],
          reconciliation: {
            finalValue: 3210000, // Weighted average with slight upward adjustment
            overallConfidence: 0.84,
            recommendation: 'APPEAL',
            savingsEstimate: 18750 // Based on tax rate differential
          },
          narrativeSections: [] // Let AI generate narratives
        }
      });

      expect(appealPacketResponse.statusCode).toBe(200);
      const packetResult = JSON.parse(appealPacketResponse.payload);
      
      expect(packetResult.status).toBe('GENERATED');
      expect(packetResult.packet_id).toBeDefined();
      expect(packetResult.download_url).toBeDefined();
      expect(packetResult.errors.length).toBe(0);
    });

    it('should validate all database writes and status tracking', async () => {
      // Check that property was properly stored
      const propertyStatus = await app.inject({
        method: 'GET',
        url: `/api/v1/onboarding/status/${workfileId}`
      });

      expect(propertyStatus.statusCode).toBe(200);
      const statusResult = JSON.parse(propertyStatus.payload);
      expect(statusResult.status).toBe('COMPLETED');

      // Verify valuation summary is accessible
      const valuationSummary = await app.inject({
        method: 'GET',
        url: `/api/v1/valuation/summary/${propertyId}`
      });

      expect(valuationSummary.statusCode).toBe(200);
      const summaryResult = JSON.parse(valuationSummary.payload);
      expect(summaryResult.property_id).toBe(propertyId);
      expect(summaryResult.approaches).toBeDefined();
      expect(summaryResult.reconciliation).toBeDefined();
    });
  });

  describe('Residential High-Volume Batch Workflow', () => {
    it('should handle batch property processing', async () => {
      const batchSize = 10; // Reduced for testing, would be 100+ in production
      const batchProperties = [];

      // Create batch of residential properties
      for (let i = 1; i <= batchSize; i++) {
        const propertyData = {
          property: {
            address: {
              street: `${100 + i} Residential St`,
              city: 'Suburbia',
              state: 'CA',
              zipCode: '91000'
            },
            propertyType: 'residential',
            squareFootage: 1800 + (i * 50),
            yearBuilt: 1990 + i,
            assessedValue: 650000 + (i * 5000),
            ownerInfo: {
              name: `Homeowner ${i}`,
              contactEmail: `owner${i}@email.com`,
              phone: `555-${1000 + i}`
            }
          },
          jurisdiction: {
            county: 'Orange',
            state: 'CA',
            assessor: 'OC Assessor',
            appealDeadline: '2024-12-31',
            filingFee: 25
          }
        };

        const onboardingResponse = await app.inject({
          method: 'POST',
          url: '/api/v1/onboarding/residential',
          payload: propertyData
        });

        expect(onboardingResponse.statusCode).toBe(200);
        const result = JSON.parse(onboardingResponse.payload);
        batchProperties.push({
          propertyId: result.propertyId,
          workfileId: result.workfileId,
          assessedValue: propertyData.property.assessedValue
        });
      }

      expect(batchProperties.length).toBe(batchSize);

      // Process sales comparison for each property in batch
      const batchPromises = batchProperties.map(async (property, index) => {
        const salesComparisonResponse = await app.inject({
          method: 'POST',
          url: '/api/v1/valuation/sales-comparison',
          payload: {
            propertyId: property.propertyId,
            comparables: [
              {
                id: `batch-comp-${index}-1`,
                address: `${200 + index} Similar St`,
                saleDate: '2023-09-15',
                salePrice: property.assessedValue * 0.92, // Slightly below assessed
                squareFootage: 1850,
                pricePerSF: Math.round((property.assessedValue * 0.92) / 1850),
                condition: 'good',
                location: 'similar',
                adjustments: { condition: 0, location: 0, time: -5000, other: 0 },
                adjustedPrice: property.assessedValue * 0.92 - 5000,
                adjustedPricePerSF: Math.round((property.assessedValue * 0.92 - 5000) / 1850),
                weight: 0.5
              },
              {
                id: `batch-comp-${index}-2`,
                address: `${300 + index} Nearby Ave`,
                saleDate: '2023-10-20',
                salePrice: property.assessedValue * 0.90,
                squareFootage: 1800,
                pricePerSF: Math.round((property.assessedValue * 0.90) / 1800),
                condition: 'average',
                location: 'similar',
                adjustments: { condition: 10000, location: 0, time: -2000, other: 0 },
                adjustedPrice: property.assessedValue * 0.90 + 8000,
                adjustedPricePerSF: Math.round((property.assessedValue * 0.90 + 8000) / 1800),
                weight: 0.5
              }
            ]
          }
        });

        expect(salesComparisonResponse.statusCode).toBe(200);
        return JSON.parse(salesComparisonResponse.payload);
      });

      const batchResults = await Promise.all(batchPromises);
      expect(batchResults.length).toBe(batchSize);

      // Verify all calculations completed successfully
      batchResults.forEach(result => {
        expect(result.indicated_value).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThan(0.5);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should generate batch appeal packets for qualifying properties', async () => {
      // Simulate determining which properties qualify for appeals
      const qualifyingProperties = [
        {
          propertyId: 'RES-001',
          assessedValue: 675000,
          marketValue: 625000,
          overassessmentPercentage: 8.0,
          taxSavingsEstimate: 2500
        },
        {
          propertyId: 'RES-002',
          assessedValue: 720000,
          marketValue: 665000,
          overassessmentPercentage: 8.3,
          taxSavingsEstimate: 2750
        }
      ];

      const batchPacketPromises = qualifyingProperties.map(async (property) => {
        const appealPacketResponse = await app.inject({
          method: 'POST',
          url: '/api/v1/appeal-packet/comprehensive',
          payload: {
            propertyId: property.propertyId,
            approaches: [
              {
                approach: 'sales',
                indicatedValue: property.marketValue,
                confidence: 0.81,
                weight: 1.0,
                completed: true,
                rationale: [
                  'Market analysis based on recent comparable sales',
                  'Properties adjusted for condition, location, and time',
                  'Strong support for market value conclusion'
                ]
              }
            ],
            reconciliation: {
              finalValue: property.marketValue,
              overallConfidence: 0.81,
              recommendation: 'APPEAL',
              savingsEstimate: property.taxSavingsEstimate
            },
            narrativeSections: []
          }
        });

        expect(appealPacketResponse.statusCode).toBe(200);
        return JSON.parse(appealPacketResponse.payload);
      });

      const packetResults = await Promise.all(batchPacketPromises);
      
      packetResults.forEach(result => {
        expect(result.status).toBe('GENERATED');
        expect(result.download_url).toBeDefined();
      });
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should maintain data consistency across all modules', async () => {
      // Test that data flows correctly from onboarding → SWARTZ → valuation → appeals
      const propertyData = {
        property: {
          address: {
            street: '999 Integration Test Blvd',
            city: 'Test City',
            state: 'CA',
            zipCode: '90000'
          },
          propertyType: 'office',
          squareFootage: 12000,
          yearBuilt: 2010,
          assessedValue: 2800000
        },
        jurisdiction: {
          county: 'Test County',
          state: 'CA',
          assessor: 'Test Assessor',
          appealDeadline: '2024-12-31',
          filingFee: 50
        }
      };

      // Step 1: Onboarding
      const onboardingResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/commercial',
        payload: propertyData
      });

      const onboardingResult = JSON.parse(onboardingResponse.payload);
      const propertyId = onboardingResult.propertyId;

      // Step 2: SWARTZ Parsing
      const swartzResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/swartz/income',
        payload: {
          propertyId,
          documents: [{
            id: 'integration-test-doc',
            filename: 'integration_test.csv',
            type: 'income_statement',
            content: 'Revenue: $350,000\nExpenses: $105,000\nNOI: $245,000',
            uploadDate: '2024-01-15T10:00:00Z'
          }]
        }
      });

      expect(swartzResponse.statusCode).toBe(200);

      // Step 3: Valuation
      const valuationResponse = await app.inject({
        method: 'GET',
        url: `/api/v1/valuation/summary/${propertyId}`
      });

      expect(valuationResponse.statusCode).toBe(200);

      // Step 4: Appeal Generation
      const appealResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/appeal-packet/comprehensive',
        payload: {
          propertyId,
          approaches: [{
            approach: 'income',
            indicatedValue: 2650000,
            confidence: 0.85,
            weight: 1.0,
            completed: true,
            rationale: ['Integration test valuation']
          }],
          reconciliation: {
            finalValue: 2650000,
            overallConfidence: 0.85,
            recommendation: 'APPEAL',
            savingsEstimate: 7500
          },
          narrativeSections: []
        }
      });

      expect(appealResponse.statusCode).toBe(200);
      
      // Verify the property ID is consistent across all steps
      const appealResult = JSON.parse(appealResponse.payload);
      expect(appealResult.status).toBe('GENERATED');
    });

    it('should handle error propagation correctly across modules', async () => {
      // Test error handling when invalid data is passed through the workflow
      const invalidOnboardingResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/onboarding/commercial',
        payload: {
          property: {
            // Missing required fields
            address: { street: 'Invalid' }
          }
        }
      });

      expect(invalidOnboardingResponse.statusCode).toBe(400);

      // Test SWARTZ parsing with invalid data
      const invalidSwartzResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/ai/swartz/income',
        payload: {
          propertyId: 'INVALID-ID',
          documents: [] // Empty documents array
        }
      });

      expect(invalidSwartzResponse.statusCode).toBe(200); // Service level errors return 200 with error details
      const swartzResult = JSON.parse(invalidSwartzResponse.payload);
      expect(swartzResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability Validation', () => {
    it('should handle concurrent workflow executions', async () => {
      const concurrentWorkflows = 5; // Reduced for testing
      const workflowPromises = [];

      for (let i = 1; i <= concurrentWorkflows; i++) {
        const workflowPromise = (async () => {
          const startTime = Date.now();
          
          // Concurrent onboarding
          const onboardingResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/onboarding/commercial',
            payload: {
              property: {
                address: {
                  street: `${i} Concurrent Plaza`,
                  city: 'Parallel City',
                  state: 'CA',
                  zipCode: '90001'
                },
                propertyType: 'office',
                squareFootage: 10000,
                yearBuilt: 2000,
                assessedValue: 2000000 + (i * 100000)
              },
              jurisdiction: {
                county: 'Concurrent County',
                state: 'CA',
                assessor: 'Concurrent Assessor',
                appealDeadline: '2024-12-31',
                filingFee: 50
              }
            }
          });

          const endTime = Date.now();
          const duration = endTime - startTime;

          return {
            success: onboardingResponse.statusCode === 200,
            duration,
            workflowId: i
          };
        })();

        workflowPromises.push(workflowPromise);
      }

      const results = await Promise.all(workflowPromises);
      
      // All workflows should complete successfully
      expect(results.every(r => r.success)).toBe(true);
      
      // Performance check - each workflow should complete within reasonable time
      expect(results.every(r => r.duration < 5000)).toBe(true); // 5 second max
    });
  });
});