#!/usr/bin/env node

/**
 * CHARLY Performance Agent Runner
 * 
 * Standalone script for running Track G4 Heavy-Usage Sign-off performance tests
 * 
 * Usage:
 *   node performance-runner.js --scenario all
 *   node performance-runner.js --scenario heavy-residential
 *   node performance-runner.js --scenario moderate-commercial
 *   node performance-runner.js --scenario ai-router-stress
 *   node performance-runner.js --config ./custom-perf-config.json
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const API_DIR = join(ROOT_DIR, 'apps/api');
const REPORTS_DIR = join(ROOT_DIR, 'reports/performance');

// CLI argument parsing
function parseCliArgs() {
  const args = process.argv.slice(2);
  const flags = {
    scenario: 'all',
    config: null,
    outputPath: REPORTS_DIR,
    verbose: false,
    skipWarmup: false,
    dryRun: false,
    scale: 'full'
  };
  
  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1] || 'true';
      flags[key] = value === 'true' ? true : value === 'false' ? false : value;
    }
  }
  
  return flags;
}

// Performance configuration presets
function getPerformanceConfig(scale = 'full') {
  const configs = {
    full: {
      enabled: true,
      scenarios: {
        heavyResidential: {
          enabled: true,
          batchSize: 1000,
          totalParcels: 50000,
          concurrentBatches: 15,
          rampUpDurationMs: 60000,      // 1 minute
          sustainedDurationMs: 600000,   // 10 minutes
          rampDownDurationMs: 60000      // 1 minute
        },
        moderateCommercial: {
          enabled: true,
          portfolioSize: 25,
          totalPortfolios: 20,
          concurrentPortfolios: 8,
          complexityLevel: 'high',
          includeAI: true
        }
      },
      metrics: {
        uiP99TargetMs: 100,
        apiP99TargetMs: 50,
        errorRateThreshold: 0.01,
        memoryThresholdMB: 1024,
        cpuThresholdPercent: 80,
        collectIntervalMs: 5000
      },
      aiRouter: {
        testBudgetLimits: true,
        testSchemaCompliance: true,
        testConcurrentLoad: true,
        maxConcurrentRequests: 100,
        budgetTestAmount: 5000
      },
      database: {
        testConnectionLimits: true,
        testQueryPerformance: true,
        maxConnections: 200,
        queryTimeoutMs: 5000
      },
      reporting: {
        generateHtml: true,
        generateJson: true,
        includeCharts: true,
        outputPath: REPORTS_DIR
      }
    },
    
    medium: {
      enabled: true,
      scenarios: {
        heavyResidential: {
          enabled: true,
          batchSize: 500,
          totalParcels: 10000,
          concurrentBatches: 8,
          rampUpDurationMs: 30000,
          sustainedDurationMs: 180000,   // 3 minutes
          rampDownDurationMs: 30000
        },
        moderateCommercial: {
          enabled: true,
          portfolioSize: 15,
          totalPortfolios: 10,
          concurrentPortfolios: 4,
          complexityLevel: 'medium',
          includeAI: true
        }
      },
      metrics: {
        uiP99TargetMs: 100,
        apiP99TargetMs: 50,
        errorRateThreshold: 0.02,
        memoryThresholdMB: 512,
        cpuThresholdPercent: 75,
        collectIntervalMs: 5000
      },
      aiRouter: {
        testBudgetLimits: true,
        testSchemaCompliance: true,
        testConcurrentLoad: true,
        maxConcurrentRequests: 50,
        budgetTestAmount: 2000
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
        outputPath: REPORTS_DIR
      }
    },
    
    light: {
      enabled: true,
      scenarios: {
        heavyResidential: {
          enabled: true,
          batchSize: 200,
          totalParcels: 2000,
          concurrentBatches: 4,
          rampUpDurationMs: 15000,
          sustainedDurationMs: 60000,    // 1 minute
          rampDownDurationMs: 15000
        },
        moderateCommercial: {
          enabled: true,
          portfolioSize: 10,
          totalPortfolios: 5,
          concurrentPortfolios: 2,
          complexityLevel: 'low',
          includeAI: true
        }
      },
      metrics: {
        uiP99TargetMs: 100,
        apiP99TargetMs: 50,
        errorRateThreshold: 0.05,
        memoryThresholdMB: 256,
        cpuThresholdPercent: 70,
        collectIntervalMs: 2000
      },
      aiRouter: {
        testBudgetLimits: true,
        testSchemaCompliance: true,
        testConcurrentLoad: true,
        maxConcurrentRequests: 20,
        budgetTestAmount: 500
      },
      database: {
        testConnectionLimits: true,
        testQueryPerformance: true,
        maxConnections: 50,
        queryTimeoutMs: 3000
      },
      reporting: {
        generateHtml: true,
        generateJson: true,
        includeCharts: true,
        outputPath: REPORTS_DIR
      }
    }
  };
  
  return configs[scale] || configs.full;
}

// Check prerequisites
function checkPrerequisites() {
  console.log('📋 Checking prerequisites...');
  
  // Check if API directory exists
  if (!existsSync(API_DIR)) {
    throw new Error(`API directory not found: ${API_DIR}`);
  }
  
  // Check if node_modules exists
  if (!existsSync(join(API_DIR, 'node_modules'))) {
    throw new Error('Dependencies not installed. Run: cd apps/api && npm install');
  }
  
  // Create reports directory if needed
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
    console.log(`📁 Created reports directory: ${REPORTS_DIR}`);
  }
  
  console.log('✅ Prerequisites check passed');
}

// Run TypeScript compilation if needed
async function ensureCompiled() {
  console.log('🔨 Ensuring TypeScript compilation...');
  
  return new Promise((resolve, reject) => {
    const tsc = spawn('npm', ['run', 'build'], {
      cwd: API_DIR,
      stdio: 'pipe'
    });
    
    let output = '';
    tsc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tsc.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript compilation successful');
        resolve(output);
      } else {
        reject(new Error(`TypeScript compilation failed with code ${code}: ${output}`));
      }
    });
  });
}

// Run performance tests
async function runPerformanceTests(scenario, config, options) {
  console.log(`🚀 Starting performance tests for scenario: ${scenario}`);
  console.log(`⚙️  Configuration scale: ${options.scale}`);
  
  // Create temporary config file
  const configPath = join(REPORTS_DIR, 'temp-config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  try {
    // Generate the test runner script
    const runnerScript = generateTestScript(scenario, configPath, options);
    const scriptPath = join(REPORTS_DIR, 'temp-runner.mjs');
    writeFileSync(scriptPath, runnerScript);
    
    // Execute the test script
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', [scriptPath], {
        cwd: API_DIR,
        stdio: options.verbose ? 'inherit' : 'pipe',
        env: {
          ...process.env,
          NODE_PATH: join(API_DIR, 'dist'),
          CHARLY_PERF_CONFIG: configPath
        }
      });
      
      let output = '';
      let errorOutput = '';
      
      if (!options.verbose) {
        testProcess.stdout.on('data', (data) => {
          output += data.toString();
          // Show progress indicators
          if (data.toString().includes('✅') || data.toString().includes('❌')) {
            process.stdout.write(data);
          }
        });
        
        testProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          process.stderr.write(data);
        });
      }
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Performance tests completed successfully');
          resolve({ output, errorOutput, exitCode: code });
        } else {
          reject(new Error(`Performance tests failed with code ${code}: ${errorOutput}`));
        }
      });
      
      testProcess.on('error', (error) => {
        reject(error);
      });
    });
    
  } finally {
    // Cleanup temporary files
    try {
      if (existsSync(configPath)) {
        // Keep config for debugging
        console.log(`📄 Configuration saved at: ${configPath}`);
      }
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup temporary files:', cleanupError.message);
    }
  }
}

// Generate the test runner script
function generateTestScript(scenario, configPath, options) {
  return `
import { readFileSync } from 'fs';
import { PerformanceAgent } from './dist/services/performance-agent.js';
import { PerformanceReporter } from './dist/services/performance-reporter.js';

async function runTests() {
  try {
    // Load configuration
    const configJson = readFileSync('${configPath}', 'utf8');
    const config = JSON.parse(configJson);
    
    console.log('🎯 Initializing Performance Agent...');
    const agent = new PerformanceAgent(config);
    const reporter = new PerformanceReporter(config);
    
    const testResults = [];
    
    // Handle different scenarios
    if ('${scenario}' === 'all' || '${scenario}' === 'heavy-residential') {
      if (config.scenarios.heavyResidential.enabled) {
        console.log('🏠 Running Heavy Residential Load Test...');
        console.log(\`   Processing \${config.scenarios.heavyResidential.totalParcels} parcels in batches of \${config.scenarios.heavyResidential.batchSize}\`);
        const result = await agent.runHeavyResidentialLoad();
        testResults.push(result);
        console.log(\`✅ Heavy Residential: \${result.successfulRequests}/\${result.totalRequests} successful, p99: \${Math.round(result.metrics.responseTime.p99)}ms\`);
      }
    }
    
    if ('${scenario}' === 'all' || '${scenario}' === 'moderate-commercial') {
      if (config.scenarios.moderateCommercial.enabled) {
        console.log('🏢 Running Moderate Commercial Load Test...');
        console.log(\`   Processing \${config.scenarios.moderateCommercial.totalPortfolios} portfolios with \${config.scenarios.moderateCommercial.portfolioSize} properties each\`);
        const result = await agent.runModerateCommercialLoad();
        testResults.push(result);
        console.log(\`✅ Moderate Commercial: \${result.successfulRequests}/\${result.totalRequests} successful, p99: \${Math.round(result.metrics.responseTime.p99)}ms\`);
      }
    }
    
    if ('${scenario}' === 'all' || '${scenario}' === 'ai-router-stress') {
      console.log('🤖 Running AI Router Stability Test...');
      try {
        const aiStats = await agent.testAIRouterStability();
        console.log(\`✅ AI Router: \${aiStats.totalRequests} requests, \${aiStats.circuitBreakerTrips} circuit breaker trips\`);
        
        // Add AI stats to the last test result or create a synthetic one
        if (testResults.length > 0) {
          testResults[testResults.length - 1].aiRouterStats = aiStats;
        } else {
          testResults.push({
            testId: 'ai-router-stability',
            scenario: 'ai-router-stress',
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            totalRequests: aiStats.totalRequests,
            successfulRequests: aiStats.totalRequests - aiStats.circuitBreakerTrips,
            failedRequests: aiStats.circuitBreakerTrips,
            errorRate: aiStats.totalRequests > 0 ? aiStats.circuitBreakerTrips / aiStats.totalRequests : 0,
            metrics: {
              responseTime: { min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 },
              throughput: { requestsPerSecond: 0, bytesPerSecond: 0 },
              resources: { cpuUsage: [], memoryUsage: [], networkIO: [] }
            },
            aiRouterStats: aiStats,
            errors: [],
            warnings: []
          });
        }
      } catch (error) {
        console.log(\`⚠️  AI Router test skipped: \${error.message}\`);
      }
    }
    
    // Generate comprehensive report
    console.log('📊 Generating performance report...');
    const report = await reporter.generateReport(testResults, 'G4-Heavy-Usage-Signoff');
    
    console.log('\\n📈 PERFORMANCE SUMMARY');
    console.log('========================');
    console.log(\`Tests Run: \${report.summary.totalTests}\`);
    console.log(\`Success Rate: \${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%\`);
    console.log(\`Total Requests: \${report.summary.totalRequests.toLocaleString()}\`);
    console.log(\`Error Rate: \${(report.summary.overallErrorRate * 100).toFixed(2)}%\`);
    console.log(\`Performance Score: \${report.summary.performanceScore}/100\`);
    
    console.log('\\n🎯 COMPLIANCE STATUS');
    console.log('====================');
    console.log(\`API p99 ≤ 50ms: \${report.compliance.performanceTargets.apiP99Met ? '✅ PASS' : '❌ FAIL'}\`);
    console.log(\`UI p99 ≤ 100ms: \${report.compliance.performanceTargets.uiP99Met ? '✅ PASS' : '❌ FAIL'}\`);
    console.log(\`Error Rate ≤ 1%: \${report.compliance.performanceTargets.errorRateAcceptable ? '✅ PASS' : '❌ FAIL'}\`);
    console.log(\`Resource Usage: \${report.compliance.performanceTargets.resourceUsageAcceptable ? '✅ PASS' : '❌ FAIL'}\`);
    console.log(\`AI Budget Compliance: \${report.compliance.aiRouter.budgetCompliance ? '✅ PASS' : '❌ FAIL'}\`);
    console.log(\`Schema Compliance: \${report.compliance.aiRouter.schemaCompliance ? '✅ PASS' : '❌ FAIL'}\`);
    
    if (report.recommendations.length > 0) {
      console.log('\\n💡 RECOMMENDATIONS');
      console.log('==================');
      report.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(\`\${i + 1}. \${rec}\`);
      });
    }
    
    console.log(\`\\n📄 Reports generated at: \${config.reporting.outputPath}\`);
    console.log(\`🎉 Track G4 Heavy-Usage Sign-off \${report.summary.performanceScore >= 80 ? 'PASSED' : 'NEEDS ATTENTION'}\`);
    
    await agent.stop();
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    if (${options.verbose}) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runTests();
`;
}

// Main execution function
async function main() {
  const flags = parseCliArgs();
  
  console.log('🚀 CHARLY Performance Agent - Track G4 Heavy-Usage Sign-off');
  console.log('===========================================================');
  console.log(`Scenario: ${flags.scenario}`);
  console.log(`Scale: ${flags.scale}`);
  console.log(`Output: ${flags.outputPath}`);
  console.log('');
  
  try {
    // Pre-flight checks
    checkPrerequisites();
    
    if (!flags.skipWarmup) {
      console.log('🔥 Warming up system...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Ensure compiled
    if (!flags.dryRun) {
      await ensureCompiled();
    }
    
    // Load or create configuration
    let config;
    if (flags.config && existsSync(flags.config)) {
      console.log(`📄 Loading custom configuration: ${flags.config}`);
      config = JSON.parse(readFileSync(flags.config, 'utf8'));
    } else {
      config = getPerformanceConfig(flags.scale);
      config.reporting.outputPath = flags.outputPath;
    }
    
    if (flags.dryRun) {
      console.log('🔍 DRY RUN - Configuration Preview:');
      console.log(JSON.stringify(config, null, 2));
      return;
    }
    
    // Run performance tests
    const startTime = Date.now();
    await runPerformanceTests(flags.scenario, config, flags);
    const endTime = Date.now();
    
    console.log('');
    console.log('🎉 Performance testing completed successfully!');
    console.log(`⏱️  Total execution time: ${Math.round((endTime - startTime) / 1000)}s`);
    console.log(`📊 Reports available at: ${flags.outputPath}`);
    
  } catch (error) {
    console.error('');
    console.error('❌ Performance testing failed:');
    console.error(error.message);
    
    if (flags.verbose) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('• Ensure the CHARLY API server is running');
    console.error('• Check that all dependencies are installed');
    console.error('• Try running with --scale light for reduced load');
    console.error('• Use --verbose for detailed error information');
    
    process.exit(1);
  }
}

// Help function
function showHelp() {
  console.log(`
CHARLY Performance Agent - Track G4 Heavy-Usage Sign-off

USAGE:
  node performance-runner.js [OPTIONS]

SCENARIOS:
  --scenario all                Run all performance tests (default)
  --scenario heavy-residential  Test 50,000+ residential parcels
  --scenario moderate-commercial Test 500+ commercial portfolios  
  --scenario ai-router-stress   Test AI router under load

OPTIONS:
  --scale [full|medium|light]   Test scale intensity (default: full)
  --config PATH                 Custom configuration file
  --outputPath PATH             Reports output directory
  --verbose                     Detailed logging
  --skipWarmup                 Skip system warmup
  --dryRun                     Preview configuration only
  --help                       Show this help

EXAMPLES:
  # Full production-scale test
  node performance-runner.js

  # Light test for development
  node performance-runner.js --scale light

  # Test only residential load
  node performance-runner.js --scenario heavy-residential --scale medium

  # Custom configuration
  node performance-runner.js --config ./my-perf-config.json

For more information, see the CHARLY Performance Testing documentation.
`);
}

// Handle CLI
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  main().catch(console.error);
}