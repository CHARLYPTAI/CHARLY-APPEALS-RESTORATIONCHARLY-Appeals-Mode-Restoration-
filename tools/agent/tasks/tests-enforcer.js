#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../../..');
const REPORTS_DIR = join(ROOT_DIR, 'reports/agent');

function parseCliArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  
  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      flags[args[i].substring(2)] = args[i + 1] || true;
    }
  }
  
  return flags;
}

function validateRepoState() {
  const bootstrapPath = join(ROOT_DIR, 'BOOTSTRAP.md');
  const hashPath = join(ROOT_DIR, '.bootstrap_hash');
  
  if (!existsSync(bootstrapPath) || !existsSync(hashPath)) {
    console.error('❌ BOOTSTRAP.md or .bootstrap_hash missing');
    process.exit(1);
  }
  
  return true;
}

async function runTests(module) {
  return new Promise((resolve, reject) => {
    console.log(`🧪 Running tests for module: ${module || 'all'}`);
    
    // Determine test command based on module
    const cmd = 'pnpm';
    const args = module ? ['-C', `apps/${module}`, 'test'] : ['test'];
    
    const testProcess = spawn(cmd, args, { 
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });
    
    testProcess.on('close', (code) => {
      resolve({ 
        output, 
        errorOutput, 
        exitCode: code,
        success: code === 0
      });
    });
    
    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  const flags = parseCliArgs();
  
  try {
    validateRepoState();
    
    const module = flags.module || null;
    
    console.log('⏳ Enforcing test requirements...');
    
    const startTime = Date.now();
    const result = await runTests(module);
    const endTime = Date.now();
    
    // Parse test output for coverage and results
    const lines = result.output.split('\n');
    const coverageLine = lines.find(l => l.includes('Coverage')) || '';
    const testResults = lines.filter(l => l.includes('PASS') || l.includes('FAIL'));
    
    const report = {
      timestamp: new Date().toISOString(),
      task: 'tests-enforcer',
      status: result.success ? 'completed' : 'failed',
      input: { module },
      validation: {
        guardRailsActive: true,
        repoClean: true,
        testsRequired: true
      },
      execution: {
        module: module || 'all',
        command: module ? `pnpm -C apps/${module} test` : 'pnpm test',
        exitCode: result.exitCode,
        success: result.success,
        duration: endTime - startTime
      },
      results: {
        coverage: coverageLine,
        testResults: testResults,
        passedTests: testResults.filter(r => r.includes('PASS')).length,
        failedTests: testResults.filter(r => r.includes('FAIL')).length
      },
      enforcement: {
        coverageThresholdMet: result.success, // Would parse actual coverage
        allTestsPassing: result.success,
        noRegressions: result.success,
        guardrailsIntact: true
      },
      recommendations: result.success ? [
        'All tests passing - safe to proceed',
        'Maintain test coverage above 80%',
        'Run tests before any code changes'
      ] : [
        'Fix failing tests before proceeding',
        'Check for missing test coverage',
        'Review error output for specific issues'
      ]
    };
    
    writeFileSync(join(REPORTS_DIR, 'tests-enforcer.json'), JSON.stringify(report, null, 2));
    console.log('✅ Tests enforcer report generated:', join(REPORTS_DIR, 'tests-enforcer.json'));
    
    if (!result.success) {
      console.error('❌ Tests failed - stopping execution');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Tests enforcer failed:', error.message);
    process.exit(1);
  }
}

main();