# CHARLY Performance Agent - Track G4 Heavy-Usage Sign-off

## Overview

The CHARLY Performance Agent is a comprehensive testing framework designed to validate the platform's performance under heavy load scenarios for Track G4 — Heavy-Usage Sign-off. It simulates realistic property tax appeal workflows at scale while monitoring performance metrics, AI router stability, and system compliance.

## Key Features

### 🏠 Heavy Residential Load Testing
- **Scale**: 50,000+ residential parcels in batch processing
- **Concurrency**: Configurable concurrent batch processing
- **Workflow**: Complete property tax appeal pipeline simulation
- **Target**: p99 < 50ms for API calls

### 🏢 Moderate Commercial Load Testing  
- **Scale**: 500+ commercial parcels in portfolio runs
- **Complexity**: Multiple valuation approaches (Income, Sales, Cost)
- **AI Integration**: Heavy AI router usage for document analysis
- **Workflow**: Complex multi-step commercial appeal process

### 🤖 AI Router Stability Testing
- **Budget Enforcement**: Validates spending limits and budget compliance
- **Schema Compliance**: Tests structured output validation under load
- **Circuit Breaker**: Verifies stability mechanisms under stress
- **PII Redaction**: Ensures data privacy under concurrent requests

### 📊 Performance Metrics Collection
- **Response Times**: min, max, mean, p50, p95, p99 latencies
- **Throughput**: requests/second, data transfer rates
- **Resource Usage**: CPU, memory, network I/O monitoring
- **Error Tracking**: Comprehensive error categorization and reporting

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Agent Core                      │
├─────────────────────────────────────────────────────────────────┤
│  PerformanceAgent                                              │
│  ├─ Heavy Residential Simulator                               │
│  ├─ Moderate Commercial Simulator                             │
│  ├─ AI Router Stability Tester                               │
│  └─ Metrics Collector                                         │
├─────────────────────────────────────────────────────────────────┤
│  WorkflowSimulator                                             │
│  ├─ Residential Appeal Workflow (10 steps)                    │
│  ├─ Commercial Appeal Workflow (14 steps)                     │
│  ├─ Realistic Timing Simulation                               │
│  └─ Error/Warning Generation                                   │
├─────────────────────────────────────────────────────────────────┤
│  PerformanceReporter                                           │
│  ├─ JSON Report Generation                                     │
│  ├─ HTML Dashboard Generation                                  │
│  ├─ Compliance Validation                                      │
│  └─ Recommendation Engine                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow Simulations

### Residential Property Tax Appeal Workflow
1. **Property Validation** (25ms avg)
2. **Ownership Verification** (35ms avg)
3. **Assessment Data Retrieval** (45ms avg)
4. **Comparable Sales Analysis** (120ms avg, AI-intensive)
5. **Property Condition Assessment** (80ms avg, AI-intensive)
6. **Valuation Calculation** (60ms avg, AI-intensive)
7. **Appeal Strength Analysis** (90ms avg, AI-intensive)
8. **Document Generation** (150ms avg, AI-intensive)
9. **Compliance Check** (40ms avg)
10. **Final Review** (30ms avg)

**Total Average Duration**: ~675ms per property

### Commercial Property Tax Appeal Workflow
1. **Property Validation** (40ms avg)
2. **Ownership Verification** (60ms avg)
3. **Assessment Data Retrieval** (80ms avg)
4. **Financial Document Analysis** (250ms avg, AI-intensive)
5. **Income Approach Valuation** (180ms avg, AI-intensive)
6. **Sales Comparison Analysis** (200ms avg, AI-intensive)
7. **Cost Approach Analysis** (160ms avg, AI-intensive)
8. **Market Trend Analysis** (140ms avg, AI-intensive)
9. **Reconciliation Analysis** (120ms avg, AI-intensive)
10. **Appeal Strength Analysis** (110ms avg, AI-intensive)
11. **Narrative Report Generation** (300ms avg, AI-intensive)
12. **Supporting Documentation** (180ms avg)
13. **Legal Compliance Review** (90ms avg, AI-intensive)
14. **Final Review and Approval** (60ms avg)

**Total Average Duration**: ~1,970ms per property

## Usage

### Quick Start

```bash
# Run all performance tests with full scale
cd apps/api
npm run perf:full

# Run light-scale tests for development
npm run perf:light

# Run specific scenario tests
npm run perf:residential
npm run perf:commercial
npm run perf:ai

# Run via test suite
npm run test:g4
npm run test:perf
```

### Standalone Script Usage

```bash
# Navigate to tools directory
cd tools

# Run all scenarios with full production scale
node performance-runner.js

# Run with custom scale
node performance-runner.js --scale medium
node performance-runner.js --scale light

# Run specific scenarios
node performance-runner.js --scenario heavy-residential
node performance-runner.js --scenario moderate-commercial
node performance-runner.js --scenario ai-router-stress

# Use custom configuration
node performance-runner.js --config ./my-config.json

# Dry run to preview configuration
node performance-runner.js --dryRun --verbose

# Show help
node performance-runner.js --help
```

### Configuration Scales

#### Full Scale (Production-like)
- **Residential**: 50,000 parcels, 15 concurrent batches
- **Commercial**: 500 properties (20 portfolios of 25), 8 concurrent portfolios
- **Duration**: 12 minutes total (1m ramp + 10m sustained + 1m ramp down)
- **AI Budget**: $50.00 test budget

#### Medium Scale (Staging)
- **Residential**: 10,000 parcels, 8 concurrent batches
- **Commercial**: 150 properties (10 portfolios of 15), 4 concurrent portfolios
- **Duration**: 4 minutes total
- **AI Budget**: $20.00 test budget

#### Light Scale (Development)
- **Residential**: 2,000 parcels, 4 concurrent batches
- **Commercial**: 50 properties (5 portfolios of 10), 2 concurrent portfolios
- **Duration**: 1.5 minutes total
- **AI Budget**: $5.00 test budget

## Performance Targets

### API Performance
- **p99 Latency**: ≤ 50ms
- **p95 Latency**: ≤ 30ms  
- **Mean Latency**: ≤ 20ms
- **Error Rate**: ≤ 1%

### UI Performance
- **p99 Latency**: ≤ 100ms
- **p95 Latency**: ≤ 60ms
- **Interactive Response**: ≤ 16ms (60fps)

### Resource Usage
- **CPU**: ≤ 80% average
- **Memory**: ≤ 1GB peak usage
- **Network**: Efficient bandwidth utilization

### AI Router Compliance
- **Budget Compliance**: No budget overruns
- **Schema Validation**: ≥ 95% success rate
- **Circuit Breaker**: 0 trips under normal load
- **PII Redaction**: 100% active scanning

## Report Generation

The Performance Agent generates comprehensive reports in both JSON and HTML formats:

### JSON Report Structure
```json
{
  "id": "perf-report-1703123456789",
  "timestamp": "2024-12-21T10:30:00.000Z",
  "testSuite": "G4-Heavy-Usage-Signoff",
  "summary": {
    "totalTests": 2,
    "passedTests": 2,
    "failedTests": 0,
    "totalRequests": 50500,
    "overallErrorRate": 0.003,
    "performanceScore": 87
  },
  "compliance": {
    "performanceTargets": {
      "uiP99Met": true,
      "apiP99Met": true,
      "errorRateAcceptable": true,
      "resourceUsageAcceptable": true
    },
    "aiRouter": {
      "budgetCompliance": true,
      "schemaCompliance": true,
      "stabilityUnderLoad": true
    }
  },
  "recommendations": [
    "Monitor p95/p99 latency under sustained load",
    "Consider implementing horizontal scaling strategies"
  ]
}
```

### HTML Dashboard

The HTML report provides:
- **Performance Summary Dashboard**
- **Interactive Compliance Status**
- **Detailed Test Results Table**
- **Resource Usage Charts** (when enabled)
- **Actionable Recommendations**
- **System Information**

## Integration

### With Existing Test Suite

```typescript
import { PerformanceAgent, defaultPerformanceConfig } from '../services/performance-agent.js';

// In your test files
const agent = new PerformanceAgent(config);
const result = await agent.runHeavyResidentialLoad();
expect(result.metrics.responseTime.p99).toBeLessThanOrEqual(50);
```

### With CI/CD Pipelines

```yaml
# .github/workflows/performance.yml
name: Performance Testing
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run perf:medium
      - uses: actions/upload-artifact@v4
        with:
          name: performance-reports
          path: reports/performance/
```

### Monitoring Integration

```bash
# Export metrics to monitoring systems
node performance-runner.js --scale light | grep "Performance Score" | \
  awk '{print "performance.score " $3}' | nc graphite.example.com 2003
```

## Error Handling

The Performance Agent includes comprehensive error handling:

### Workflow Errors
- **Transient Failures**: Automatic retry with exponential backoff
- **Validation Errors**: Detailed error reporting with context
- **Timeout Handling**: Configurable timeouts with graceful degradation

### System Errors
- **Resource Exhaustion**: Graceful degradation and warning generation
- **Network Issues**: Circuit breaker patterns and fallback mechanisms
- **AI Router Failures**: Provider fallback and budget protection

### Recovery Mechanisms
- **Graceful Shutdown**: Clean termination of ongoing tests
- **State Preservation**: Test results saved even on partial failures
- **Resume Capability**: Ability to restart from checkpoints

## Troubleshooting

### Common Issues

#### High Latency Results
```bash
# Check system resources
npm run perf:light --verbose

# Review resource usage in reports
cat reports/performance/latest-report.json | jq '.summary.resourceUsageAcceptable'
```

#### AI Router Failures
```bash
# Test AI router connectivity
npm run perf:ai

# Check budget configuration
node -e "console.log(require('./config.json').aiRouter.budgetTestAmount)"
```

#### Memory Issues
```bash
# Run with reduced concurrency
node performance-runner.js --scale light --config reduced-concurrency.json
```

### Performance Regression Detection

```bash
# Compare with baseline
node performance-runner.js --scale medium > current-results.txt
diff baseline-results.txt current-results.txt
```

## Development

### Adding New Test Scenarios

```typescript
// Extend PerformanceAgent
class CustomPerformanceAgent extends PerformanceAgent {
  async runCustomScenario(): Promise<LoadTestResult> {
    // Implementation
  }
}
```

### Custom Workflow Steps

```typescript
// Extend WorkflowSimulator
const customWorkflow: WorkflowStep[] = [
  {
    name: 'custom_step',
    estimatedDurationMs: 100,
    errorProbability: 0.02,
    dependencies: [],
    isAIIntensive: true,
    isIOIntensive: false
  }
];
```

### Configuration Customization

```json
{
  "enabled": true,
  "scenarios": {
    "customScenario": {
      "enabled": true,
      "batchSize": 100,
      "totalItems": 1000,
      "concurrency": 5
    }
  },
  "metrics": {
    "customTargetMs": 75,
    "customThreshold": 0.05
  }
}
```

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-scenario`
3. **Add tests**: Ensure new scenarios include comprehensive tests
4. **Update documentation**: Include usage examples and configuration
5. **Submit pull request**: Include performance impact analysis

## Support

For issues and questions:
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this file and inline code comments
- **Performance Reports**: Review generated reports for debugging insights

---

*Track G4 — Heavy-Usage Sign-off | CHARLY Property Tax Appeal Platform*