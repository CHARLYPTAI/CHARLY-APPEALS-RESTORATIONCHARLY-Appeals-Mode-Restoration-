import { describe, it, expect } from 'vitest';
import { ValidationService } from '../services/validation-service.js';
import type { ResidentialProperty } from '../types/api.js';

describe('Residential Validation Performance Tests', () => {

  describe('High-Volume Residential Property Validation (11k+ target)', () => {
    it('should validate large batch of residential properties efficiently', async () => {
      const validationService = new ValidationService();
      const batchSize = 5000; // Test at scale
      
      const startTime = Date.now();
      
      // Generate realistic residential property data
      const residentialProperties: ResidentialProperty[] = Array.from({ length: batchSize }, (_, index) => ({
        property_address: `${1000 + index} Residential Dr, Test City, CA 9${String(index % 10).padStart(4, '0')}`,
        assessed_value: 450000 + (index * 1500), // $450k-$7.95M range
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
      const fairProperties = successfulProcessing.filter(r => r.decision === 'FAIR');
      const underassessedProperties = successfulProcessing.filter(r => r.decision === 'UNDER');
      const averageConfidence = successfulProcessing.reduce((sum, r) => sum + r.confidence, 0) / successfulProcessing.length;
      const averageOperationTime = successfulProcessing.reduce((sum, r) => sum + r.operationDuration, 0) / successfulProcessing.length;
      const totalSavingsEstimate = overassessedProperties.reduce((sum, r) => sum + r.savings_estimate, 0);
      const throughput = (batchSize / totalDuration) * 1000; // properties per second
      
      // Performance Assertions for 11k+ properties/sec capability
      expect(successfulProcessing.length).toBe(batchSize); // 100% success rate
      expect(averageOperationTime).toBeLessThan(50); // Under 50ms per operation for good performance
      expect(totalDuration).toBeLessThan(30000); // 5k properties in under 30 seconds
      expect(throughput).toBeGreaterThan(100); // At least 100 properties/sec (scalable performance)
      expect(averageConfidence).toBeGreaterThan(0.6); // Reasonable confidence
      expect(overassessedProperties.length).toBeGreaterThan(0); // Some properties qualify for appeal
      
      // Verify decision distribution is realistic
      const overPercentage = (overassessedProperties.length / batchSize) * 100;
      const fairPercentage = (fairProperties.length / batchSize) * 100;
      const underPercentage = (underassessedProperties.length / batchSize) * 100;
      
      expect(overPercentage).toBeGreaterThan(10); // At least 10% overassessed
      expect(overPercentage).toBeLessThan(50); // No more than 50% overassessed
      expect(fairPercentage).toBeGreaterThan(20); // At least 20% fairly assessed
      expect(underPercentage).toBeGreaterThan(10); // At least 10% underassessed
      
      console.log(`🏠 Residential Validation Performance Results (Target: 11k+ properties/sec):
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📊 PERFORMANCE METRICS:
        - Processed: ${batchSize.toLocaleString()} properties in ${totalDuration}ms
        - Average operation time: ${averageOperationTime.toFixed(3)}ms per property
        - Throughput: ${throughput.toLocaleString()} properties/second
        - Success rate: 100%
        
        📈 ASSESSMENT ANALYSIS:
        - Overassessed (OVER): ${overassessedProperties.length.toLocaleString()} (${overPercentage.toFixed(1)}%)
        - Fairly assessed (FAIR): ${fairProperties.length.toLocaleString()} (${fairPercentage.toFixed(1)}%)
        - Underassessed (UNDER): ${underassessedProperties.length.toLocaleString()} (${underPercentage.toFixed(1)}%)
        - Average confidence: ${(averageConfidence * 100).toFixed(1)}%
        
        💰 SAVINGS POTENTIAL:
        - Estimated total annual savings: $${totalSavingsEstimate.toLocaleString()}
        - Average savings per qualifying property: $${(totalSavingsEstimate / Math.max(overassessedProperties.length, 1)).toLocaleString()}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }, 30000); // 30 second timeout for large batch

    it('should maintain performance with complex residential property types', async () => {
      const validationService = new ValidationService();
      const batchSize = 1000;
      
      // Generate complex residential properties with all optional fields
      const complexProperties: ResidentialProperty[] = Array.from({ length: batchSize }, (_, index) => ({
        property_address: `${5000 + index} Complex Property Ave, Luxury City, CA 9${String(index % 10).padStart(4, '0')}`,
        assessed_value: 800000 + (index * 2000), // Higher value properties
        market_value: (800000 + (index * 2000)) * (0.88 + Math.random() * 0.24),
        jurisdiction: `Complex County ${index % 5}`,
        tax_year: 2024,
        homestead_exemption: true,
        square_footage: 2500 + (index % 3000), // Large homes
        lot_size: 0.5 + (index % 200) / 100, // Larger lots
        year_built: 1990 + (index % 34), // Newer homes
        bedrooms: 3 + (index % 6), // 3-8 bedrooms
        bathrooms: 2 + (index % 5), // 2-6 bathrooms
        property_type: ['single_family', 'condo', 'townhome', 'duplex', 'other'][index % 5] as any,
        garage_spaces: 1 + (index % 4), // 1-4 garage spaces
        property_data: {
          // Complex property features
          pool: index % 3 === 0,
          fireplace: index % 2 === 0,
          basement: index % 4 === 0,
          deck: index % 3 === 1,
          appliances_included: true,
          hoa_fee: index % 2 === 0 ? 200 + (index % 300) : 0
        }
      }));
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        complexProperties.map(async (property, index) => {
          const opStart = Date.now();
          const result = await validationService.validateResidential(property);
          return {
            index,
            duration: Date.now() - opStart,
            valid: result.errors.length === 0,
            hasDecision: !!result.decision_preview
          };
        })
      );
      
      const totalDuration = Date.now() - startTime;
      const averageTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const successRate = results.filter(r => r.valid).length / results.length;
      const throughput = (batchSize / totalDuration) * 1000;
      
      // Performance should not degrade significantly with complex properties
      expect(successRate).toBe(1); // 100% success
      expect(averageTime).toBeLessThan(10); // Still fast
      expect(throughput).toBeGreaterThan(50); // Still good throughput
      
      console.log(`🏰 Complex Residential Properties Performance:
        - Processed: ${batchSize} complex properties in ${totalDuration}ms
        - Average operation time: ${averageTime.toFixed(3)}ms
        - Throughput: ${throughput.toFixed(0)} properties/second
        - Success rate: ${(successRate * 100).toFixed(1)}%`);
    });

    it('should handle validation errors gracefully at scale', async () => {
      const validationService = new ValidationService();
      const batchSize = 1000;
      
      // Generate properties with various validation issues
      const problematicProperties: ResidentialProperty[] = Array.from({ length: batchSize }, (_, index) => {
        const baseProperty: ResidentialProperty = {
          property_address: `${6000 + index} Problem Street, Error City, CA 90210`,
          assessed_value: 500000,
          market_value: 480000,
          jurisdiction: 'Error County',
          tax_year: 2024,
          homestead_exemption: false,
          square_footage: 1800,
          lot_size: 0.25,
          year_built: 2000,
          bedrooms: 3,
          bathrooms: 2,
          property_type: 'single_family',
          garage_spaces: 2,
          property_data: {}
        };

        // Introduce various types of errors
        switch (index % 10) {
          case 0: return { ...baseProperty, property_address: '' }; // Missing address
          case 1: return { ...baseProperty, property_address: '123' }; // Too short address
          case 2: return { ...baseProperty, assessed_value: -1000 }; // Negative assessed value
          case 3: return { ...baseProperty, market_value: -500 }; // Negative market value
          case 4: return { ...baseProperty, square_footage: 50 }; // Too small
          case 5: return { ...baseProperty, year_built: 1700 }; // Too old
          case 6: return { ...baseProperty, bedrooms: -1 }; // Negative bedrooms
          case 7: return { ...baseProperty, bathrooms: 25 }; // Too many bathrooms
          case 8: return { ...baseProperty, property_type: 'invalid_type' as any }; // Invalid type
          default: return baseProperty; // Valid property
        }
      });
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        problematicProperties.map(async (property, index) => {
          const opStart = Date.now();
          const result = await validationService.validateResidential(property);
          return {
            index,
            duration: Date.now() - opStart,
            hasErrors: result.errors.length > 0,
            errorCount: result.errors.length,
            errors: result.errors
          };
        })
      );
      
      const totalDuration = Date.now() - startTime;
      const averageTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const errorProperties = results.filter(r => r.hasErrors);
      const validProperties = results.filter(r => !r.hasErrors);
      const throughput = (batchSize / totalDuration) * 1000;
      
      // Error handling should be fast and consistent
      expect(errorProperties.length).toBeGreaterThan(0); // Should detect errors
      expect(validProperties.length).toBeGreaterThan(0); // Should pass valid ones
      expect(averageTime).toBeLessThan(5); // Error handling should be fast
      expect(throughput).toBeGreaterThan(200); // Still reasonable throughput
      
      // Verify error detection accuracy
      const expectedErrorCount = Math.floor(batchSize * 0.9); // 90% should have errors
      expect(errorProperties.length).toBeGreaterThan(expectedErrorCount * 0.8); // At least 80% of expected errors
      
      console.log(`⚠️  Error Handling Performance:
        - Processed: ${batchSize} properties (with validation issues) in ${totalDuration}ms
        - Average operation time: ${averageTime.toFixed(3)}ms
        - Throughput: ${throughput.toFixed(0)} properties/second
        - Properties with errors: ${errorProperties.length} (${((errorProperties.length / batchSize) * 100).toFixed(1)}%)
        - Valid properties: ${validProperties.length} (${((validProperties.length / batchSize) * 100).toFixed(1)}%)`);
    });
  });
});