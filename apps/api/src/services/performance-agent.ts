import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { createErrorBuilder } from '../utils/error-handler.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';
import { v4 as uuidv4 } from 'uuid';

export interface PerformanceConfig {
  enabled: boolean;
  scenarios: {
    heavyResidential: HeavyResidentialConfig;
    moderateCommercial: ModerateCommercialConfig;
  };
  metrics: MetricsConfig;
  aiRouter: AIRouterConfig;
  database: DatabaseConfig;
  reporting: ReportingConfig;
}

export interface HeavyResidentialConfig {
  enabled: boolean;
  batchSize: number;
  totalParcels: number;
  concurrentBatches: number;
  rampUpDurationMs: number;
  sustainedDurationMs: number;
  rampDownDurationMs: number;
}

export interface ModerateCommercialConfig {
  enabled: boolean;
  portfolioSize: number;
  totalPortfolios: number;
  concurrentPortfolios: number;
  complexityLevel: 'low' | 'medium' | 'high';
  includeAI: boolean;
}

export interface MetricsConfig {
  uiP99TargetMs: number;
  apiP99TargetMs: number;
  errorRateThreshold: number;
  memoryThresholdMB: number;
  cpuThresholdPercent: number;
  collectIntervalMs: number;
}

export interface AIRouterConfig {
  testBudgetLimits: boolean;
  testSchemaCompliance: boolean;
  testConcurrentLoad: boolean;
  maxConcurrentRequests: number;
  budgetTestAmount: number;
}

export interface DatabaseConfig {
  testConnectionLimits: boolean;
  testQueryPerformance: boolean;
  maxConnections: number;
  queryTimeoutMs: number;
}

export interface ReportingConfig {
  generateHtml: boolean;
  generateJson: boolean;
  includeCharts: boolean;
  outputPath: string;
}

export interface LoadTestResult {
  testId: string;
  scenario: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  metrics: PerformanceMetrics;
  aiRouterStats?: AIRouterStats;
  databaseStats?: DatabaseStats;
  errors: string[];
  warnings: string[];
}

export interface PerformanceMetrics {
  responseTime: {
    min: number;
    max: number;
    mean: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    bytesPerSecond: number;
  };
  resources: {
    cpuUsage: number[];
    memoryUsage: number[];
    networkIO: number[];
  };
}

export interface AIRouterStats {
  totalRequests: number;
  budgetSpent: number;
  budgetRemaining: number;
  schemaValidationSuccesses: number;
  schemaValidationFailures: number;
  circuitBreakerTrips: number;
  piiRedactionCount: number;
}

export interface DatabaseStats {
  totalQueries: number;
  slowQueries: number;
  connectionPoolUsage: number;
  deadlocks: number;
  transactionRollbacks: number;
}

export interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: 'residential' | 'commercial';
  assessedValue: number;
  taxYear: number;
  appealReason?: string;
}

export class PerformanceAgent extends EventEmitter {
  private config: PerformanceConfig;
  private isRunning: boolean = false;
  private activeTests: Map<string, LoadTestResult> = new Map();
  private metricsCollector: MetricsCollector;
  private router: any = null;

  constructor(config: PerformanceConfig) {
    super();
    this.config = config;
    this.metricsCollector = new MetricsCollector(config.metrics);
    
    // Initialize LLM Router if available
    this.initializeRouter();
  }

  private async initializeRouter(): Promise<void> {
    try {
      const { getRouter } = await import('@charly/llm-router');
      this.router = getRouter();
    } catch (error) {
      console.warn('LLM Router not available for performance testing');
    }
  }

  async runHeavyResidentialLoad(): Promise<LoadTestResult> {
    const testId = `heavy-residential-${uuidv4()}`;
    const config = this.config.scenarios.heavyResidential;
    
    if (!config.enabled) {
      throw new Error('Heavy residential load testing is disabled');
    }

    const result: LoadTestResult = {
      testId,
      scenario: 'heavy-residential',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      metrics: this.createEmptyMetrics(),
      errors: [],
      warnings: []
    };

    this.activeTests.set(testId, result);
    this.emit('testStarted', { testId, scenario: 'heavy-residential' });

    try {
      this.isRunning = true;
      
      // Start metrics collection
      this.metricsCollector.start();
      
      // Generate test data
      const parcels = this.generateResidentialParcels(config.totalParcels);
      
      // Run load test in phases
      await this.runRampUpPhase(testId, parcels, config);
      await this.runSustainedLoadPhase(testId, parcels, config);
      await this.runRampDownPhase(testId, parcels, config);
      
      // Collect final metrics
      result.metrics = await this.metricsCollector.getMetrics();
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      // Validate performance targets
      this.validatePerformanceTargets(result);
      
      this.emit('testCompleted', result);
      return result;
      
    } catch (error) {
      result.errors.push(`Heavy residential load test failed: ${error.message}`);
      this.emit('testFailed', result);
      throw error;
    } finally {
      this.isRunning = false;
      this.metricsCollector.stop();
      this.activeTests.delete(testId);
    }
  }

  async runModerateCommercialLoad(): Promise<LoadTestResult> {
    const testId = `moderate-commercial-${uuidv4()}`;
    const config = this.config.scenarios.moderateCommercial;
    
    if (!config.enabled) {
      throw new Error('Moderate commercial load testing is disabled');
    }

    const result: LoadTestResult = {
      testId,
      scenario: 'moderate-commercial',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      metrics: this.createEmptyMetrics(),
      errors: [],
      warnings: []
    };

    this.activeTests.set(testId, result);
    this.emit('testStarted', { testId, scenario: 'moderate-commercial' });

    try {
      this.isRunning = true;
      this.metricsCollector.start();
      
      // Generate commercial portfolios
      const portfolios = this.generateCommercialPortfolios(config);
      
      // Run concurrent portfolio processing
      await this.runCommercialPortfolioTest(testId, portfolios, config);
      
      // Test AI router under load if enabled
      if (config.includeAI && this.router) {
        result.aiRouterStats = await this.testAIRouterUnderLoad(testId);
      }
      
      result.metrics = await this.metricsCollector.getMetrics();
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      this.validatePerformanceTargets(result);
      
      this.emit('testCompleted', result);
      return result;
      
    } catch (error) {
      result.errors.push(`Moderate commercial load test failed: ${error.message}`);
      this.emit('testFailed', result);
      throw error;
    } finally {
      this.isRunning = false;
      this.metricsCollector.stop();
      this.activeTests.delete(testId);
    }
  }

  async testAIRouterStability(): Promise<AIRouterStats> {
    if (!this.router) {
      throw new Error('AI Router not available for testing');
    }

    const config = this.config.aiRouter;
    const stats: AIRouterStats = {
      totalRequests: 0,
      budgetSpent: 0,
      budgetRemaining: 0,
      schemaValidationSuccesses: 0,
      schemaValidationFailures: 0,
      circuitBreakerTrips: 0,
      piiRedactionCount: 0
    };

    try {
      // Test concurrent AI requests
      const concurrentRequests = Array(config.maxConcurrentRequests).fill(null).map(async (_, i) => {
        try {
          const request = {
            prompt: `Analyze property valuation data for test property ${i}`,
            model: 'gpt-4',
            maxTokens: 500,
            schema: {
              type: 'object',
              properties: {
                value: { type: 'number' },
                confidence: { type: 'number' }
              }
            }
          };
          
          const response = await this.router.generateCompletion(request);
          stats.totalRequests++;
          
          if (response.validated) {
            stats.schemaValidationSuccesses++;
          } else {
            stats.schemaValidationFailures++;
          }
          
        } catch (error) {
          stats.totalRequests++;
          // Could be budget limit, circuit breaker, etc.
        }
      });

      await Promise.allSettled(concurrentRequests);
      
      // Get router statistics
      const routerStats = await this.router.getProviderStats();
      if (routerStats) {
        Object.values(routerStats).forEach((providerStats: any) => {
          if (providerStats.budget) {
            stats.budgetSpent += providerStats.budget.spent || 0;
            stats.budgetRemaining += providerStats.budget.remaining || 0;
          }
          if (providerStats.circuitBreaker && providerStats.circuitBreaker.tripCount) {
            stats.circuitBreakerTrips += providerStats.circuitBreaker.tripCount;
          }
        });
      }

      return stats;
      
    } catch (error) {
      throw new Error(`AI Router stability test failed: ${error.message}`);
    }
  }

  private generateResidentialParcels(count: number): PropertyData[] {
    const parcels: PropertyData[] = [];
    
    for (let i = 0; i < count; i++) {
      parcels.push({
        id: `RES-${i.toString().padStart(8, '0')}`,
        address: `${100 + (i % 9900)} Test Street`,
        city: `City${i % 100}`,
        state: ['CA', 'TX', 'FL', 'NY', 'WA'][i % 5],
        zip: `${10000 + (i % 90000)}`,
        propertyType: 'residential',
        assessedValue: 200000 + (i % 800000),
        taxYear: 2024,
        appealReason: ['overassessment', 'comparable_sales', 'condition'][i % 3]
      });
    }
    
    return parcels;
  }

  private generateCommercialPortfolios(config: ModerateCommercialConfig): PropertyData[][] {
    const portfolios: PropertyData[][] = [];
    
    for (let p = 0; p < Math.ceil(500 / config.portfolioSize); p++) {
      const portfolio: PropertyData[] = [];
      
      for (let i = 0; i < config.portfolioSize; i++) {
        const propertyId = p * config.portfolioSize + i;
        portfolio.push({
          id: `COM-${propertyId.toString().padStart(8, '0')}`,
          address: `${1000 + propertyId} Business Blvd`,
          city: `Metro${propertyId % 20}`,
          state: ['CA', 'TX', 'FL', 'NY', 'WA'][propertyId % 5],
          zip: `${20000 + (propertyId % 80000)}`,
          propertyType: 'commercial',
          assessedValue: 500000 + (propertyId % 5000000),
          taxYear: 2024,
          appealReason: ['income_approach', 'sales_comparison', 'cost_approach'][propertyId % 3]
        });
      }
      
      portfolios.push(portfolio);
    }
    
    return portfolios;
  }

  private async runRampUpPhase(testId: string, parcels: PropertyData[], config: HeavyResidentialConfig): Promise<void> {
    const rampUpBatches = Math.ceil(config.concurrentBatches / 3);
    const batchDelay = config.rampUpDurationMs / rampUpBatches;
    
    for (let i = 0; i < rampUpBatches; i++) {
      const batchStart = i * config.batchSize;
      const batchEnd = Math.min(batchStart + config.batchSize, parcels.length);
      const batch = parcels.slice(batchStart, batchEnd);
      
      // Process batch concurrently
      this.processBatch(testId, batch);
      
      if (i < rampUpBatches - 1) {
        await this.sleep(batchDelay);
      }
    }
  }

  private async runSustainedLoadPhase(testId: string, parcels: PropertyData[], config: HeavyResidentialConfig): Promise<void> {
    const sustainedStart = performance.now();
    const batches = Math.ceil(parcels.length / config.batchSize);
    
    while (performance.now() - sustainedStart < config.sustainedDurationMs) {
      const concurrentPromises: Promise<void>[] = [];
      
      for (let i = 0; i < Math.min(config.concurrentBatches, batches); i++) {
        const batchStart = (i * config.batchSize) % parcels.length;
        const batchEnd = Math.min(batchStart + config.batchSize, parcels.length);
        const batch = parcels.slice(batchStart, batchEnd);
        
        concurrentPromises.push(this.processBatch(testId, batch));
      }
      
      await Promise.all(concurrentPromises);
    }
  }

  private async runRampDownPhase(testId: string, parcels: PropertyData[], config: HeavyResidentialConfig): Promise<void> {
    const rampDownBatches = Math.ceil(config.concurrentBatches / 3);
    const batchDelay = config.rampDownDurationMs / rampDownBatches;
    
    for (let i = rampDownBatches - 1; i >= 0; i--) {
      const batchStart = i * config.batchSize;
      const batchEnd = Math.min(batchStart + config.batchSize, parcels.length);
      const batch = parcels.slice(batchStart, batchEnd);
      
      this.processBatch(testId, batch);
      
      if (i > 0) {
        await this.sleep(batchDelay);
      }
    }
  }

  private async processBatch(testId: string, batch: PropertyData[]): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;
    
    const batchPromises = batch.map(async (property) => {
      const start = performance.now();
      
      try {
        // Simulate property processing
        await this.processProperty(property);
        test.successfulRequests++;
        
        const duration = performance.now() - start;
        this.metricsCollector.recordResponse(duration);
        
      } catch (error) {
        test.failedRequests++;
        test.errors.push(`Property ${property.id}: ${error.message}`);
      }
      
      test.totalRequests++;
    });
    
    await Promise.all(batchPromises);
  }

  private async processProperty(property: PropertyData): Promise<void> {
    // Use realistic workflow simulation
    const { WorkflowSimulator } = await import('./workflow-simulator.js');
    const simulator = new WorkflowSimulator({
      simulateNetworkLatency: true,
      simulateSystemLoad: true
    });
    
    const workflowResult = await simulator.simulateWorkflow(property);
    
    if (!workflowResult.success) {
      throw new Error(`Property workflow failed: ${workflowResult.errors.join(', ')}`);
    }
    
    // Update AI usage tracking if router is available
    if (this.router && workflowResult.aiUsage.requests > 0) {
      // In a real implementation, this would update router statistics
      // For simulation, we just track the usage
    }
  }

  private async runCommercialPortfolioTest(testId: string, portfolios: PropertyData[][], config: ModerateCommercialConfig): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;
    
    const portfolioPromises = portfolios.slice(0, config.concurrentPortfolios).map(async (portfolio, index) => {
      try {
        await this.processCommercialPortfolio(portfolio, config.complexityLevel);
        test.successfulRequests += portfolio.length;
      } catch (error) {
        test.failedRequests += portfolio.length;
        test.errors.push(`Portfolio ${index}: ${error.message}`);
      }
      test.totalRequests += portfolio.length;
    });
    
    await Promise.all(portfolioPromises);
  }

  private async processCommercialPortfolio(portfolio: PropertyData[], complexity: 'low' | 'medium' | 'high'): Promise<void> {
    const complexityMultiplier = { low: 1, medium: 2, high: 3 }[complexity];
    
    for (const property of portfolio) {
      await this.processProperty(property);
      // Additional commercial-specific processing
      await this.sleep(50 * complexityMultiplier + Math.random() * 100 * complexityMultiplier);
    }
  }

  private async testAIRouterUnderLoad(testId: string): Promise<AIRouterStats> {
    if (!this.router) {
      throw new Error('AI Router not available');
    }
    
    return await this.testAIRouterStability();
  }

  private validatePerformanceTargets(result: LoadTestResult): void {
    const config = this.config.metrics;
    
    if (result.metrics.responseTime.p99 > config.apiP99TargetMs) {
      result.warnings.push(`API p99 latency (${result.metrics.responseTime.p99}ms) exceeds target (${config.apiP99TargetMs}ms)`);
    }
    
    if (result.errorRate > config.errorRateThreshold) {
      result.warnings.push(`Error rate (${result.errorRate}) exceeds threshold (${config.errorRateThreshold})`);
    }
    
    const avgCpu = result.metrics.resources.cpuUsage.reduce((a, b) => a + b, 0) / result.metrics.resources.cpuUsage.length;
    if (avgCpu > config.cpuThresholdPercent) {
      result.warnings.push(`Average CPU usage (${avgCpu}%) exceeds threshold (${config.cpuThresholdPercent}%)`);
    }
    
    const maxMemory = Math.max(...result.metrics.resources.memoryUsage);
    if (maxMemory > config.memoryThresholdMB) {
      result.warnings.push(`Peak memory usage (${maxMemory}MB) exceeds threshold (${config.memoryThresholdMB}MB)`);
    }
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      responseTime: { min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 },
      throughput: { requestsPerSecond: 0, bytesPerSecond: 0 },
      resources: { cpuUsage: [], memoryUsage: [], networkIO: [] }
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getActiveTests(): LoadTestResult[] {
    return Array.from(this.activeTests.values());
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.metricsCollector.stop();
    this.emit('agentStopped');
  }
}

class MetricsCollector {
  private config: MetricsConfig;
  private isCollecting: boolean = false;
  private responseTimes: number[] = [];
  private cpuUsage: number[] = [];
  private memoryUsage: number[] = [];
  private networkIO: number[] = [];
  private intervalId?: NodeJS.Timeout;

  constructor(config: MetricsConfig) {
    this.config = config;
  }

  start(): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    this.responseTimes = [];
    this.cpuUsage = [];
    this.memoryUsage = [];
    this.networkIO = [];
    
    this.intervalId = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.collectIntervalMs);
  }

  stop(): void {
    this.isCollecting = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  recordResponse(duration: number): void {
    if (this.isCollecting) {
      this.responseTimes.push(duration);
    }
  }

  private collectSystemMetrics(): void {
    // Simulate system metrics collection
    // In a real implementation, this would use actual system monitoring
    const memUsage = process.memoryUsage();
    this.memoryUsage.push(memUsage.heapUsed / 1024 / 1024); // MB
    
    // Simulate CPU usage (would use actual CPU monitoring in production)
    this.cpuUsage.push(Math.random() * 100);
    
    // Simulate network I/O
    this.networkIO.push(Math.random() * 1000);
  }

  async getMetrics(): Promise<PerformanceMetrics> {
    const sortedTimes = this.responseTimes.slice().sort((a, b) => a - b);
    
    return {
      responseTime: {
        min: sortedTimes.length > 0 ? sortedTimes[0] : 0,
        max: sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0,
        mean: sortedTimes.length > 0 ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length : 0,
        p50: this.percentile(sortedTimes, 0.5),
        p95: this.percentile(sortedTimes, 0.95),
        p99: this.percentile(sortedTimes, 0.99)
      },
      throughput: {
        requestsPerSecond: this.responseTimes.length > 0 ? this.responseTimes.length / 60 : 0, // Assuming 1 min collection
        bytesPerSecond: 0 // Would be calculated from actual network metrics
      },
      resources: {
        cpuUsage: this.cpuUsage.slice(),
        memoryUsage: this.memoryUsage.slice(),
        networkIO: this.networkIO.slice()
      }
    };
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Default configuration
export const defaultPerformanceConfig: PerformanceConfig = {
  enabled: true,
  scenarios: {
    heavyResidential: {
      enabled: true,
      batchSize: 1000,
      totalParcels: 50000,
      concurrentBatches: 10,
      rampUpDurationMs: 30000,      // 30 seconds
      sustainedDurationMs: 300000,   // 5 minutes
      rampDownDurationMs: 30000      // 30 seconds
    },
    moderateCommercial: {
      enabled: true,
      portfolioSize: 25,
      totalPortfolios: 20,
      concurrentPortfolios: 5,
      complexityLevel: 'medium',
      includeAI: true
    }
  },
  metrics: {
    uiP99TargetMs: 100,
    apiP99TargetMs: 50,
    errorRateThreshold: 0.01,  // 1%
    memoryThresholdMB: 512,
    cpuThresholdPercent: 80,
    collectIntervalMs: 5000    // 5 seconds
  },
  aiRouter: {
    testBudgetLimits: true,
    testSchemaCompliance: true,
    testConcurrentLoad: true,
    maxConcurrentRequests: 50,
    budgetTestAmount: 1000     // $10.00 in cents
  },
  database: {
    testConnectionLimits: true,
    testQueryPerformance: true,
    maxConnections: 100,
    queryTimeoutMs: 5000
  },
  reporting: {
    generateHtml: true,
    generateJson: true,
    includeCharts: true,
    outputPath: './reports/performance'
  }
};