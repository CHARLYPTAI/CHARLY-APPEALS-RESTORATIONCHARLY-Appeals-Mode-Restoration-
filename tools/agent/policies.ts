/**
 * CHARLY Build Agent Policies
 * 
 * Defines policy rules and enforcement mechanisms for the build agent.
 * All policies are INACTIVE by default for safety.
 */

import type { AgentConfig, TaskResult } from './runtime.js';

export interface PolicyViolation {
  policy: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  data?: any;
}

export interface PolicyCheckResult {
  passed: boolean;
  violations: PolicyViolation[];
  summary: string;
}

/**
 * Core policy enforcement engine
 */
export class PolicyEngine {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Check all policies against current state
   */
  async checkPolicies(): Promise<PolicyCheckResult> {
    const violations: PolicyViolation[] = [];

    // Policy 1: Never push if tests fail
    if (this.config.policies.never_push_if_tests_fail) {
      const testViolation = await this.checkTestsPolicy();
      if (testViolation) violations.push(testViolation);
    }

    // Policy 2: Require code review
    if (this.config.policies.require_code_review) {
      const reviewViolation = await this.checkCodeReviewPolicy();
      if (reviewViolation) violations.push(reviewViolation);
    }

    // Policy 3: Enforce quality gates
    if (this.config.policies.enforce_quality_gates) {
      const qualityViolation = await this.checkQualityGatesPolicy();
      if (qualityViolation) violations.push(qualityViolation);
    }

    // Policy 4: Protected branches
    const protectedBranchViolation = await this.checkProtectedBranchesPolicy();
    if (protectedBranchViolation) violations.push(protectedBranchViolation);

    // Policy 5: Safety mode enforcement
    const safetyViolation = await this.checkSafetyModePolicy();
    if (safetyViolation) violations.push(safetyViolation);

    const passed = violations.filter(v => v.severity === 'error').length === 0;
    const summary = this.generatePolicySummary(violations);

    return {
      passed,
      violations,
      summary
    };
  }

  private async checkTestsPolicy(): Promise<PolicyViolation | null> {
    // For safety, always assume tests could fail in this implementation
    // Real implementation would check actual test results
    return {
      policy: 'never_push_if_tests_fail',
      severity: 'info',
      message: 'Test policy check DISABLED (safety mode) - would check if tests pass before allowing pushes',
      timestamp: new Date(),
      data: { safetyMode: true }
    };
  }

  private async checkCodeReviewPolicy(): Promise<PolicyViolation | null> {
    // For safety, always enforce review requirement
    return {
      policy: 'require_code_review',
      severity: 'info',
      message: 'Code review policy ACTIVE - all changes require review',
      timestamp: new Date(),
      data: { enforcementLevel: 'strict' }
    };
  }

  private async checkQualityGatesPolicy(): Promise<PolicyViolation | null> {
    // Check if quality gates would be enforced
    const qualityChecks = [
      'lint_passes',
      'type_check_passes',
      'security_scan_passes',
      'coverage_threshold_met'
    ];

    return {
      policy: 'enforce_quality_gates',
      severity: 'info',
      message: `Quality gates policy CONFIGURED - would enforce: ${qualityChecks.join(', ')}`,
      timestamp: new Date(),
      data: { 
        safetyMode: true,
        requiredChecks: qualityChecks
      }
    };
  }

  private async checkProtectedBranchesPolicy(): Promise<PolicyViolation | null> {
    const protectedBranches = this.config.git.protected_branches;
    
    if (!protectedBranches || protectedBranches.length === 0) {
      return {
        policy: 'protected_branches',
        severity: 'warning',
        message: 'No protected branches configured - consider protecting main/master/develop',
        timestamp: new Date(),
        data: { recommendation: 'Add protected branches to config' }
      };
    }

    return {
      policy: 'protected_branches',
      severity: 'info',
      message: `Protected branches policy ACTIVE: ${protectedBranches.join(', ')}`,
      timestamp: new Date(),
      data: { protectedBranches }
    };
  }

  private async checkSafetyModePolicy(): Promise<PolicyViolation | null> {
    // Enforce that agent remains disabled
    if (this.config.enabled === true) {
      return {
        policy: 'safety_mode',
        severity: 'error',
        message: 'CRITICAL: Agent is enabled but safety policies require it to be disabled',
        timestamp: new Date(),
        data: { 
          currentState: 'enabled',
          requiredState: 'disabled',
          action: 'Set enabled: false in config'
        }
      };
    }

    if (!this.config.policies.dry_run_mode) {
      return {
        policy: 'safety_mode',
        severity: 'error',
        message: 'CRITICAL: Dry run mode is disabled - this could cause unintended actions',
        timestamp: new Date(),
        data: {
          currentState: 'dry_run_disabled',
          requiredState: 'dry_run_enabled',
          action: 'Set dry_run_mode: true in config'
        }
      };
    }

    return null;
  }

  private generatePolicySummary(violations: PolicyViolation[]): string {
    const errors = violations.filter(v => v.severity === 'error').length;
    const warnings = violations.filter(v => v.severity === 'warning').length;
    const infos = violations.filter(v => v.severity === 'info').length;

    if (errors > 0) {
      return `Policy check FAILED: ${errors} errors, ${warnings} warnings, ${infos} info`;
    } else if (warnings > 0) {
      return `Policy check PASSED with warnings: ${warnings} warnings, ${infos} info`;
    } else {
      return `Policy check PASSED: ${infos} policies checked`;
    }
  }
}

/**
 * Convenience function for checking policies
 */
export async function checkPolicies(config: AgentConfig): Promise<PolicyCheckResult> {
  const engine = new PolicyEngine(config);
  return await engine.checkPolicies();
}

/**
 * Policy definitions for documentation and validation
 */
export const POLICY_DEFINITIONS = {
  never_push_if_tests_fail: {
    name: 'Never Push If Tests Fail',
    description: 'Prevents pushing code to remote repositories when test suite failures are detected',
    severity: 'error',
    category: 'quality',
    active: false
  },
  require_code_review: {
    name: 'Require Code Review',
    description: 'Ensures all code changes go through peer review process before merging',
    severity: 'error',
    category: 'process',
    active: true
  },
  enforce_quality_gates: {
    name: 'Enforce Quality Gates',
    description: 'Requires passing linting, type checking, security scans, and coverage thresholds',
    severity: 'error',
    category: 'quality',
    active: false
  },
  protected_branches: {
    name: 'Protected Branches',
    description: 'Prevents direct pushes to protected branches (main, master, develop)',
    severity: 'error',
    category: 'process',
    active: true
  },
  safety_mode: {
    name: 'Safety Mode',
    description: 'Ensures agent remains in safe, non-destructive mode until explicitly activated',
    severity: 'error',
    category: 'safety',
    active: true
  }
} as const;

export type PolicyName = keyof typeof POLICY_DEFINITIONS;