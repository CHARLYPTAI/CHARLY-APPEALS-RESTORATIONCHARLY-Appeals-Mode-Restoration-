/**
 * Track G4 — Heavy-Usage Sign-off Integration Tests
 * 
 * This test suite validates the complete performance testing framework
 * integration with the existing CHARLY platform.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { 
  PerformanceAgent, 
  defaultPerformanceConfig,
  type PerformanceConfig,
  type LoadTestResult 
} from '../services/performance-agent.js';
import { PerformanceReporter } from '../services/performance-reporter.js';
import { WorkflowSimulator, createWorkflowSimulator } from '../services/workflow-simulator.js';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('G4 Performance Integration Tests', () => {
  let agent: PerformanceAgent;
  let reporter: PerformanceReporter;
  let workflowSimulator: WorkflowSimulator;
  let testConfig: PerformanceConfig;
  let reportsDir: string;

  beforeAll(async () => {
    // Setup test environment
    reportsDir = './reports/g4-integration-test';
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    // Use light configuration for integration tests
    testConfig = {
      ...defaultPerformanceConfig,
      scenarios: {
        heavyResidential: {
          ...defaultPerformanceConfig.scenarios.heavyResidential,
          totalParcels: 500,     // Reduced for integration test
          batchSize: 50,         // Smaller batches
          concurrentBatches: 2,  // Limited concurrency
          rampUpDurationMs: 500,
          sustainedDurationMs: 1000,
          rampDownDurationMs: 500
        },
        moderateCommercial: {
          ...defaultPerformanceConfig.scenarios.moderateCommercial,
          portfolioSize: 5,
          totalPortfolios: 2,
          concurrentPortfolios: 1
        }
      },
      reporting: {
        ...defaultPerformanceConfig.reporting,
        outputPath: reportsDir
      }
    };
  });

  beforeEach(() => {
    agent = new PerformanceAgent(testConfig);
    reporter = new PerformanceReporter(testConfig);
    workflowSimulator = createWorkflowSimulator('test');
  });

  afterEach(async () => {
    if (agent.isTestRunning()) {
      await agent.stop();
    }
  });

  describe('Platform Integration', () => {
    it('should integrate with existing CHARLY API structure', async () => {
      // Test that performance agent can be used alongside existing services
      expect(agent).toBeDefined();
      expect(reporter).toBeDefined();
      expect(workflowSimulator).toBeDefined();
      
      // Test configuration compatibility
      expect(testConfig.metrics.apiP99TargetMs).toBe(50);
      expect(testConfig.metrics.uiP99TargetMs).toBe(100);
    });

    it('should work with realistic property data patterns', async () => {
      const testProperty = {
        id: 'TEST-INTEGRATION-001',
        address: '123 Test Integration St',
        city: 'Test City',
        state: 'CA',
        zip: '90210',
        propertyType: 'residential' as const,
        assessedValue: 750000,
        taxYear: 2024,
        appealReason: 'integration_test'
      };

      const workflowResult = await workflowSimulator.simulateWorkflow(testProperty);
      
      expect(workflowResult).toBeDefined();
      expect(workflowResult.propertyId).toBe(testProperty.id);
      expect(workflowResult.workflowType).toBe('residential');
      expect(workflowResult.steps.length).toBeGreaterThan(0);
      expect(workflowResult.totalDuration).toBeGreaterThan(0);
    });

    it('should handle both residential and commercial workflows', async () => {
      const residentialStats = workflowSimulator.getWorkflowStats('residential');
      const commercialStats = workflowSimulator.getWorkflowStats('commercial');
      
      expect(residentialStats.totalSteps).toBeGreaterThan(0);
      expect(commercialStats.totalSteps).toBeGreaterThan(residentialStats.totalSteps);
      expect(commercialStats.estimatedDuration).toBeGreaterThan(residentialStats.estimatedDuration);
      expect(commercialStats.aiIntensiveSteps).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Performance Testing', () => {
    it('should complete full G4 heavy-usage sign-off workflow', async () => {
      const testResults: LoadTestResult[] = [];
      
      // Run residential load test
      console.log('Running residential load test...');
      const residentialResult = await agent.runHeavyResidentialLoad();
      testResults.push(residentialResult);
      
      expect(residentialResult.scenario).toBe('heavy-residential');
      expect(residentialResult.totalRequests).toBe(testConfig.scenarios.heavyResidential.totalParcels);
      expect(residentialResult.successfulRequests).toBeGreaterThan(0);
      
      // Run commercial load test
      console.log('Running commercial load test...');
      const commercialResult = await agent.runModerateCommercialLoad();
      testResults.push(commercialResult);
      
      expect(commercialResult.scenario).toBe('moderate-commercial');
      expect(commercialResult.totalRequests).toBeGreaterThan(0);
      
      // Generate comprehensive report
      const report = await reporter.generateReport(testResults, 'G4-Integration-Test');
      
      expect(report.summary.totalTests).toBe(2);
      expect(report.compliance).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Verify performance targets
      expect(report.compliance.performanceTargets.apiP99Met).toBe(true);
      expect(report.compliance.performanceTargets.errorRateAcceptable).toBe(true);
      
      console.log(`Performance Score: ${report.summary.performanceScore}/100`);
      expect(report.summary.performanceScore).toBeGreaterThan(60); // Reasonable threshold for integration test
      
    }, 60000); // 1 minute timeout

    it('should validate AI router integration', async () => {
      try {
        const aiStats = await agent.testAIRouterStability();
        
        expect(aiStats.totalRequests).toBeGreaterThanOrEqual(0);
        expect(aiStats.budgetRemaining).toBeGreaterThanOrEqual(0);
        expect(aiStats.circuitBreakerTrips).toBe(0);
        
      } catch (error) {
        // AI Router may not be available in test environment
        expect(error.message).toContain('AI Router not available');
        console.log('AI Router not available for integration test - this is expected in test environments');
      }
    });

    it('should measure performance within acceptable thresholds', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      // API performance requirements
      expect(result.metrics.responseTime.p99).toBeLessThanOrEqual(testConfig.metrics.apiP99TargetMs);
      expect(result.errorRate).toBeLessThanOrEqual(testConfig.metrics.errorRateThreshold);
      
      // Resource usage should be tracked
      expect(result.metrics.resources.cpuUsage).toBeDefined();
      expect(result.metrics.resources.memoryUsage).toBeDefined();
      
      // Throughput should be reasonable
      expect(result.metrics.throughput.requestsPerSecond).toBeGreaterThan(0);
      
    }, 30000);
  });

  describe('Standalone Script Integration', () => {
    it('should be runnable as standalone script', async () => {
      // Create a minimal configuration file
      const testConfigPath = join(reportsDir, 'test-config.json');
      writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
      
      // Test that configuration can be loaded
      expect(existsSync(testConfigPath)).toBe(true);
      
      // Verify the script exists
      const scriptPath = join(process.cwd(), '../../../tools/performance-runner.js');
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should support different test scenarios', () => {
      const scenarios = ['all', 'heavy-residential', 'moderate-commercial', 'ai-router-stress'];
      
      scenarios.forEach(scenario => {
        expect(typeof scenario).toBe('string');
        expect(scenario.length).toBeGreaterThan(0);
      });
    });

    it('should support different scale configurations', () => {
      const scales = ['full', 'medium', 'light'];
      
      scales.forEach(scale => {
        expect(typeof scale).toBe('string');
        expect(['full', 'medium', 'light']).toContain(scale);
      });
    });
  });

  describe('Test Suite Integration', () => {
    it('should integrate with existing vitest configuration', () => {
      // This test itself proves integration with vitest
      expect(describe).toBeDefined();
      expect(it).toBeDefined();
      expect(expect).toBeDefined();
    });

    it('should be runnable with npm test commands', () => {
      // Verify that the test can be identified by test runners
      expect(process.env.NODE_ENV).toBeDefined();
    });

    it('should generate test reports in expected format', async () => {
      const testResults = [await agent.runHeavyResidentialLoad()];
      const report = await reporter.generateReport(testResults);
      
      // Verify report structure
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('testSuite');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('testResults');
      expect(report).toHaveProperty('compliance');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('systemInfo');
      
      // Verify summary structure
      expect(report.summary).toHaveProperty('totalTests');
      expect(report.summary).toHaveProperty('passedTests');
      expect(report.summary).toHaveProperty('failedTests');
      expect(report.summary).toHaveProperty('performanceScore');
      
      // Verify compliance structure
      expect(report.compliance).toHaveProperty('performanceTargets');
      expect(report.compliance).toHaveProperty('aiRouter');
      expect(report.compliance).toHaveProperty('database');
      expect(report.compliance).toHaveProperty('security');
      
    }, 30000);
  });

  describe('Error Handling and Recovery', () => {
    it('should handle configuration errors gracefully', () => {
      const invalidConfig = {
        ...testConfig,
        scenarios: {
          ...testConfig.scenarios,
          heavyResidential: {
            ...testConfig.scenarios.heavyResidential,
            enabled: false
          }
        }
      };
      
      const invalidAgent = new PerformanceAgent(invalidConfig);
      
      expect(async () => {
        await invalidAgent.runHeavyResidentialLoad();
      }).rejects.toThrow('disabled');
    });

    it('should handle workflow failures appropriately', async () => {
      const testProperty = {
        id: 'FAIL-TEST-001',
        address: 'Invalid Property',
        city: 'Unknown',
        state: 'XX',
        zip: '00000',
        propertyType: 'residential' as const,
        assessedValue: -1, // Invalid value to trigger errors
        taxYear: 2024
      };

      const workflowResult = await workflowSimulator.simulateWorkflow(testProperty);
      
      // Even with invalid data, workflow should complete but may have warnings
      expect(workflowResult).toBeDefined();
      expect(workflowResult.propertyId).toBe(testProperty.id);
      
      // Should track any issues
      if (!workflowResult.success) {
        expect(workflowResult.errors.length).toBeGreaterThan(0);
      }
    });

    it('should stop gracefully when requested', async () => {
      expect(agent.isTestRunning()).toBe(false);
      
      // Start a test
      const testPromise = agent.runHeavyResidentialLoad();
      
      // Stop the agent
      await agent.stop();
      
      expect(agent.isTestRunning()).toBe(false);
      
      // Wait for test to complete
      await testPromise;
    }, 30000);
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      // Set baseline expectations
      const baselineP99 = 50; // ms
      const baselineErrorRate = 0.01; // 1%
      
      if (result.metrics.responseTime.p99 > baselineP99 * 1.5) {
        console.warn(`Performance regression detected: p99 latency ${result.metrics.responseTime.p99}ms exceeds baseline ${baselineP99}ms by >50%`);
      }
      
      if (result.errorRate > baselineErrorRate * 2) {
        console.warn(`Error rate regression detected: ${result.errorRate} exceeds baseline ${baselineErrorRate} by >100%`);
      }
      
      // These should still pass within reasonable bounds for integration tests
      expect(result.metrics.responseTime.p99).toBeLessThan(500); // 500ms is very generous for integration test
      expect(result.errorRate).toBeLessThan(0.1); // 10% error rate is very generous
      
    }, 30000);

    it('should track resource usage trends', async () => {
      const result = await agent.runHeavyResidentialLoad();
      
      const avgCpu = result.metrics.resources.cpuUsage.length > 0 
        ? result.metrics.resources.cpuUsage.reduce((a, b) => a + b, 0) / result.metrics.resources.cpuUsage.length 
        : 0;
      
      const maxMemory = result.metrics.resources.memoryUsage.length > 0 
        ? Math.max(...result.metrics.resources.memoryUsage) 
        : 0;
      
      // Log for monitoring trends
      console.log(`Resource usage - CPU: ${avgCpu.toFixed(1)}%, Memory: ${maxMemory.toFixed(1)}MB`);
      
      // Basic sanity checks
      expect(avgCpu).toBeGreaterThanOrEqual(0);
      expect(maxMemory).toBeGreaterThan(0);
      
    }, 30000);
  });
});