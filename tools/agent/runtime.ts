/**
 * CHARLY Build Agent Runtime
 * 
 * ⚠️ WARNING: This agent is INACTIVE by default for safety.
 * Do not enable without proper configuration and testing.
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { AgentConfig, TaskResult, RuntimeContext } from './types.js';
import { checkPolicies } from './policies.js';

export class AgentRuntime {
  private config: AgentConfig;
  private context: RuntimeContext;

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
    this.context = {
      startTime: new Date(),
      executionId: this.generateExecutionId(),
      isActive: false,
      safetyChecks: {
        configValid: false,
        testsPass: false,
        workspaceClean: false
      }
    };
  }

  private loadConfig(configPath?: string): AgentConfig {
    const defaultPath = join(process.cwd(), 'tools/agent/config.json');
    const examplePath = join(process.cwd(), 'tools/agent/config.example.json');
    
    const path = configPath || defaultPath;
    
    if (!existsSync(path)) {
      if (existsSync(examplePath)) {
        throw new Error(
          `Agent config not found at ${path}. ` +
          `Copy config.example.json to config.json and customize it.`
        );
      }
      throw new Error(`Agent config not found and no example available at ${path}`);
    }

    try {
      const config = JSON.parse(readFileSync(path, 'utf-8')) as AgentConfig;
      
      // Safety check: ensure agent is explicitly disabled by default
      if (!config.hasOwnProperty('enabled') || config.enabled !== false) {
        throw new Error(
          'Agent configuration must explicitly set "enabled": false for safety. ' +
          'This prevents accidental activation.'
        );
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to load agent config from ${path}: ${error.message}`);
    }
  }

  private generateExecutionId(): string {
    return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async ensureLogDirectory(): Promise<void> {
    const logDir = join(process.cwd(), 'tools/agent/logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      executionId: this.context.executionId,
      message,
      data
    };

    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    
    // TODO: Implement file logging when agent is activated
    // For now, we only log to console for safety
  }

  async validateSafetyChecks(): Promise<boolean> {
    this.log('info', 'Running safety checks...');

    // Check 1: Configuration validation
    this.context.safetyChecks.configValid = await this.validateConfig();
    
    // Check 2: Tests must pass
    this.context.safetyChecks.testsPass = await this.checkTestsPass();
    
    // Check 3: Workspace must be clean (if git operations enabled)
    this.context.safetyChecks.workspaceClean = await this.checkWorkspaceClean();

    const allChecksPass = Object.values(this.context.safetyChecks).every(Boolean);
    
    if (!allChecksPass) {
      this.log('error', 'Safety checks failed', this.context.safetyChecks);
      return false;
    }

    this.log('info', 'All safety checks passed');
    return true;
  }

  private async validateConfig(): Promise<boolean> {
    try {
      // Basic config structure validation
      const requiredFields = ['enabled', 'agent', 'runtime', 'policies', 'tasks'];
      for (const field of requiredFields) {
        if (!(field in this.config)) {
          this.log('error', `Missing required config field: ${field}`);
          return false;
        }
      }

      // Safety validation: agent must be explicitly disabled
      if (this.config.enabled === true) {
        this.log('error', 'Agent is enabled in config - this is not allowed for safety');
        return false;
      }

      return true;
    } catch (error) {
      this.log('error', 'Config validation failed', { error: error.message });
      return false;
    }
  }

  private async checkTestsPass(): Promise<boolean> {
    // For safety, always return false unless explicitly testing
    // In a real implementation, this would run the test suite
    this.log('info', 'Tests check: DISABLED (safety mode)');
    return false;
  }

  private async checkWorkspaceClean(): Promise<boolean> {
    // For safety, always return false unless explicitly configured
    // In a real implementation, this would check git status
    this.log('info', 'Workspace check: DISABLED (safety mode)');
    return false;
  }

  async run(): Promise<TaskResult[]> {
    this.log('info', `Agent runtime starting (ID: ${this.context.executionId})`);
    
    // Immediate safety check: agent must be disabled
    if (this.config.enabled) {
      const error = 'CRITICAL: Agent is enabled - this is not allowed in current implementation';
      this.log('error', error);
      throw new Error(error);
    }

    this.log('info', 'Agent is safely disabled - no operations will be performed');
    this.log('info', 'To enable agent functionality:');
    this.log('info', '1. Review all policies and configurations');
    this.log('info', '2. Complete thorough testing');
    this.log('info', '3. Update safety checks in runtime.ts');
    this.log('info', '4. Get team approval');
    this.log('info', '5. Only then set enabled: true in config');

    return [{
      task: 'safety-check',
      success: true,
      message: 'Agent safely disabled - no operations performed',
      timestamp: new Date(),
      executionTime: 0,
      data: {
        safetyMode: true,
        configEnabled: this.config.enabled,
        safeguards: 'active'
      }
    }];
  }

  getStatus(): RuntimeContext {
    return { ...this.context };
  }

  async stop(): Promise<void> {
    this.log('info', 'Agent runtime stopping');
    this.context.isActive = false;
  }
}

// Type definitions (would normally be in separate file)
export interface AgentConfig {
  enabled: boolean;
  agent: {
    name: string;
    version: string;
    description: string;
  };
  runtime: {
    enabled: boolean;
    interval: string;
    mode: string;
    max_execution_time_ms: number;
  };
  policies: {
    never_push_if_tests_fail: boolean;
    require_code_review: boolean;
    enforce_quality_gates: boolean;
    auto_fix_enabled: boolean;
    dry_run_mode: boolean;
  };
  tasks: {
    [key: string]: {
      enabled: boolean;
      [key: string]: any;
    };
  };
  git: {
    auto_commit: boolean;
    auto_push: boolean;
    require_clean_workspace: boolean;
    protected_branches: string[];
  };
  [key: string]: any;
}

export interface TaskResult {
  task: string;
  success: boolean;
  message: string;
  timestamp: Date;
  executionTime: number;
  data?: any;
}

export interface RuntimeContext {
  startTime: Date;
  executionId: string;
  isActive: boolean;
  safetyChecks: {
    configValid: boolean;
    testsPass: boolean;
    workspaceClean: boolean;
  };
}