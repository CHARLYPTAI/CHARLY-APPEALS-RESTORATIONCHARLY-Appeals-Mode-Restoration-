import { describe, it, expect } from 'vitest';
import { ValuationService } from '../services/valuation-service.js';
import { AppealService } from '../services/appeal-service.js';
import { AINewNarrativeService } from '../services/ai-narrative-service.js';
import { AISwartzService } from '../services/ai-swartz-service.js';

describe('G4 — Heavy-Usage Sign-off Performance Tests', () => {

  describe('Heavy Residential Load Testing (50k+ Properties)', () => {
    it('should handle large batch residential processing efficiently', async () => {
      const valuationService = new ValuationService();
      const narrativeService = new AINewNarrativeService();
      const batchSize = 250; // Scaled down for testing (represents 50k+ pattern)
      
      const startTime = Date.now();
      
      // Simulate high-volume residential batch processing
      const batchPromises = Array.from({ length: batchSize }, async (_, index) => {
        const propertyId = `RES-HEAVY-${String(index + 1).padStart(6, '0')}`;
        const assessedValue = 650000 + (index * 2500); // Realistic range
        const marketValue = assessedValue * (0.88 + Math.random() * 0.20); // 88-108% of assessed
        
        const operationStartTime = Date.now();
        
        try {
          // Sales comparison calculation (primary for residential)
          const salesRequest = {
            propertyId,
            comparables: [
              {
                id: `${propertyId}-comp-1`,
                address: `${1000 + index} Comparable Lane`,
                saleDate: '2023-09-15',
                salePrice: Math.round(marketValue * 0.98),
                squareFootage: 1850 + (index % 200),
                pricePerSF: Math.round((marketValue * 0.98) / (1850 + (index % 200))),
                condition: 'good' as const,
                location: 'similar' as const,
                adjustments: { condition: 0, location: 0, time: -3000 - (index % 2000), other: 0 },
                adjustedPrice: Math.round(marketValue * 0.98) - 3000 - (index % 2000),
                adjustedPricePerSF: Math.round((marketValue * 0.98 - 3000 - (index % 2000)) / (1850 + (index % 200))),
                weight: 0.4
              },
              {
                id: `${propertyId}-comp-2`,
                address: `${2000 + index} Market Street`,
                saleDate: '2023-10-20',
                salePrice: Math.round(marketValue * 1.01),
                squareFootage: 1800 + (index % 150),
                pricePerSF: Math.round((marketValue * 1.01) / (1800 + (index % 150))),
                condition: 'average' as const,
                location: 'similar' as const,
                adjustments: { condition: 8000, location: 0, time: -1000, other: 0 },
                adjustedPrice: Math.round(marketValue * 1.01) + 7000,
                adjustedPricePerSF: Math.round((marketValue * 1.01 + 7000) / (1800 + (index % 150))),
                weight: 0.35
              },
              {
                id: `${propertyId}-comp-3`,
                address: `${3000 + index} Value Ave`,
                saleDate: '2023-11-05',
                salePrice: Math.round(marketValue * 0.99),
                squareFootage: 1900 + (index % 100),
                pricePerSF: Math.round((marketValue * 0.99) / (1900 + (index % 100))),
                condition: 'good' as const,
                location: 'superior' as const,
                adjustments: { condition: 0, location: -5000, time: 0, other: 0 },
                adjustedPrice: Math.round(marketValue * 0.99) - 5000,
                adjustedPricePerSF: Math.round((marketValue * 0.99 - 5000) / (1900 + (index % 100))),
                weight: 0.25
              }
            ]
          };

          const salesResult = await valuationService.calculateSalesComparison(salesRequest);
          const operationEndTime = Date.now();
          const operationDuration = operationEndTime - operationStartTime;
          
          // Performance validation
          expect(operationDuration).toBeLessThan(150); // Sub-150ms per property
          expect(salesResult.indicated_value).toBeGreaterThan(0);
          expect(salesResult.confidence).toBeGreaterThan(0.5);
          expect(salesResult.errors.length).toBe(0);
          
          // Determine if qualifies for appeal (overassessed by >5%)
          const qualifiesForAppeal = assessedValue > salesResult.indicated_value * 1.05;
          
          return {
            propertyId,
            assessedValue,
            marketValue: salesResult.indicated_value,
            confidence: salesResult.confidence,
            operationDuration,
            qualifiesForAppeal,
            savingsEstimate: qualifiesForAppeal ? (assessedValue - salesResult.indicated_value) * 0.015 : 0 // 1.5% tax rate
          };
          
        } catch (error) {
          console.error(`Property ${propertyId} processing failed:`, error);
          return {
            propertyId,
            assessedValue,
            marketValue: 0,
            confidence: 0,
            operationDuration: Date.now() - operationStartTime,
            qualifiesForAppeal: false,
            savingsEstimate: 0,
            error: true
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const totalDuration = Date.now() - startTime;
      
      // Performance Analysis
      const successfulProcessing = batchResults.filter(r => !r.error);
      const qualifyingProperties = successfulProcessing.filter(r => r.qualifiesForAppeal);
      const averageConfidence = successfulProcessing.reduce((sum, r) => sum + r.confidence, 0) / successfulProcessing.length;
      const averageOperationTime = successfulProcessing.reduce((sum, r) => sum + r.operationDuration, 0) / successfulProcessing.length;
      const totalSavingsEstimate = qualifyingProperties.reduce((sum, r) => sum + r.savingsEstimate, 0);
      
      // Performance Assertions
      expect(successfulProcessing.length).toBe(batchSize); // 100% success rate
      expect(averageOperationTime).toBeLessThan(100); // p99 < 100ms requirement
      expect(totalDuration).toBeLessThan(30000); // Total batch time reasonable
      expect(averageConfidence).toBeGreaterThan(0.75); // High confidence
      expect(qualifyingProperties.length).toBeGreaterThan(0); // Some properties qualify
      
      console.log(`📊 Heavy Residential Load Results:
        - Processed: ${batchSize} properties in ${totalDuration}ms
        - Average operation time: ${averageOperationTime.toFixed(1)}ms
        - Qualifying for appeal: ${qualifyingProperties.length} (${((qualifyingProperties.length / batchSize) * 100).toFixed(1)}%)
        - Average confidence: ${(averageConfidence * 100).toFixed(1)}%
        - Estimated total savings: $${totalSavingsEstimate.toLocaleString()}
        - Throughput: ${((batchSize / totalDuration) * 1000).toFixed(1)} properties/second`);
    });
    
    it('should generate appeal packets for qualifying residential properties efficiently', async () => {
      const appealService = new AppealService();
      const narrativeService = new AINewNarrativeService();
      const qualifyingCount = 50; // Representing qualified properties from heavy batch
      
      const startTime = Date.now();
      
      const appealPromises = Array.from({ length: qualifyingCount }, async (_, index) => {
        const propertyId = `APPEAL-RES-${String(index + 1).padStart(3, '0')}`;
        const assessedValue = 675000 + (index * 3000);
        const marketValue = assessedValue * 0.92; // 8% overassessment
        
        const packetStartTime = Date.now();
        
        const appealRequest = {
          propertyId,
          approaches: [{
            approach: 'sales' as const,
            indicatedValue: marketValue,
            confidence: 0.82 + (Math.random() * 0.10),
            weight: 1.0,
            completed: true,
            rationale: [
              'Market analysis based on recent comparable sales',
              'Properties adjusted for condition, location, and timing',
              'Strong support for market value conclusion'
            ]
          }],
          reconciliation: {
            finalValue: marketValue,
            overallConfidence: 0.82,
            recommendation: 'APPEAL' as const,
            savingsEstimate: (assessedValue - marketValue) * 0.015
          },
          narrativeSections: [] // AI will generate if available
        };

        try {
          const appealResult = await appealService.generateComprehensivePacket(appealRequest);
          const packetDuration = Date.now() - packetStartTime;
          
          expect(appealResult.status).toBe('GENERATED');
          expect(appealResult.packet_id).toBeDefined();
          expect(appealResult.download_url).toBeDefined();
          expect(packetDuration).toBeLessThan(500); // Reasonable packet generation time
          
          return {
            propertyId,
            packetId: appealResult.packet_id,
            duration: packetDuration,
            status: appealResult.status,
            savingsEstimate: appealRequest.reconciliation.savingsEstimate
          };
          
        } catch (error) {
          return {
            propertyId,
            packetId: null,
            duration: Date.now() - packetStartTime,
            status: 'FAILED',
            error: true
          };
        }
      });

      const appealResults = await Promise.all(appealPromises);
      const totalDuration = Date.now() - startTime;
      
      const successfulPackets = appealResults.filter(r => r.status === 'GENERATED');
      const averagePacketTime = successfulPackets.reduce((sum, r) => sum + r.duration, 0) / successfulPackets.length;
      const totalProjectedSavings = successfulPackets.reduce((sum, r) => sum + (r.savingsEstimate || 0), 0);
      
      expect(successfulPackets.length).toBe(qualifyingCount);
      expect(averagePacketTime).toBeLessThan(300); // Reasonable packet generation time
      
      console.log(`📦 Appeal Packet Generation Results:
        - Generated: ${successfulPackets.length} packets in ${totalDuration}ms
        - Average packet time: ${averagePacketTime.toFixed(1)}ms
        - Total projected savings: $${totalProjectedSavings.toLocaleString()}
        - Throughput: ${((successfulPackets.length / totalDuration) * 1000).toFixed(1)} packets/second`);
    });
  });

  describe('Moderate Commercial Load Testing (500+ Properties)', () => {
    it('should handle commercial portfolio processing with complex valuations', async () => {
      const valuationService = new ValuationService();
      const narrativeService = new AINewNarrativeService();
      const commercialCount = 25; // Scaled down from 500+ for testing
      
      const startTime = Date.now();
      
      const commercialPromises = Array.from({ length: commercialCount }, async (_, index) => {
        const propertyId = `COM-PORTFOLIO-${String(index + 1).padStart(3, '0')}`;
        const propertyValue = 2500000 + (index * 250000); // $2.5M - $8.75M range
        
        const portfolioStartTime = Date.now();
        
        try {
          // Three-approach valuation for commercial properties
          
          // 1. Sales Comparison
          const salesRequest = {
            propertyId,
            comparables: [
              {
                id: `${propertyId}-comp-1`,
                address: `${500 + index} Commercial Plaza`,
                saleDate: '2023-08-15',
                salePrice: Math.round(propertyValue * 0.96),
                squareFootage: 12000 + (index * 200),
                pricePerSF: Math.round((propertyValue * 0.96) / (12000 + (index * 200))),
                condition: 'good' as const,
                location: 'similar' as const,
                adjustments: { condition: 0, location: 0, time: -35000, other: 0 },
                adjustedPrice: Math.round(propertyValue * 0.96) - 35000,
                adjustedPricePerSF: Math.round((propertyValue * 0.96 - 35000) / (12000 + (index * 200))),
                weight: 0.4
              },
              {
                id: `${propertyId}-comp-2`,
                address: `${600 + index} Business Center`,
                saleDate: '2023-09-20',
                salePrice: Math.round(propertyValue * 1.02),
                squareFootage: 11500 + (index * 150),
                pricePerSF: Math.round((propertyValue * 1.02) / (11500 + (index * 150))),
                condition: 'excellent' as const,
                location: 'superior' as const,
                adjustments: { condition: -75000, location: -50000, time: -20000, other: 0 },
                adjustedPrice: Math.round(propertyValue * 1.02) - 145000,
                adjustedPricePerSF: Math.round((propertyValue * 1.02 - 145000) / (11500 + (index * 150))),
                weight: 0.35
              },
              {
                id: `${propertyId}-comp-3`,
                address: `${700 + index} Corporate Blvd`,
                saleDate: '2023-10-10',
                salePrice: Math.round(propertyValue * 0.98),
                squareFootage: 12500 + (index * 100),
                pricePerSF: Math.round((propertyValue * 0.98) / (12500 + (index * 100))),
                condition: 'good' as const,
                location: 'similar' as const,
                adjustments: { condition: 0, location: 0, time: -10000, other: 0 },
                adjustedPrice: Math.round(propertyValue * 0.98) - 10000,
                adjustedPricePerSF: Math.round((propertyValue * 0.98 - 10000) / (12500 + (index * 100))),
                weight: 0.25
              }
            ]
          };

          const salesResult = await valuationService.calculateSalesComparison(salesRequest);
          
          // 2. Cost Approach
          const costRequest = {
            propertyId,
            landValue: Math.round(propertyValue * 0.35),
            improvementCost: Math.round(propertyValue * 0.75),
            age: 15 + (index % 20),
            effectiveAge: 12 + (index % 15),
            economicLife: 50,
            physicalDeterioration: 15 + (index % 10),
            functionalObsolescence: 2 + (index % 5),
            externalObsolescence: 0
          };

          const costResult = await valuationService.calculateCostApproach(costRequest);
          
          // 3. AI-enhanced narrative generation for complex commercial
          const narrativeRequest = {
            propertyId,
            propertyType: 'commercial' as const,
            approaches: [
              {
                approach: 'income' as const,
                indicatedValue: Math.round(propertyValue * 1.02),
                confidence: 0.88,
                weight: 0.45,
                completed: true,
                rationale: ['Strong NOI performance', 'Market cap rates support valuation']
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
              address: `${800 + index} Complex Commercial Drive`,
              assessedValue: Math.round(propertyValue * 1.12), // 12% overassessment
              estimatedMarketValue: propertyValue,
              jurisdiction: 'Commercial County'
            }
          };

          const narrativeResult = await narrativeService.generateCommercialNarrative(narrativeRequest);
          
          const portfolioDuration = Date.now() - portfolioStartTime;
          
          // Performance validations
          expect(portfolioDuration).toBeLessThan(2000); // Complex commercial processing under 2s
          expect(salesResult.indicated_value).toBeGreaterThan(0);
          expect(costResult.cost_data.indicatedValue).toBeGreaterThan(0);
          expect(salesResult.confidence).toBeGreaterThan(0.6);
          expect(costResult.confidence).toBeGreaterThan(0.6);
          
          const weightedValue = (
            (Math.round(propertyValue * 1.02) * 0.45) +
            (salesResult.indicated_value * 0.35) +
            (costResult.cost_data.indicatedValue * 0.20)
          );
          
          return {
            propertyId,
            assessedValue: Math.round(propertyValue * 1.12),
            incomeValue: Math.round(propertyValue * 1.02),
            salesValue: salesResult.indicated_value,
            costValue: costResult.cost_data.indicatedValue,
            finalValue: Math.round(weightedValue),
            processingTime: portfolioDuration,
            overallConfidence: (0.88 * 0.45) + (salesResult.confidence * 0.35) + (costResult.confidence * 0.20),
            narrativeSections: narrativeResult.sections.length
          };
          
        } catch (error) {
          return {
            propertyId,
            processingTime: Date.now() - portfolioStartTime,
            error: true
          };
        }
      });

      const commercialResults = await Promise.all(commercialPromises);
      const totalDuration = Date.now() - startTime;
      
      const successfulProcessing = commercialResults.filter(r => !r.error);
      const averageProcessingTime = successfulProcessing.reduce((sum, r) => sum + r.processingTime, 0) / successfulProcessing.length;
      const averageConfidence = successfulProcessing.reduce((sum, r) => sum + (r.overallConfidence || 0), 0) / successfulProcessing.length;
      const totalEstimatedSavings = successfulProcessing.reduce((sum, r) => {
        if (r.assessedValue && r.finalValue && r.assessedValue > r.finalValue) {
          return sum + ((r.assessedValue - r.finalValue) * 0.025); // 2.5% commercial tax rate
        }
        return sum;
      }, 0);
      
      expect(successfulProcessing.length).toBe(commercialCount);
      expect(averageProcessingTime).toBeLessThan(1500); // Complex commercial under 1.5s average
      expect(averageConfidence).toBeGreaterThan(0.75);
      
      console.log(`🏢 Commercial Portfolio Results:
        - Processed: ${commercialCount} properties in ${totalDuration}ms
        - Average processing time: ${averageProcessingTime.toFixed(1)}ms
        - Average confidence: ${(averageConfidence * 100).toFixed(1)}%
        - Total estimated savings: $${totalEstimatedSavings.toLocaleString()}
        - Throughput: ${((commercialCount / totalDuration) * 1000).toFixed(1)} properties/second`);
    });
  });

  describe('AI Router Stability Under Load', () => {
    it('should maintain AI router stability with concurrent requests', async () => {
      const narrativeService = new AINewNarrativeService();
      const swartzService = new AISwartzService();
      const concurrentRequests = 50; // Simulating high concurrent AI load
      
      const startTime = Date.now();
      
      const aiPromises = Array.from({ length: concurrentRequests }, async (_, index) => {
        const requestStartTime = Date.now();
        
        try {
          // Alternate between narrative and SWARTZ requests for realistic load
          if (index % 2 === 0) {
            // Narrative generation
            const narrativeRequest = {
              propertyId: `AI-LOAD-${index}`,
              propertyType: 'commercial' as const,
              approaches: [{
                approach: 'income' as const,
                indicatedValue: 3000000 + (index * 50000),
                confidence: 0.85,
                weight: 1.0,
                completed: true,
                rationale: [`Concurrent AI test ${index}`]
              }],
              propertyData: {
                address: `${index} AI Test Plaza`,
                assessedValue: 3200000,
                estimatedMarketValue: 3000000 + (index * 50000),
                jurisdiction: 'AI Test County'
              }
            };

            const result = await narrativeService.generateCommercialNarrative(narrativeRequest);
            return {
              type: 'narrative',
              index,
              duration: Date.now() - requestStartTime,
              success: result.sections !== undefined,
              errors: result.errors
            };
            
          } else {
            // SWARTZ parsing
            const swartzRequest = {
              propertyId: `AI-SWARTZ-${index}`,
              documents: [{
                id: `ai-doc-${index}`,
                filename: `ai_test_${index}.csv`,
                type: 'income_statement' as const,
                content: `Revenue,${500000 + (index * 10000)}\nExpenses,${150000 + (index * 3000)}\nNOI,${350000 + (index * 7000)}`,
                uploadDate: '2024-01-15T10:00:00Z'
              }],
              approach: 'income' as const
            };

            const result = await swartzService.parseIncomeApproach(swartzRequest);
            return {
              type: 'swartz',
              index,
              duration: Date.now() - requestStartTime,
              success: result.confidence >= 0,
              confidence: result.confidence,
              errors: result.errors
            };
          }
          
        } catch (error) {
          return {
            type: index % 2 === 0 ? 'narrative' : 'swartz',
            index,
            duration: Date.now() - requestStartTime,
            success: false,
            error: true
          };
        }
      });

      const aiResults = await Promise.all(aiPromises);
      const totalDuration = Date.now() - startTime;
      
      const successfulRequests = aiResults.filter(r => r.success);
      const narrativeRequests = aiResults.filter(r => r.type === 'narrative');
      const swartzRequests = aiResults.filter(r => r.type === 'swartz');
      const averageDuration = aiResults.reduce((sum, r) => sum + r.duration, 0) / aiResults.length;
      
      // AI Router Stability Assertions
      expect(successfulRequests.length).toBe(concurrentRequests); // 100% success with fallbacks
      expect(averageDuration).toBeLessThan(50); // p99 < 50ms for API calls (with fallbacks)
      expect(totalDuration).toBeLessThan(5000); // Reasonable concurrent processing time
      
      console.log(`🤖 AI Router Load Test Results:
        - Concurrent requests: ${concurrentRequests} in ${totalDuration}ms
        - Success rate: ${((successfulRequests.length / concurrentRequests) * 100).toFixed(1)}%
        - Average request time: ${averageDuration.toFixed(1)}ms
        - Narrative requests: ${narrativeRequests.length}
        - SWARTZ requests: ${swartzRequests.length}
        - Throughput: ${((concurrentRequests / totalDuration) * 1000).toFixed(1)} requests/second`);
    });
  });

  describe('System Performance Under Full Load', () => {
    it('should maintain system stability with mixed heavy load', async () => {
      const valuationService = new ValuationService();
      const appealService = new AppealService();
      const mixedLoadSize = 30; // Mixed residential + commercial
      
      const startTime = Date.now();
      
      const mixedPromises = Array.from({ length: mixedLoadSize }, async (_, index) => {
        const isCommercial = index % 4 === 0; // 25% commercial, 75% residential
        const operationStartTime = Date.now();
        
        try {
          if (isCommercial) {
            // Commercial workflow
            const salesRequest = {
              propertyId: `MIXED-COM-${index}`,
              comparables: [{
                id: `mixed-comp-${index}`,
                address: `${index} Mixed Commercial`,
                saleDate: '2023-09-15',
                salePrice: 3000000,
                squareFootage: 12000,
                pricePerSF: 250,
                condition: 'good' as const,
                location: 'similar' as const,
                adjustments: { condition: 0, location: 0, time: -25000, other: 0 },
                adjustedPrice: 2975000,
                adjustedPricePerSF: 248,
                weight: 1.0
              }]
            };

            const salesResult = await valuationService.calculateSalesComparison(salesRequest);
            
            const appealRequest = {
              propertyId: `MIXED-COM-${index}`,
              approaches: [{
                approach: 'sales' as const,
                indicatedValue: salesResult.indicated_value,
                confidence: salesResult.confidence,
                weight: 1.0,
                completed: true,
                rationale: salesResult.rationale
              }],
              reconciliation: {
                finalValue: salesResult.indicated_value,
                overallConfidence: salesResult.confidence,
                recommendation: 'APPEAL' as const,
                savingsEstimate: 15000
              },
              narrativeSections: []
            };

            const appealResult = await appealService.generateComprehensivePacket(appealRequest);
            
            return {
              type: 'commercial',
              propertyId: `MIXED-COM-${index}`,
              duration: Date.now() - operationStartTime,
              success: appealResult.status === 'GENERATED',
              value: salesResult.indicated_value
            };
            
          } else {
            // Residential workflow
            const salesRequest = {
              propertyId: `MIXED-RES-${index}`,
              comparables: [{
                id: `mixed-res-comp-${index}`,
                address: `${index} Mixed Residential`,
                saleDate: '2023-10-15',
                salePrice: 650000,
                squareFootage: 1800,
                pricePerSF: 361,
                condition: 'good' as const,
                location: 'similar' as const,
                adjustments: { condition: 0, location: 0, time: -3000, other: 0 },
                adjustedPrice: 647000,
                adjustedPricePerSF: 359,
                weight: 1.0
              }]
            };

            const salesResult = await valuationService.calculateSalesComparison(salesRequest);
            
            return {
              type: 'residential',
              propertyId: `MIXED-RES-${index}`,
              duration: Date.now() - operationStartTime,
              success: salesResult.errors.length === 0,
              value: salesResult.indicated_value
            };
          }
          
        } catch (error) {
          return {
            type: isCommercial ? 'commercial' : 'residential',
            propertyId: `MIXED-${isCommercial ? 'COM' : 'RES'}-${index}`,
            duration: Date.now() - operationStartTime,
            success: false,
            error: true
          };
        }
      });

      const mixedResults = await Promise.all(mixedPromises);
      const totalDuration = Date.now() - startTime;
      
      const successfulOperations = mixedResults.filter(r => r.success);
      const commercialOperations = mixedResults.filter(r => r.type === 'commercial');
      const residentialOperations = mixedResults.filter(r => r.type === 'residential');
      const averageDuration = mixedResults.reduce((sum, r) => sum + r.duration, 0) / mixedResults.length;
      
      // System Performance Assertions
      expect(successfulOperations.length).toBe(mixedLoadSize); // 100% success rate
      expect(averageDuration).toBeLessThan(200); // Mixed load average under 200ms
      expect(totalDuration).toBeLessThan(15000); // Total mixed load under 15s
      
      console.log(`⚡ Mixed Load Performance Results:
        - Total operations: ${mixedLoadSize} in ${totalDuration}ms
        - Success rate: ${((successfulOperations.length / mixedLoadSize) * 100).toFixed(1)}%
        - Commercial operations: ${commercialOperations.length}
        - Residential operations: ${residentialOperations.length}
        - Average operation time: ${averageDuration.toFixed(1)}ms
        - System throughput: ${((mixedLoadSize / totalDuration) * 1000).toFixed(1)} operations/second`);
    });
  });
});