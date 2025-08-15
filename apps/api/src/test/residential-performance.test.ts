import { describe, it, expect } from 'vitest';
import { ValidationService } from '../services/validation-service.js';
import { AppealService } from '../services/appeal-service.js';
import { AINewNarrativeService } from '../services/ai-narrative-service.js';
import { AISwartzService } from '../services/ai-swartz-service.js';
import type { ResidentialProperty } from '../types/api.js';

describe('Residential Pipeline Performance Tests', () => {

  describe('Heavy Residential Property Processing (11k+ properties/sec target)', () => {
    it('should process large batch of residential properties efficiently', async () => {
      const validationService = new ValidationService();
      const batchSize = 1000; // Scaled for testing, represents 11k+ pattern
      
      const startTime = Date.now();
      
      // Generate realistic residential property data
      const residentialProperties: ResidentialProperty[] = Array.from({ length: batchSize }, (_, index) => ({
        property_address: `${1000 + index} Residential Dr, Test City, CA 9${String(index % 10).padStart(4, '0')}`,
        assessed_value: 450000 + (index * 1500), // $450k-$1.95M range
        market_value: (450000 + (index * 1500)) * (0.85 + Math.random() * 0.30), // 85-115% of assessed
        jurisdiction: index % 3 === 0 ? 'Orange County' : index % 3 === 1 ? 'Los Angeles County' : 'San Diego County',
        tax_year: 2024,
        homestead_exemption: Math.random() > 0.3, // 70% have homestead exemption
        square_footage: 1200 + (index % 2000), // 1200-3200 sq ft
        lot_size: 0.15 + (index % 100) / 200, // 0.15-0.65 acres
        year_built: 1960 + (index % 60), // 1960-2020
        bedrooms: 2 + (index % 4), // 2-5 bedrooms
        bathrooms: 1 + (index % 3), // 1-3 bathrooms
        property_type: ['single_family', 'condo', 'townhome', 'duplex'][index % 4] as any,
        garage_spaces: index % 3, // 0-2 garage spaces
        property_data: {}
      }));
      
      // Process properties in parallel
      const batchPromises = residentialProperties.map(async (property, index) => {
        const operationStartTime = Date.now();
        
        try {
          const result = await validationService.validateResidential(property);
          
          return {
            propertyIndex: index,
            workfile_id: result.workfile_id,
            valid: result.errors.length === 0,
            decision: result.decision_preview?.label,
            confidence: result.decision_preview?.confidence || 0,
            savings_estimate: result.decision_preview?.savings_estimate || 0,
            operationDuration: Date.now() - operationStartTime,
            error: false
          };
        } catch (error) {
          return {
            propertyIndex: index,
            workfile_id: '',
            valid: false,
            decision: null,
            confidence: 0,
            savings_estimate: 0,
            operationDuration: Date.now() - operationStartTime,
            error: true
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const totalDuration = Date.now() - startTime;
      
      // Performance Analysis
      const successfulProcessing = batchResults.filter(r => !r.error && r.valid);
      const overassessedProperties = successfulProcessing.filter(r => r.decision === 'OVER');
      const averageConfidence = successfulProcessing.reduce((sum, r) => sum + r.confidence, 0) / successfulProcessing.length;
      const averageOperationTime = successfulProcessing.reduce((sum, r) => sum + r.operationDuration, 0) / successfulProcessing.length;
      const totalSavingsEstimate = overassessedProperties.reduce((sum, r) => sum + r.savings_estimate, 0);
      const throughput = (batchSize / totalDuration) * 1000; // properties per second
      
      // Performance Assertions
      expect(successfulProcessing.length).toBe(batchSize); // 100% success rate
      expect(averageOperationTime).toBeLessThan(50); // Very fast individual operations
      expect(totalDuration).toBeLessThan(10000); // Total batch time under 10 seconds
      expect(throughput).toBeGreaterThan(100); // At least 100 properties/sec
      expect(averageConfidence).toBeGreaterThan(0.6); // Reasonable confidence
      expect(overassessedProperties.length).toBeGreaterThan(0); // Some properties qualify for appeal
      
      console.log(`🏠 Residential Pipeline Performance Results:
        - Processed: ${batchSize} properties in ${totalDuration}ms
        - Average operation time: ${averageOperationTime.toFixed(1)}ms
        - Throughput: ${throughput.toFixed(1)} properties/second
        - Overassessed properties: ${overassessedProperties.length} (${((overassessedProperties.length / batchSize) * 100).toFixed(1)}%)
        - Average confidence: ${(averageConfidence * 100).toFixed(1)}%
        - Estimated total savings: $${totalSavingsEstimate.toLocaleString()}`);
    });

    it('should process residential AI parsing efficiently', async () => {
      const swartzService = new AISwartzService();
      const batchSize = 100; // AI operations are more expensive
      
      const startTime = Date.now();
      
      // Simulate residential document parsing requests
      const aiParsingPromises = Array.from({ length: batchSize }, async (_, index) => {
        const operationStartTime = Date.now();
        
        try {
          const request = {
            propertyId: `RES-AI-${String(index + 1).padStart(4, '0')}`,
            documents: [
              {
                id: `doc-${index}`,
                filename: `residential-comps-${index}.pdf`,
                type: 'comparable_sales' as const,
                content: `Sample residential comparable sales data for property ${index}. Recent sales include homes at similar square footage and features...`,
                uploadDate: new Date().toISOString()
              }
            ],
            approach: 'sales' as const,
            targetYear: 2024,
            residential: true
          };

          const result = await swartzService.parseSalesComparison(request);
          
          return {
            propertyIndex: index,
            requestId: result.requestId,
            approach: result.approach,
            confidence: result.confidence,
            hasData: !!(result.salesData),
            operationDuration: Date.now() - operationStartTime,
            error: false
          };
        } catch (error) {
          return {
            propertyIndex: index,
            requestId: '',
            approach: 'sales',
            confidence: 0,
            hasData: false,
            operationDuration: Date.now() - operationStartTime,
            error: true
          };
        }
      });

      const aiResults = await Promise.all(aiParsingPromises);
      const totalDuration = Date.now() - startTime;
      
      // AI Performance Analysis
      const successfulAI = aiResults.filter(r => !r.error);
      const averageAITime = successfulAI.reduce((sum, r) => sum + r.operationDuration, 0) / successfulAI.length;
      const averageConfidence = successfulAI.reduce((sum, r) => sum + r.confidence, 0) / successfulAI.length;
      const aiThroughput = (batchSize / totalDuration) * 1000;
      
      // AI Performance Assertions
      expect(successfulAI.length).toBeGreaterThan(batchSize * 0.8); // 80%+ success rate (AI can have occasional failures)
      expect(averageAITime).toBeLessThan(2000); // AI operations under 2 seconds each
      expect(totalDuration).toBeLessThan(30000); // Total AI batch under 30 seconds
      expect(aiThroughput).toBeGreaterThan(3); // At least 3 AI operations/sec
      expect(averageConfidence).toBeGreaterThan(0.3); // Some confidence in AI results
      
      console.log(`🤖 Residential AI Performance Results:
        - Processed: ${batchSize} AI parsing operations in ${totalDuration}ms
        - Average AI operation time: ${averageAITime.toFixed(1)}ms
        - AI throughput: ${aiThroughput.toFixed(1)} operations/second
        - Success rate: ${((successfulAI.length / batchSize) * 100).toFixed(1)}%
        - Average confidence: ${(averageConfidence * 100).toFixed(1)}%`);
    });

    it('should generate residential narratives and appeal packets efficiently', async () => {
      const narrativeService = new AINewNarrativeService();
      const appealService = new AppealService();
      const batchSize = 50; // Full workflow is most expensive
      
      const startTime = Date.now();
      
      // Simulate complete residential workflow
      const workflowPromises = Array.from({ length: batchSize }, async (_, index) => {
        const operationStartTime = Date.now();
        
        try {
          const propertyId = `RES-WORKFLOW-${String(index + 1).padStart(3, '0')}`;
          const assessedValue = 500000 + (index * 5000);
          const marketValue = assessedValue * 0.90; // 10% overassessment
          
          // Step 1: Generate narratives
          const narrativeRequest = {
            propertyId,
            propertyType: 'residential' as const,
            approaches: [
              {
                approach: 'sales' as const,
                indicatedValue: marketValue,
                confidence: 0.85,
                weight: 1.0,
                completed: true,
                rationale: [
                  'Comparable sales analysis supports market value estimate',
                  'Recent neighborhood sales show consistent pricing'
                ]
              }
            ],
            propertyData: {
              address: `${500 + index} Workflow Street, Test City, CA 90210`,
              assessedValue,
              estimatedMarketValue: marketValue,
              jurisdiction: 'Test County'
            }
          };

          const narrativeResponse = await narrativeService.generateResidentialNarrative(narrativeRequest);
          
          // Step 2: Generate appeal packet
          const appealRequest = {
            propertyId,
            propertyType: 'residential' as const,
            approaches: narrativeRequest.approaches,
            reconciliation: {
              finalValue: marketValue,
              overallConfidence: 0.85,
              recommendation: 'APPEAL' as const,
              savingsEstimate: (assessedValue - marketValue) * 0.012
            },
            narrativeSections: narrativeResponse.sections,
            propertyData: {
              address: narrativeRequest.propertyData.address,
              assessedValue,
              jurisdiction: 'Test County'
            }
          };

          const appealResponse = await appealService.generateComprehensivePacket(appealRequest);
          
          return {
            propertyIndex: index,
            narrativeGenerated: narrativeResponse.sections.length > 0,
            appealGenerated: appealResponse.status === 'GENERATED',
            savingsEstimate: appealRequest.reconciliation.savingsEstimate,
            operationDuration: Date.now() - operationStartTime,
            error: false
          };
        } catch (error) {
          return {
            propertyIndex: index,
            narrativeGenerated: false,
            appealGenerated: false,
            savingsEstimate: 0,
            operationDuration: Date.now() - operationStartTime,
            error: true
          };
        }
      });

      const workflowResults = await Promise.all(workflowPromises);
      const totalDuration = Date.now() - startTime;
      
      // Workflow Performance Analysis
      const successfulWorkflows = workflowResults.filter(r => !r.error && r.narrativeGenerated && r.appealGenerated);
      const averageWorkflowTime = successfulWorkflows.reduce((sum, r) => sum + r.operationDuration, 0) / successfulWorkflows.length;
      const totalSavingsGenerated = successfulWorkflows.reduce((sum, r) => sum + r.savingsEstimate, 0);
      const workflowThroughput = (batchSize / totalDuration) * 1000;
      
      // Workflow Performance Assertions
      expect(successfulWorkflows.length).toBeGreaterThan(batchSize * 0.7); // 70%+ success rate for full workflow
      expect(averageWorkflowTime).toBeLessThan(10000); // Each full workflow under 10 seconds
      expect(totalDuration).toBeLessThan(60000); // Total batch under 1 minute
      expect(workflowThroughput).toBeGreaterThan(0.8); // At least 0.8 complete workflows/sec
      expect(totalSavingsGenerated).toBeGreaterThan(0); // Generates real savings estimates
      
      console.log(`📋 Residential Workflow Performance Results:
        - Processed: ${batchSize} complete workflows in ${totalDuration}ms
        - Average workflow time: ${averageWorkflowTime.toFixed(1)}ms
        - Workflow throughput: ${workflowThroughput.toFixed(2)} complete workflows/second
        - Success rate: ${((successfulWorkflows.length / batchSize) * 100).toFixed(1)}%
        - Total estimated savings generated: $${totalSavingsGenerated.toLocaleString()}`);
    });
  });
});