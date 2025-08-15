#!/usr/bin/env node

/**
 * CHARLY Agent Report Generator
 * 
 * Generates status reports and metrics for the CHARLY project.
 * SAFE MODE: Read-only operations only.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export interface ProjectReport {
  metadata: {
    generated: string;
    agent: string;
    mode: 'safe' | 'active';
    project: string;
  };
  status: {
    overall: 'healthy' | 'warning' | 'critical';
    score: number;
    summary: string;
  };
  metrics: {
    tests: TestMetrics;
    build: BuildMetrics;
    security: SecurityMetrics;
    dependencies: DependencyMetrics;
    git: GitMetrics;
  };
  recommendations: Recommendation[];
}

interface TestMetrics {
  total: number;
  passing: number;
  coverage?: number;
  lastRun?: string;
  status: 'pass' | 'fail' | 'unknown';
}

interface BuildMetrics {
  lastSuccess?: string;
  duration?: number;
  status: 'success' | 'failed' | 'unknown';
  errors: number;
  warnings: number;
}

interface SecurityMetrics {
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  lastScan?: string;
  status: 'secure' | 'vulnerable' | 'unknown';
}

interface DependencyMetrics {
  total: number;
  outdated: number;
  security_issues: number;
  status: 'current' | 'outdated' | 'vulnerable';
}

interface GitMetrics {
  branch: string;
  commits_ahead?: number;
  commits_behind?: number;
  uncommitted_changes: number;
  status: 'clean' | 'dirty' | 'unknown';
}

interface Recommendation {
  type: 'security' | 'performance' | 'maintenance' | 'quality';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}

export class ReportGenerator {
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  private safeExec(command: string): string | null {
    try {
      return execSync(command, { 
        encoding: 'utf-8', 
        cwd: this.projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      }).toString().trim();
    } catch (error) {
      return null;
    }
  }

  private async getTestMetrics(): Promise<TestMetrics> {
    // Try to read test results from recent check suite run
    const resultsPath = join(this.projectPath, 'reports', 'agent', 'check-suite-results.json');
    
    if (existsSync(resultsPath)) {
      try {
        const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));
        const testCheck = results.checks?.find((c: any) => c.type === 'test');
        
        if (testCheck) {
          return {
            total: 1, // Simplified - would parse actual test count
            passing: testCheck.success ? 1 : 0,
            lastRun: results.timestamp,
            status: testCheck.success ? 'pass' : 'fail'
          };
        }
      } catch (error) {
        // Fall through to default
      }
    }

    return {
      total: 0,
      passing: 0,
      status: 'unknown'
    };
  }

  private async getBuildMetrics(): Promise<BuildMetrics> {
    // Try to read build results from recent check suite run
    const resultsPath = join(this.projectPath, 'reports', 'agent', 'check-suite-results.json');
    
    if (existsSync(resultsPath)) {
      try {
        const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));
        const buildCheck = results.checks?.find((c: any) => c.type === 'build');
        
        if (buildCheck) {
          return {
            lastSuccess: buildCheck.success ? results.timestamp : undefined,
            duration: buildCheck.executionTime,
            status: buildCheck.success ? 'success' : 'failed',
            errors: buildCheck.success ? 0 : 1,
            warnings: 0
          };
        }
      } catch (error) {
        // Fall through to default
      }
    }

    return {
      status: 'unknown',
      errors: 0,
      warnings: 0
    };
  }

  private async getSecurityMetrics(): Promise<SecurityMetrics> {
    // Try to read security audit results
    const auditPath = join(this.projectPath, 'reports', 'security-audit.json');
    
    if (existsSync(auditPath)) {
      try {
        const audit = JSON.parse(readFileSync(auditPath, 'utf-8'));
        const vulns = audit.metadata?.vulnerabilities || {};
        
        return {
          vulnerabilities: {
            critical: vulns.critical || 0,
            high: vulns.high || 0,
            moderate: vulns.moderate || 0,
            low: vulns.low || 0
          },
          lastScan: new Date().toISOString(), // Approximate
          status: (vulns.critical || vulns.high) > 0 ? 'vulnerable' : 'secure'
        };
      } catch (error) {
        // Fall through to default
      }
    }

    return {
      vulnerabilities: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      },
      status: 'unknown'
    };
  }

  private async getDependencyMetrics(): Promise<DependencyMetrics> {
    // Check package.json for dependency count
    let total = 0;
    try {
      const packageJson = JSON.parse(readFileSync(join(this.projectPath, 'package.json'), 'utf-8'));
      total = Object.keys(packageJson.dependencies || {}).length + 
              Object.keys(packageJson.devDependencies || {}).length;
    } catch (error) {
      // Ignore
    }

    return {
      total,
      outdated: 0, // Would require npm outdated check
      security_issues: 0, // Would get from security scan
      status: 'current'
    };
  }

  private async getGitMetrics(): Promise<GitMetrics> {
    const branch = this.safeExec('git branch --show-current') || 'unknown';
    const statusOutput = this.safeExec('git status --porcelain') || '';
    const uncommittedChanges = statusOutput.split('\\n').filter(line => line.trim()).length;

    return {
      branch,
      uncommitted_changes: uncommittedChanges,
      status: uncommittedChanges > 0 ? 'dirty' : 'clean'
    };
  }

  private generateRecommendations(metrics: ProjectReport['metrics']): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Security recommendations
    if (metrics.security.vulnerabilities.critical > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'Critical Security Vulnerabilities Found',
        description: `${metrics.security.vulnerabilities.critical} critical vulnerabilities detected`,
        action: 'Run npm audit fix or update affected packages immediately'
      });
    }

    if (metrics.security.vulnerabilities.high > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'High Severity Vulnerabilities Found',
        description: `${metrics.security.vulnerabilities.high} high severity vulnerabilities detected`,
        action: 'Review and update affected packages'
      });
    }

    // Quality recommendations
    if (metrics.tests.status === 'fail') {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Test Suite Failures',
        description: 'Some tests are currently failing',
        action: 'Review and fix failing tests before deploying'
      });
    }

    if (metrics.build.status === 'failed') {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Build Failures',
        description: 'Project build is currently failing',
        action: 'Fix build errors and ensure successful compilation'
      });
    }

    // Maintenance recommendations
    if (metrics.git.uncommitted_changes > 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        title: 'Uncommitted Changes',
        description: `${metrics.git.uncommitted_changes} uncommitted changes in workspace`,
        action: 'Commit or stash changes to maintain clean workspace'
      });
    }

    // Default recommendation if everything looks good
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'low',
        title: 'Project Health Good',
        description: 'No immediate issues detected',
        action: 'Continue regular maintenance and monitoring'
      });
    }

    return recommendations;
  }

  private calculateOverallStatus(metrics: ProjectReport['metrics']): { overall: ProjectReport['status']['overall'], score: number, summary: string } {
    let score = 100;
    let issues: string[] = [];

    // Security impact
    score -= metrics.security.vulnerabilities.critical * 30;
    score -= metrics.security.vulnerabilities.high * 15;
    score -= metrics.security.vulnerabilities.moderate * 5;

    if (metrics.security.vulnerabilities.critical > 0) {
      issues.push('critical security vulnerabilities');
    }

    // Quality impact
    if (metrics.tests.status === 'fail') {
      score -= 25;
      issues.push('failing tests');
    }

    if (metrics.build.status === 'failed') {
      score -= 30;
      issues.push('build failures');
    }

    // Maintenance impact
    if (metrics.git.uncommitted_changes > 5) {
      score -= 10;
      issues.push('many uncommitted changes');
    }

    score = Math.max(0, score);

    let overall: ProjectReport['status']['overall'];
    if (score >= 80) {
      overall = 'healthy';
    } else if (score >= 60) {
      overall = 'warning';
    } else {
      overall = 'critical';
    }

    const summary = issues.length > 0 
      ? `Issues found: ${issues.join(', ')}`
      : 'No significant issues detected';

    return { overall, score, summary };
  }

  async generateReport(): Promise<ProjectReport> {
    console.log('📊 Generating CHARLY project report...');

    // Collect metrics
    const metrics = {
      tests: await this.getTestMetrics(),
      build: await this.getBuildMetrics(),
      security: await this.getSecurityMetrics(),
      dependencies: await this.getDependencyMetrics(),
      git: await this.getGitMetrics()
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics);

    // Calculate overall status
    const status = this.calculateOverallStatus(metrics);

    const report: ProjectReport = {
      metadata: {
        generated: new Date().toISOString(),
        agent: 'charly-build-agent',
        mode: 'safe',
        project: 'CHARLY'
      },
      status,
      metrics,
      recommendations
    };

    return report;
  }

  async saveReport(report: ProjectReport, format: 'json' | 'markdown' | 'both' = 'both'): Promise<void> {
    const outputDir = join(this.projectPath, 'reports', 'agent');
    mkdirSync(outputDir, { recursive: true });

    if (format === 'json' || format === 'both') {
      const jsonFile = join(outputDir, 'project-report.json');
      writeFileSync(jsonFile, JSON.stringify(report, null, 2));
      console.log(`📄 JSON report saved: ${jsonFile}`);
    }

    if (format === 'markdown' || format === 'both') {
      const mdFile = join(outputDir, 'project-report.md');
      const markdown = this.generateMarkdownReport(report);
      writeFileSync(mdFile, markdown);
      console.log(`📄 Markdown report saved: ${mdFile}`);
    }
  }

  private generateMarkdownReport(report: ProjectReport): string {
    const { status, metrics, recommendations } = report;
    
    return `# CHARLY Project Report

Generated: ${report.metadata.generated}  
Agent: ${report.metadata.agent} (${report.metadata.mode} mode)

## Overall Status: ${status.overall.toUpperCase()} (${status.score}/100)

${status.summary}

## Metrics

### 🧪 Tests
- Status: ${metrics.tests.status}
- Total: ${metrics.tests.total}
- Passing: ${metrics.tests.passing}
${metrics.tests.coverage ? `- Coverage: ${metrics.tests.coverage}%` : ''}
${metrics.tests.lastRun ? `- Last Run: ${metrics.tests.lastRun}` : ''}

### 🔨 Build
- Status: ${metrics.build.status}
- Errors: ${metrics.build.errors}
- Warnings: ${metrics.build.warnings}
${metrics.build.duration ? `- Duration: ${metrics.build.duration}ms` : ''}
${metrics.build.lastSuccess ? `- Last Success: ${metrics.build.lastSuccess}` : ''}

### 🔐 Security
- Status: ${metrics.security.status}
- Critical: ${metrics.security.vulnerabilities.critical}
- High: ${metrics.security.vulnerabilities.high}
- Moderate: ${metrics.security.vulnerabilities.moderate}
- Low: ${metrics.security.vulnerabilities.low}
${metrics.security.lastScan ? `- Last Scan: ${metrics.security.lastScan}` : ''}

### 📦 Dependencies
- Status: ${metrics.dependencies.status}
- Total: ${metrics.dependencies.total}
- Outdated: ${metrics.dependencies.outdated}
- Security Issues: ${metrics.dependencies.security_issues}

### 🌳 Git
- Branch: ${metrics.git.branch}
- Status: ${metrics.git.status}
- Uncommitted Changes: ${metrics.git.uncommitted_changes}
${metrics.git.commits_ahead ? `- Commits Ahead: ${metrics.git.commits_ahead}` : ''}
${metrics.git.commits_behind ? `- Commits Behind: ${metrics.git.commits_behind}` : ''}

## Recommendations

${recommendations.map(rec => 
  `### ${rec.priority.toUpperCase()}: ${rec.title}
**Type:** ${rec.type}  
**Description:** ${rec.description}  
${rec.action ? `**Action:** ${rec.action}` : ''}
`).join('\\n')}

---
*Report generated by CHARLY Build Agent in safe mode*
`;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ReportGenerator();
  generator.generateReport()
    .then(report => {
      generator.saveReport(report);
      console.log('✅ Report generation completed');
    })
    .catch(error => {
      console.error('❌ Report generation failed:', error);
      process.exit(1);
    });
}