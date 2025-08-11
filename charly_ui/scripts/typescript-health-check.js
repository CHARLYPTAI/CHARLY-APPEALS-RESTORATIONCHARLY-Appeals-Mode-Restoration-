#!/usr/bin/env node

/**
 * 🍎 Apple CTO TypeScript Health Monitoring System
 * 
 * Executive dashboard for TypeScript technical debt monitoring
 * Prevents accumulation of type safety issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const HEALTH_THRESHOLDS = {
  TYPE_COVERAGE_MIN: 85,
  BUILD_TIME_MAX: 30, // seconds
  ERROR_COUNT_MAX: 0,
  WARNING_COUNT_MAX: 5
};

const ALERT_LEVELS = {
  GREEN: '✅',
  YELLOW: '⚠️',
  RED: '🚨'
};

class TypeScriptHealthMonitor {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      typeCoverage: 0,
      buildTime: 0,
      errorCount: 0,
      warningCount: 0,
      buildSuccess: false,
      alerts: []
    };
  }

  async checkTypeCoverage() {
    try {
      const output = execSync('npx type-coverage --output-file /dev/null', { 
        encoding: 'utf8',
        timeout: 30000
      });
      
      const match = output.match(/(\d+\.?\d*)%/);
      this.metrics.typeCoverage = match ? parseFloat(match[1]) : 0;
      
      if (this.metrics.typeCoverage < HEALTH_THRESHOLDS.TYPE_COVERAGE_MIN) {
        this.metrics.alerts.push({
          level: 'RED',
          message: `Type coverage ${this.metrics.typeCoverage}% below minimum ${HEALTH_THRESHOLDS.TYPE_COVERAGE_MIN}%`,
          action: 'Add explicit types to improve coverage'
        });
      }
    } catch (error) {
      this.metrics.alerts.push({
        level: 'RED',
        message: 'Type coverage check failed',
        action: 'Install type-coverage: npm install --save-dev type-coverage'
      });
    }
  }

  async checkBuildHealth() {
    const startTime = Date.now();
    
    try {
      execSync('npm run build:typecheck', { 
        encoding: 'utf8',
        timeout: 60000,
        stdio: 'pipe'
      });
      
      this.metrics.buildSuccess = true;
      this.metrics.buildTime = (Date.now() - startTime) / 1000;
      
      if (this.metrics.buildTime > HEALTH_THRESHOLDS.BUILD_TIME_MAX) {
        this.metrics.alerts.push({
          level: 'YELLOW',
          message: `Build time ${this.metrics.buildTime}s exceeds threshold ${HEALTH_THRESHOLDS.BUILD_TIME_MAX}s`,
          action: 'Review bundle optimization and type complexity'
        });
      }
      
    } catch (error) {
      this.metrics.buildSuccess = false;
      this.metrics.buildTime = (Date.now() - startTime) / 1000;
      
      // Parse TypeScript errors
      const errorOutput = error.stdout || error.stderr || '';
      const errorLines = errorOutput.split('\n').filter(line => 
        line.includes('error TS') || line.includes('✖')
      );
      
      this.metrics.errorCount = errorLines.length;
      
      this.metrics.alerts.push({
        level: 'RED',
        message: `Build failed with ${this.metrics.errorCount} TypeScript errors`,
        action: 'Fix TypeScript errors before proceeding',
        details: errorLines.slice(0, 5) // First 5 errors
      });
    }
  }

  async checkLintHealth() {
    try {
      const output = execSync('npm run lint', { 
        encoding: 'utf8',
        timeout: 30000,
        stdio: 'pipe'
      });
      
      // Parse warning count from ESLint output
      const warningMatch = output.match(/(\d+) warnings?/);
      this.metrics.warningCount = warningMatch ? parseInt(warningMatch[1]) : 0;
      
      if (this.metrics.warningCount > HEALTH_THRESHOLDS.WARNING_COUNT_MAX) {
        this.metrics.alerts.push({
          level: 'YELLOW',
          message: `${this.metrics.warningCount} lint warnings exceed threshold`,
          action: 'Address lint warnings to maintain code quality'
        });
      }
      
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || '';
      const errorMatch = errorOutput.match(/(\d+) errors?/);
      const errorCount = errorMatch ? parseInt(errorMatch[1]) : 1;
      
      this.metrics.alerts.push({
        level: 'RED',
        message: `Lint failed with ${errorCount} errors`,
        action: 'Fix lint errors immediately'
      });
    }
  }

  getOverallHealth() {
    const hasRedAlerts = this.metrics.alerts.some(alert => alert.level === 'RED');
    const hasYellowAlerts = this.metrics.alerts.some(alert => alert.level === 'YELLOW');
    
    if (hasRedAlerts) return 'RED';
    if (hasYellowAlerts) return 'YELLOW';
    return 'GREEN';
  }

  generateReport() {
    const overallHealth = this.getOverallHealth();
    const healthIcon = ALERT_LEVELS[overallHealth];
    
    const report = {
      summary: {
        status: overallHealth,
        icon: healthIcon,
        timestamp: this.metrics.timestamp,
        message: this.getHealthMessage(overallHealth)
      },
      metrics: {
        typeCoverage: `${this.metrics.typeCoverage}%`,
        buildTime: `${this.metrics.buildTime}s`,
        buildSuccess: this.metrics.buildSuccess,
        errorCount: this.metrics.errorCount,
        warningCount: this.metrics.warningCount
      },
      alerts: this.metrics.alerts,
      recommendations: this.getRecommendations()
    };

    return report;
  }

  getHealthMessage(level) {
    switch (level) {
      case 'GREEN':
        return 'TypeScript health is excellent. All systems operational.';
      case 'YELLOW':
        return 'TypeScript health needs attention. Address warnings promptly.';
      case 'RED':
        return 'CRITICAL: TypeScript health compromised. Immediate action required.';
      default:
        return 'Unknown health status.';
    }
  }

  getRecommendations() {
    const recommendations = [];
    
    if (this.metrics.typeCoverage < HEALTH_THRESHOLDS.TYPE_COVERAGE_MIN) {
      recommendations.push('Increase type coverage by adding explicit interfaces');
    }
    
    if (!this.metrics.buildSuccess) {
      recommendations.push('Priority 1: Fix all TypeScript build errors');
    }
    
    if (this.metrics.buildTime > HEALTH_THRESHOLDS.BUILD_TIME_MAX) {
      recommendations.push('Optimize build performance and reduce type complexity');
    }
    
    if (this.metrics.warningCount > HEALTH_THRESHOLDS.WARNING_COUNT_MAX) {
      recommendations.push('Address lint warnings to prevent technical debt');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current TypeScript health standards');
    }
    
    return recommendations;
  }

  async saveReport(report) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filename = `typescript-health-${new Date().toISOString().slice(0, 10)}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📊 Health report saved to: ${filepath}`);
  }

  printExecutiveSummary(report) {
    console.log('\n🍎 APPLE CTO TYPESCRIPT HEALTH DASHBOARD\n');
    console.log(`${report.summary.icon} Overall Status: ${report.summary.status}`);
    console.log(`📅 Timestamp: ${report.summary.timestamp}`);
    console.log(`💬 ${report.summary.message}\n`);
    
    console.log('📊 METRICS:');
    console.log(`   Type Coverage: ${report.metrics.typeCoverage}`);
    console.log(`   Build Time: ${report.metrics.buildTime}`);
    console.log(`   Build Success: ${report.metrics.buildSuccess ? '✅' : '❌'}`);
    console.log(`   Errors: ${report.metrics.errorCount}`);
    console.log(`   Warnings: ${report.metrics.warningCount}\n`);
    
    if (report.alerts.length > 0) {
      console.log('🚨 ALERTS:');
      report.alerts.forEach(alert => {
        console.log(`   ${ALERT_LEVELS[alert.level]} ${alert.message}`);
        console.log(`      Action: ${alert.action}`);
        if (alert.details) {
          console.log(`      Details: ${alert.details.slice(0, 2).join(', ')}`);
        }
      });
      console.log('');
    }
    
    console.log('💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
    console.log('');
  }
}

// Execute health check
async function main() {
  const monitor = new TypeScriptHealthMonitor();
  
  console.log('🔍 Running TypeScript health check...\n');
  
  await monitor.checkTypeCoverage();
  await monitor.checkBuildHealth();
  await monitor.checkLintHealth();
  
  const report = monitor.generateReport();
  
  monitor.printExecutiveSummary(report);
  await monitor.saveReport(report);
  
  // Exit with appropriate code for CI/CD
  const exitCode = report.summary.status === 'RED' ? 1 : 0;
  process.exit(exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}