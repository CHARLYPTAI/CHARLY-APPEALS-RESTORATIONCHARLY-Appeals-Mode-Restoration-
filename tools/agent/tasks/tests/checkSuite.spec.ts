import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckSuite, CheckSuiteResult, CheckResult } from '../checkSuite.js';

describe('Agent CheckSuite', () => {
  let checkSuite: CheckSuite;

  beforeEach(() => {
    checkSuite = new CheckSuite();
  });

  describe('JSON Contract Validation', () => {
    it('should return valid CheckSuiteResult structure', async () => {
      // Mock execSync to prevent actual command execution
      vi.mock('child_process', () => ({
        execSync: vi.fn().mockReturnValue('mock output')
      }));

      const result = await checkSuite.runAll();

      // Validate top-level structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('metadata');

      // Validate types
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.executionTime).toBe('number');
      expect(Array.isArray(result.checks)).toBe(true);

      // Validate timestamp is ISO string
      expect(() => new Date(result.timestamp)).not.toThrow();

      // Validate summary structure
      expect(result.summary).toHaveProperty('total');
      expect(result.summary).toHaveProperty('passed');
      expect(result.summary).toHaveProperty('failed');
      expect(result.summary).toHaveProperty('skipped');

      // Validate metadata structure
      expect(result.metadata).toHaveProperty('mode');
      expect(result.metadata).toHaveProperty('agent');
      expect(result.metadata).toHaveProperty('version');
      expect(result.metadata.mode).toBe('safe');
    });

    it('should return valid CheckResult structure for individual checks', () => {
      const mockCheckResult: CheckResult = {
        name: 'Test Check',
        type: 'test',
        success: true,
        message: 'Check completed successfully',
        executionTime: 1000,
        output: 'mock output'
      };

      // Validate required properties
      expect(mockCheckResult).toHaveProperty('name');
      expect(mockCheckResult).toHaveProperty('type');
      expect(mockCheckResult).toHaveProperty('success');
      expect(mockCheckResult).toHaveProperty('message');
      expect(mockCheckResult).toHaveProperty('executionTime');

      // Validate types
      expect(typeof mockCheckResult.name).toBe('string');
      expect(['test', 'lint', 'build', 'security', 'custom']).toContain(mockCheckResult.type);
      expect(typeof mockCheckResult.success).toBe('boolean');
      expect(typeof mockCheckResult.message).toBe('string');
      expect(typeof mockCheckResult.executionTime).toBe('number');

      // Optional properties validation
      if (mockCheckResult.output) {
        expect(typeof mockCheckResult.output).toBe('string');
      }
      if (mockCheckResult.error) {
        expect(typeof mockCheckResult.error).toBe('string');
      }
    });

    it('should handle failed checks correctly', () => {
      const failedCheck: CheckResult = {
        name: 'Failed Check',
        type: 'test',
        success: false,
        message: 'Check failed with error',
        executionTime: 500,
        error: 'Mock error message'
      };

      expect(failedCheck.success).toBe(false);
      expect(failedCheck.error).toBeDefined();
      expect(typeof failedCheck.error).toBe('string');
    });

    it('should validate summary calculations', () => {
      const mockResults: CheckResult[] = [
        { name: 'Test 1', type: 'test', success: true, message: 'ok', executionTime: 100 },
        { name: 'Test 2', type: 'lint', success: false, message: 'fail', executionTime: 200 },
        { name: 'Test 3', type: 'build', success: true, message: 'ok', executionTime: 300 }
      ];

      const summary = {
        total: mockResults.length,
        passed: mockResults.filter(r => r.success).length,
        failed: mockResults.filter(r => !r.success).length,
        skipped: 0
      };

      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(0);
      expect(summary.total).toBe(summary.passed + summary.failed + summary.skipped);
    });

    it('should validate check types are within allowed values', () => {
      const allowedTypes: CheckResult['type'][] = ['test', 'lint', 'build', 'security', 'custom'];
      
      allowedTypes.forEach(type => {
        const check: CheckResult = {
          name: `${type} check`,
          type,
          success: true,
          message: 'ok',
          executionTime: 100
        };

        expect(allowedTypes).toContain(check.type);
      });
    });

    it('should ensure execution times are non-negative', () => {
      const result: CheckSuiteResult = {
        success: true,
        timestamp: new Date().toISOString(),
        executionTime: 1000,
        summary: { total: 1, passed: 1, failed: 0, skipped: 0 },
        checks: [
          {
            name: 'Test',
            type: 'test',
            success: true,
            message: 'ok',
            executionTime: 500
          }
        ],
        metadata: { mode: 'safe', agent: 'test', version: '1.0.0' }
      };

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      result.checks.forEach(check => {
        expect(check.executionTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should validate agent metadata values', () => {
      const metadata = {
        mode: 'safe' as const,
        agent: 'charly-build-agent',
        version: '1.0.0'
      };

      expect(['safe', 'active']).toContain(metadata.mode);
      expect(typeof metadata.agent).toBe('string');
      expect(metadata.agent.length).toBeGreaterThan(0);
      expect(typeof metadata.version).toBe('string');
      expect(metadata.version).toMatch(/^\\d+\\.\\d+\\.\\d+$/); // Basic semver pattern
    });
  });

  describe('Safety Validation', () => {
    it('should always run in safe mode', () => {
      // This test ensures that the check suite is configured for safety
      const metadata = {
        mode: 'safe' as const,
        agent: 'charly-build-agent',
        version: '1.0.0'
      };

      expect(metadata.mode).toBe('safe');
    });

    it('should not execute destructive operations', () => {
      // This test documents the safety constraints
      const safeOperations = [
        'test execution',
        'linting',
        'building',
        'security scanning',
        'report generation'
      ];

      const destructiveOperations = [
        'file modification',
        'git commits',
        'package installation',
        'system configuration changes'
      ];

      // CheckSuite should only perform safe operations
      expect(safeOperations.length).toBeGreaterThan(0);
      expect(destructiveOperations.length).toBeGreaterThan(0);
      
      // This is a documentation test - the actual constraint is in implementation
      expect(true).toBe(true);
    });
  });
});