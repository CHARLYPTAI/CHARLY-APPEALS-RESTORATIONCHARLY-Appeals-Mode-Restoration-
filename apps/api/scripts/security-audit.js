#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { mkdirSync } from 'fs';
import path from 'path';

const SEVERITY_LEVELS = {
  'critical': 4,
  'high': 3,
  'moderate': 2,
  'low': 1,
  'info': 0
};

const FAIL_ON_SEVERITY = 'high'; // Fail on high and critical vulns
const FAIL_THRESHOLD = SEVERITY_LEVELS[FAIL_ON_SEVERITY];

async function runSecurityAudit() {
  console.log('🔍 Running security audit...');
  
  try {
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), '../../reports');
    mkdirSync(reportsDir, { recursive: true });
    
    // Run npm audit and capture JSON output
    let auditOutput;
    try {
      auditOutput = execSync('pnpm audit --json', { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      // We still want to process the output
      auditOutput = error.stdout || error.output?.[1] || '{}';
    }
    
    const auditData = JSON.parse(auditOutput);
    
    // Write audit report
    const auditReportPath = path.join(reportsDir, 'security-audit.json');
    writeFileSync(auditReportPath, JSON.stringify(auditData, null, 2));
    console.log(`📄 Audit report written to: ${auditReportPath}`);
    
    // Analyze vulnerabilities
    const vulnerabilities = auditData.metadata?.vulnerabilities || {};
    const totalVulns = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
    
    console.log('📊 Vulnerability Summary:');
    console.log(`   Critical: ${vulnerabilities.critical || 0}`);
    console.log(`   High:     ${vulnerabilities.high || 0}`);
    console.log(`   Moderate: ${vulnerabilities.moderate || 0}`);
    console.log(`   Low:      ${vulnerabilities.low || 0}`);
    console.log(`   Info:     ${vulnerabilities.info || 0}`);
    console.log(`   Total:    ${totalVulns}`);
    
    // Check if we should fail based on severity
    const criticalCount = vulnerabilities.critical || 0;
    const highCount = vulnerabilities.high || 0;
    const failingVulnCount = criticalCount + highCount;
    
    if (failingVulnCount > 0) {
      console.error(`❌ Security scan FAILED: Found ${failingVulnCount} ${FAIL_ON_SEVERITY}+ severity vulnerabilities`);
      console.error('   Please review and remediate these vulnerabilities before proceeding.');
      
      // Show specific advisories for critical/high vulns
      if (auditData.advisories) {
        console.error('\\n🚨 Critical/High Severity Issues:');
        Object.values(auditData.advisories).forEach(advisory => {
          if (SEVERITY_LEVELS[advisory.severity] >= FAIL_THRESHOLD) {
            console.error(`   • ${advisory.title} (${advisory.severity.toUpperCase()})`);
            console.error(`     Module: ${advisory.module_name}`);
            console.error(`     Recommendation: ${advisory.recommendation}`);
            console.error('');
          }
        });
      }
      
      process.exit(1);
    }
    
    if (totalVulns > 0) {
      console.log(`⚠️  Found ${totalVulns} lower-severity vulnerabilities. Consider reviewing when convenient.`);
    } else {
      console.log('✅ No security vulnerabilities found!');
    }
    
    console.log('🎉 Security scan completed successfully');
    
  } catch (error) {
    console.error('❌ Security audit failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityAudit();
}