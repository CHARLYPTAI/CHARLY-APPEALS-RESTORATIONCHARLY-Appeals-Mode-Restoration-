#!/usr/bin/env node

/**
 * Simple contract validation test for agent tasks
 * Tests JSON structure without requiring vitest
 */

// Simple assert function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function validateCheckResult(checkResult) {
  assert(typeof checkResult === 'object', 'CheckResult must be an object');
  assert(typeof checkResult.name === 'string', 'CheckResult.name must be a string');
  assert(['test', 'lint', 'build', 'security', 'custom'].includes(checkResult.type), 'CheckResult.type must be valid');
  assert(typeof checkResult.success === 'boolean', 'CheckResult.success must be a boolean');
  assert(typeof checkResult.message === 'string', 'CheckResult.message must be a string');
  assert(typeof checkResult.executionTime === 'number', 'CheckResult.executionTime must be a number');
  assert(checkResult.executionTime >= 0, 'CheckResult.executionTime must be non-negative');
  
  if (checkResult.output !== undefined) {
    assert(typeof checkResult.output === 'string', 'CheckResult.output must be a string if present');
  }
  
  if (checkResult.error !== undefined) {
    assert(typeof checkResult.error === 'string', 'CheckResult.error must be a string if present');
  }
}

function validateCheckSuiteResult(result) {
  assert(typeof result === 'object', 'CheckSuiteResult must be an object');
  assert(typeof result.success === 'boolean', 'CheckSuiteResult.success must be a boolean');
  assert(typeof result.timestamp === 'string', 'CheckSuiteResult.timestamp must be a string');
  assert(typeof result.executionTime === 'number', 'CheckSuiteResult.executionTime must be a number');
  assert(result.executionTime >= 0, 'CheckSuiteResult.executionTime must be non-negative');
  
  // Validate timestamp is valid ISO string
  const date = new Date(result.timestamp);
  assert(!isNaN(date.getTime()), 'CheckSuiteResult.timestamp must be valid ISO string');
  
  // Validate summary
  assert(typeof result.summary === 'object', 'CheckSuiteResult.summary must be an object');
  assert(typeof result.summary.total === 'number', 'summary.total must be a number');
  assert(typeof result.summary.passed === 'number', 'summary.passed must be a number');
  assert(typeof result.summary.failed === 'number', 'summary.failed must be a number');
  assert(typeof result.summary.skipped === 'number', 'summary.skipped must be a number');
  
  // Validate summary math
  const { total, passed, failed, skipped } = result.summary;
  assert(total === passed + failed + skipped, 'summary totals must add up correctly');
  
  // Validate checks array
  assert(Array.isArray(result.checks), 'CheckSuiteResult.checks must be an array');
  result.checks.forEach((check, index) => {
    try {
      validateCheckResult(check);
    } catch (error) {
      throw new Error(`Check ${index} validation failed: ${error.message}`);
    }
  });
  
  // Validate metadata
  assert(typeof result.metadata === 'object', 'CheckSuiteResult.metadata must be an object');
  assert(typeof result.metadata.mode === 'string', 'metadata.mode must be a string');
  assert(['safe', 'active'].includes(result.metadata.mode), 'metadata.mode must be safe or active');
  assert(typeof result.metadata.agent === 'string', 'metadata.agent must be a string');
  assert(typeof result.metadata.version === 'string', 'metadata.version must be a string');
  assert(result.metadata.version.match(/^\d+\.\d+\.\d+$/), 'metadata.version must be semver format');
}

function runTests() {
  console.log('🧪 Running agent contract validation tests...');
  
  try {
    // Test 1: Valid CheckResult structure
    console.log('Testing CheckResult structure...');
    const validCheckResult = {
      name: 'Test Check',
      type: 'test',
      success: true,
      message: 'Check completed successfully',
      executionTime: 1000,
      output: 'mock output'
    };
    validateCheckResult(validCheckResult);
    console.log('✅ CheckResult structure validation passed');
    
    // Test 2: Failed CheckResult structure
    console.log('Testing failed CheckResult structure...');
    const failedCheckResult = {
      name: 'Failed Check',
      type: 'lint',
      success: false,
      message: 'Check failed',
      executionTime: 500,
      error: 'Mock error'
    };
    validateCheckResult(failedCheckResult);
    console.log('✅ Failed CheckResult structure validation passed');
    
    // Test 3: Complete CheckSuiteResult structure
    console.log('Testing CheckSuiteResult structure...');
    const validSuiteResult = {
      success: true,
      timestamp: new Date().toISOString(),
      executionTime: 2000,
      summary: {
        total: 2,
        passed: 1,
        failed: 1,
        skipped: 0
      },
      checks: [validCheckResult, failedCheckResult],
      metadata: {
        mode: 'safe',
        agent: 'charly-build-agent',
        version: '1.0.0'
      }
    };
    validateCheckSuiteResult(validSuiteResult);
    console.log('✅ CheckSuiteResult structure validation passed');
    
    // Test 4: Ensure safe mode is enforced
    console.log('Testing safety constraints...');
    assert(validSuiteResult.metadata.mode === 'safe', 'Agent must operate in safe mode');
    console.log('✅ Safety constraints validation passed');
    
    console.log('\\n🎉 All agent contract tests passed!');
    return true;
    
  } catch (error) {
    console.error(`\\n❌ Test failed: ${error.message}`);
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { runTests, validateCheckResult, validateCheckSuiteResult };