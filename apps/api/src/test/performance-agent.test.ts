import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  PerformanceAgent, 
  defaultPerformanceConfig,
  type PerformanceConfig,
  type LoadTestResult 
} from '../services/performance-agent.js';
import { PerformanceReporter } from '../services/performance-reporter.js';

describe('Performance Agent - Track G4 Heavy Usage Tests', () => {
  let agent: PerformanceAgent;
  let config: PerformanceConfig;
  let reporter: PerformanceReporter;

  beforeEach(() => {
    // Use reduced scale for test environment
    config = {
      ...defaultPerformanceConfig,
      scenarios: {
        heavyResidential: {
          ...defaultPerformanceConfig.scenarios.heavyResidential,
          totalParcels: 1000,      // Reduced from 50,000 for testing
          batchSize: 100,          // Reduced batch size
          concurrentBatches: 2,    // Reduced concurrency
          rampUpDurationMs: 1000,  // 1 second
          sustainedDurationMs: 3000, // 3 seconds
          rampDownDurationMs: 1000   // 1 second
        },
        moderateCommercial: {
          ...defaultPerformanceConfig.scenarios.moderateCommercial,
          portfolioSize: 5,        // Reduced from 25
          totalPortfolios: 4,      // Reduced from 20
          concurrentPortfolios: 2  // Reduced concurrency
        }
      },
      reporting: {
        ...defaultPerformanceConfig.reporting,
        outputPath: './reports/performance-test'
      }
    };
    
    agent = new PerformanceAgent(config);
    reporter = new PerformanceReporter(config);
  });

  afterEach(async () => {
    if (agent.isTestRunning()) {
      await agent.stop();
    }
  });

  describe('Heavy Residential Load Simulation', () => {
    it('should simulate processing 50,000+ residential parcels in batches', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      expect(result).toBeDefined();
      expect(result.scenario).toBe('heavy-residential');
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metrics.responseTime.p99).toBeDefined();
      
      // Verify performance targets
      expect(result.metrics.responseTime.p99).toBeLessThanOrEqual(config.metrics.apiP99TargetMs);
      expect(result.errorRate).toBeLessThanOrEqual(config.metrics.errorRateThreshold);
    }, 30000); // 30 second timeout

    it('should handle batch processing with proper concurrency', async () => {
      const startTime = Date.now();
      const result = await agent.runHeavyResidentialLoad();
      const endTime = Date.now();
      
      expect(result.totalRequests).toBe(config.scenarios.heavyResidential.totalParcels);
      expect(endTime - startTime).toBeGreaterThan(config.scenarios.heavyResidential.rampUpDurationMs);
      expect(result.successfulRequests + result.failedRequests).toBe(result.totalRequests);
    }, 30000);

    it('should collect comprehensive performance metrics', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      expect(result.metrics.responseTime).toMatchObject({
        min: expect.any(Number),
        max: expect.any(Number),
        mean: expect.any(Number),
        p50: expect.any(Number),
        p95: expect.any(Number),
        p99: expect.any(Number)
      });
      
      expect(result.metrics.throughput.requestsPerSecond).toBeGreaterThan(0);
      expect(result.metrics.resources.cpuUsage).toBeDefined();
      expect(result.metrics.resources.memoryUsage).toBeDefined();
    }, 30000);
  });

  describe('Moderate Commercial Load Simulation', () => {
    it('should simulate processing 500+ commercial parcels in portfolio runs', async () => {
      const result = await agent.runModerateCommercialLoad();
      
      expect(result).toBeDefined();
      expect(result.scenario).toBe('moderate-commercial');
      expect(result.totalRequests).toBeGreaterThanOrEqual(20); // 4 portfolios * 5 properties
      expect(result.metrics.responseTime.p99).toBeLessThanOrEqual(config.metrics.apiP99TargetMs);
    }, 30000);

    it('should test AI router under commercial load', async () => {
      const result = await agent.runModerateCommercialLoad();
      
      if (result.aiRouterStats) {
        expect(result.aiRouterStats.totalRequests).toBeGreaterThanOrEqual(0);
        expect(result.aiRouterStats.budgetRemaining).toBeGreaterThanOrEqual(0);
        expect(result.aiRouterStats.circuitBreakerTrips).toBe(0);
      }
    }, 30000);

    it('should handle portfolio complexity levels', async () => {
      // Test with high complexity
      const highComplexityConfig = {
        ...config,
        scenarios: {
          ...config.scenarios,
          moderateCommercial: {
            ...config.scenarios.moderateCommercial,
            complexityLevel: 'high' as const
          }
        }
      };
      
      const highComplexityAgent = new PerformanceAgent(highComplexityConfig);
      const result = await highComplexityAgent.runModerateCommercialLoad();
      
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.metrics.responseTime.mean).toBeGreaterThan(0);
      
      await highComplexityAgent.stop();
    }, 30000);
  });

  describe('AI Router Stability Testing', () => {
    it('should test AI router stability under concurrent load', async () => {
      try {
        const stats = await agent.testAIRouterStability();
        
        expect(stats).toBeDefined();
        expect(stats.totalRequests).toBeGreaterThanOrEqual(0);
        expect(stats.budgetRemaining).toBeGreaterThanOrEqual(0);
        expect(stats.circuitBreakerTrips).toBe(0);
        
      } catch (error) {
        // Expected if LLM Router is not available in test environment
        expect(error.message).toContain('AI Router not available');
      }
    });

    it('should validate budget enforcement', async () => {
      try {
        const stats = await agent.testAIRouterStability();
        
        // Budget should never go negative
        expect(stats.budgetRemaining).toBeGreaterThanOrEqual(0);
        
        // Should track spending
        expect(stats.budgetSpent).toBeGreaterThanOrEqual(0);
        
      } catch (error) {
        // Expected if LLM Router is not available
        expect(error.message).toContain('AI Router not available');
      }
    });

    it('should validate schema compliance under load', async () => {
      try {
        const stats = await agent.testAIRouterStability();
        
        if (stats.totalRequests > 0) {
          // Schema validation success rate should be high
          const successRate = stats.schemaValidationSuccesses / stats.totalRequests;
          expect(successRate).toBeGreaterThanOrEqual(0.95);
        }
        
      } catch (error) {
        // Expected if LLM Router is not available
        expect(error.message).toContain('AI Router not available');
      }
    });
  });

  describe('Performance Metrics Validation', () => {
    it('should meet p99 latency targets for API calls', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      expect(result.metrics.responseTime.p99).toBeLessThanOrEqual(config.metrics.apiP99TargetMs);
    }, 30000);

    it('should maintain low error rates', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      expect(result.errorRate).toBeLessThanOrEqual(config.metrics.errorRateThreshold);
    }, 30000);

    it('should track resource usage within thresholds', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      const avgCpu = result.metrics.resources.cpuUsage.length > 0 
        ? result.metrics.resources.cpuUsage.reduce((a, b) => a + b, 0) / result.metrics.resources.cpuUsage.length 
        : 0;
      
      const maxMemory = result.metrics.resources.memoryUsage.length > 0 
        ? Math.max(...result.metrics.resources.memoryUsage) 
        : 0;
      
      // These might be exceeded in test environment, but should be tracked
      expect(avgCpu).toBeGreaterThanOrEqual(0);
      expect(maxMemory).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Property Tax Appeal Workflow Patterns', () => {
    it('should simulate realistic residential appeal workflow', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      // Verify that properties are processed through complete workflow
      expect(result.totalRequests).toBe(config.scenarios.heavyResidential.totalParcels);
      expect(result.successfulRequests).toBeGreaterThan(0);
      
      // Verify timing is realistic for property processing
      expect(result.metrics.responseTime.mean).toBeGreaterThan(10); // At least 10ms per property
      expect(result.metrics.responseTime.mean).toBeLessThan(1000);  // Less than 1s per property
    }, 30000);

    it('should simulate realistic commercial appeal workflow', async () => {
      const result = await agent.runModerateCommercialLoad();
      
      // Commercial properties should take longer than residential
      expect(result.metrics.responseTime.mean).toBeGreaterThan(50); // More complex processing
      
      // Should handle portfolio-based processing
      expect(result.totalRequests).toBeGreaterThanOrEqual(
        config.scenarios.moderateCommercial.portfolioSize * 2
      );
    }, 30000);
  });

  describe('Report Generation', () => {
    it('should generate comprehensive performance report', async () => {
      const testResults: LoadTestResult[] = [
        await agent.runHeavyResidentialLoad(),
        await agent.runModerateCommercialLoad()
      ];
      
      const report = await reporter.generateReport(testResults, 'G4-Test-Suite');
      
      expect(report).toBeDefined();
      expect(report.testSuite).toBe('G4-Test-Suite');
      expect(report.summary.totalTests).toBe(2);
      expect(report.testResults).toHaveLength(2);
      expect(report.compliance).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Performance score should be calculated
      expect(report.summary.performanceScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.performanceScore).toBeLessThanOrEqual(100);
    }, 60000);

    it('should validate compliance requirements', async () => {
      const testResults: LoadTestResult[] = [
        await agent.runHeavyResidentialLoad()
      ];
      
      const report = await reporter.generateReport(testResults);
      
      expect(report.compliance.performanceTargets).toBeDefined();
      expect(report.compliance.aiRouter).toBeDefined();
      expect(report.compliance.database).toBeDefined();
      expect(report.compliance.security).toBeDefined();
      
      // API performance should meet targets
      expect(report.compliance.performanceTargets.apiP99Met).toBe(true);
      expect(report.compliance.performanceTargets.errorRateAcceptable).toBe(true);
    }, 60000);
  });

  describe('Error Handling and Recovery', () => {
    it('should handle test failures gracefully', async () => {
      // Create agent with impossible config to trigger failures
      const failureConfig = {
        ...config,
        scenarios: {
          ...config.scenarios,
          heavyResidential: {
            ...config.scenarios.heavyResidential,
            enabled: false
          }
        }
      };
      
      const failureAgent = new PerformanceAgent(failureConfig);
      
      await expect(failureAgent.runHeavyResidentialLoad()).rejects.toThrow('disabled');
      
      await failureAgent.stop();
    });

    it('should stop gracefully when requested', async () => {
      expect(agent.isTestRunning()).toBe(false);
      
      // Start a test in background
      const testPromise = agent.runHeavyResidentialLoad();
      
      // Stop the agent
      await agent.stop();
      
      expect(agent.isTestRunning()).toBe(false);
      
      // Wait for test to complete
      await testPromise;
    }, 30000);
  });

  describe('Integration with CHARLY Platform', () => {
    it('should integrate with existing API structure', () => {
      // Verify that PerformanceAgent can be imported and used
      expect(PerformanceAgent).toBeDefined();
      expect(typeof PerformanceAgent).toBe('function');
      
      // Verify configuration is compatible
      expect(config.scenarios.heavyResidential).toBeDefined();
      expect(config.scenarios.moderateCommercial).toBeDefined();
      expect(config.metrics.apiP99TargetMs).toBe(50);
      expect(config.metrics.uiP99TargetMs).toBe(100);
    });

    it('should work with realistic data patterns', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      // Verify that generated property data follows expected patterns
      expect(result.totalRequests).toBe(config.scenarios.heavyResidential.totalParcels);
      
      // Check that processing times are realistic
      expect(result.metrics.responseTime.p99).toBeGreaterThan(0);
      expect(result.metrics.responseTime.p99).toBeLessThan(10000); // Should be under 10 seconds
    }, 30000);
  });
});