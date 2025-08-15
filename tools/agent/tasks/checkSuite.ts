#!/usr/bin/env node

/**
 * CHARLY Agent Check Suite Task
 * 
 * Runs comprehensive quality checks and emits JSON results.
 * SAFE MODE: Read-only operations only.
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface CheckSuiteResult {
  success: boolean;
  timestamp: string;
  executionTime: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  checks: CheckResult[];
  metadata: {
    mode: 'safe' | 'active';
    agent: string;
    version: string;
  };
}

export interface CheckResult {
  name: string;
  type: 'test' | 'lint' | 'build' | 'security' | 'custom';
  success: boolean;
  message: string;
  executionTime: number;
  output?: string;
  error?: string;
}

export class CheckSuite {
  private startTime: number;
  private results: CheckResult[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  private async runCheck(
    name: string,
    type: CheckResult['type'],
    command: string,
    options?: { timeout?: number; skipOnError?: boolean }
  ): Promise<CheckResult> {
    const checkStart = Date.now();
    
    try {
      console.log(`🔍 Running ${name}...`);
      
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: options?.timeout || 120000,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const executionTime = Date.now() - checkStart;
      
      const result: CheckResult = {
        name,
        type,
        success: true,
        message: `${name} completed successfully`,
        executionTime,
        output: output.toString()
      };

      console.log(`✅ ${name} passed (${executionTime}ms)`);
      return result;

    } catch (error) {
      const executionTime = Date.now() - checkStart;
      
      const result: CheckResult = {
        name,
        type,
        success: false,
        message: `${name} failed: ${error.message}`,
        executionTime,
        error: error.message
      };

      if (options?.skipOnError) {
        console.log(`⚠️  ${name} failed but continuing (${executionTime}ms)`);
      } else {
        console.log(`❌ ${name} failed (${executionTime}ms)`);
      }
      
      return result;
    }
  }

  async runLinting(): Promise<CheckResult> {
    // Try common linting commands
    const lintCommands = [
      'npm run lint',
      'npx eslint .',
      'yarn lint',
      'pnpm run lint'
    ];

    for (const command of lintCommands) {
      try {
        return await this.runCheck('ESLint', 'lint', command, { skipOnError: true });
      } catch (error) {
        // Try next command
        continue;
      }
    }

    return {
      name: 'ESLint',
      type: 'lint',
      success: false,
      message: 'No lint command found or configured',
      executionTime: 0
    };
  }

  async runTests(): Promise<CheckResult> {
    // Try common test commands
    const testCommands = [
      'npm test',
      'npm run test',
      'yarn test',
      'pnpm test',
      'pnpm run test'
    ];

    for (const command of testCommands) {
      try {
        return await this.runCheck('Test Suite', 'test', command);
      } catch (error) {
        // Try next command
        continue;
      }
    }

    return {
      name: 'Test Suite',
      type: 'test',
      success: false,
      message: 'No test command found or configured',
      executionTime: 0
    };
  }

  async runBuild(): Promise<CheckResult> {
    // Try common build commands
    const buildCommands = [
      'npm run build',
      'yarn build',
      'pnpm run build',
      'npx tsc'
    ];

    for (const command of buildCommands) {
      try {
        return await this.runCheck('Build', 'build', command, { skipOnError: true });
      } catch (error) {
        // Try next command
        continue;
      }
    }

    return {
      name: 'Build',
      type: 'build',
      success: false,
      message: 'No build command found or configured',
      executionTime: 0
    };
  }

  async runSecurityScan(): Promise<CheckResult> {
    // Try security commands
    const securityCommands = [
      'npm run security:scan',
      'pnpm run security:scan',
      'npm audit --audit-level high',
      'yarn audit --level high'
    ];

    for (const command of securityCommands) {
      try {
        return await this.runCheck('Security Scan', 'security', command, { skipOnError: true });
      } catch (error) {
        // Try next command
        continue;
      }
    }

    return {
      name: 'Security Scan',
      type: 'security',
      success: false,
      message: 'No security scan command found or configured',
      executionTime: 0
    };
  }

  async runAll(): Promise<CheckSuiteResult> {
    console.log('🚀 Starting CHARLY Agent Check Suite (SAFE MODE)');
    console.log('📋 Running read-only quality checks...');
    
    // Run all checks
    this.results.push(await this.runTests());
    this.results.push(await this.runLinting());
    this.results.push(await this.runBuild());
    this.results.push(await this.runSecurityScan());

    // Calculate summary
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const skipped = 0; // No skipped checks in current implementation

    const totalExecutionTime = Date.now() - this.startTime;
    
    const result: CheckSuiteResult = {
      success: failed === 0,
      timestamp: new Date().toISOString(),
      executionTime: totalExecutionTime,
      summary: {
        total,
        passed,
        failed,
        skipped
      },
      checks: this.results,
      metadata: {
        mode: 'safe',
        agent: 'charly-build-agent',
        version: '1.0.0'
      }
    };

    // Output results
    console.log('\\n📊 Check Suite Results:');
    console.log(`   Total: ${total}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Duration: ${totalExecutionTime}ms`);

    // Save results to file
    await this.saveResults(result);

    return result;
  }

  private async saveResults(result: CheckSuiteResult): Promise<void> {
    try {
      const outputDir = join(process.cwd(), 'reports', 'agent');
      mkdirSync(outputDir, { recursive: true });
      
      const outputFile = join(outputDir, 'check-suite-results.json');
      writeFileSync(outputFile, JSON.stringify(result, null, 2));
      
      console.log(`📄 Results saved to: ${outputFile}`);
    } catch (error) {
      console.error(`⚠️  Failed to save results: ${error.message}`);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new CheckSuite();
  suite.runAll()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Check suite failed:', error);
      process.exit(1);
    });
}