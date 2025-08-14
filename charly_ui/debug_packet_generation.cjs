#!/usr/bin/env node

/**
 * APPLE CTO DEBUGGING SCRIPT - PACKET GENERATION ISSUE TRACER
 * George Wohlleb - Apple CTO (30+ Years Experience)
 * 
 * This script traces the packet generation flow across multiple files to identify
 * the root cause of the generation failure.
 */

const fs = require('fs');
const path = require('path');

console.log('🍎 APPLE CTO PACKET GENERATION DEBUGGER v1.0');
console.log('============================================\n');

// Files to analyze for packet generation flow
const filesToAnalyze = [
  {
    path: 'src/pages/Filing.tsx',
    description: 'Filing page component',
    patterns: ['handleGeneratePacket', 'generatePacket', 'displayPackets', 'toast']
  },
  {
    path: 'src/store/filing.ts',
    description: 'Filing store',
    patterns: ['generatePacket', '/api/filing/generate-packet', 'download_url', 'error']
  },
  {
    path: 'src/pages/Appeals.tsx',
    description: 'Appeals page (working reference)',
    patterns: ['handleSubmitAppeal', '/api/filing/generate-packet', 'download_url']
  },
  {
    path: '../fastapi_backend/main.py',
    description: 'Backend API endpoints',
    patterns: ['generate-packet', 'download_url', 'packet_id']
  }
];

const issues = [];
const findings = {
  apiEndpoints: [],
  dataStructures: [],
  errorHandling: [],
  dependencies: []
};

// Function to read and analyze files
function analyzeFile(fileInfo) {
  const fullPath = path.join(__dirname, fileInfo.path);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n📁 Analyzing: ${fileInfo.description}`);
    console.log(`   Path: ${fileInfo.path}`);
    console.log('   ----------------------------------------');
    
    // Check for patterns
    fileInfo.patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      let matches = 0;
      
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          matches++;
          console.log(`   Line ${index + 1}: ${line.trim()}`);
          
          // Extract specific issues
          if (line.includes('download_url') && !line.includes('.download_url')) {
            issues.push({
              file: fileInfo.path,
              line: index + 1,
              issue: 'Potential property access mismatch',
              detail: line.trim()
            });
          }
          
          if (line.includes('/api/filing/generate-packet')) {
            findings.apiEndpoints.push({
              file: fileInfo.path,
              line: index + 1,
              endpoint: '/api/filing/generate-packet',
              method: line.includes('POST') ? 'POST' : 'Unknown'
            });
          }
        }
      });
      
      if (matches === 0) {
        console.log(`   ⚠️  Pattern "${pattern}" not found`);
      }
    });
    
    // Check for specific issues
    
    // 1. Check data structure consistency
    if (content.includes('property_id') && content.includes('propertyId')) {
      issues.push({
        file: fileInfo.path,
        issue: 'Inconsistent property ID naming',
        detail: 'Both property_id and propertyId found'
      });
    }
    
    // 2. Check error handling
    const tryBlocks = (content.match(/try\s*{/g) || []).length;
    const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
    if (tryBlocks !== catchBlocks) {
      issues.push({
        file: fileInfo.path,
        issue: 'Unbalanced try-catch blocks',
        detail: `${tryBlocks} try blocks, ${catchBlocks} catch blocks`
      });
    }
    
    // 3. Check for console.error usage
    const errorLogs = content.match(/console\.error\([^)]+\)/g) || [];
    if (errorLogs.length > 0) {
      findings.errorHandling.push({
        file: fileInfo.path,
        count: errorLogs.length,
        samples: errorLogs.slice(0, 2).map(e => e.substring(0, 50) + '...')
      });
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    issues.push({
      file: fileInfo.path,
      issue: 'File read error',
      detail: error.message
    });
  }
}

// Function to compare working vs non-working implementations
function compareImplementations() {
  console.log('\n\n🔍 COMPARING IMPLEMENTATIONS');
  console.log('================================');
  
  try {
    // Read Appeals (working) implementation
    const appealsContent = fs.readFileSync(path.join(__dirname, 'src/pages/Appeals.tsx'), 'utf8');
    const filingContent = fs.readFileSync(path.join(__dirname, 'src/pages/Filing.tsx'), 'utf8');
    
    // Extract API call patterns
    const appealsApiCall = appealsContent.match(/fetch\s*\(\s*['"`]\/api\/filing\/generate-packet['"`][^}]+\}/gs);
    const filingApiCall = filingContent.match(/generatePacket\s*\([^)]+\)/gs);
    
    console.log('\n📊 Appeals Page (Working):');
    if (appealsApiCall) {
      console.log('   - Uses direct fetch() call');
      console.log('   - No authentication wrapper');
      console.log('   - Returns: download_url property');
    }
    
    console.log('\n📊 Filing Page (Not Working):');
    if (filingApiCall) {
      console.log('   - Uses store.generatePacket() method');
      console.log('   - Goes through filing store abstraction');
      console.log('   - May have data transformation issues');
    }
    
    // Check for data structure differences
    console.log('\n📊 Data Structure Analysis:');
    
    // Appeals data structure
    const appealsDataMatch = appealsContent.match(/const packetData = {([^}]+)}/s);
    if (appealsDataMatch) {
      console.log('   Appeals packet data includes:');
      const props = appealsDataMatch[1].match(/(\w+):/g);
      if (props) {
        props.forEach(prop => console.log(`     - ${prop.replace(':', '')}`));
      }
    }
    
    // Filing data structure
    const filingDataMatch = filingContent.match(/const propertyData = {([^}]+)}/s);
    if (filingDataMatch) {
      console.log('\n   Filing packet data includes:');
      const props = filingDataMatch[1].match(/(\w+):/g);
      if (props) {
        props.forEach(prop => console.log(`     - ${prop.replace(':', '')}`));
      }
    }
    
  } catch (error) {
    console.log('   ❌ Comparison error:', error.message);
  }
}

// Function to check backend compatibility
function checkBackendCompatibility() {
  console.log('\n\n🔌 BACKEND COMPATIBILITY CHECK');
  console.log('==================================');
  
  try {
    const backendContent = fs.readFileSync(path.join(__dirname, '../fastapi_backend/main.py'), 'utf8');
    
    // Find the generate-packet endpoint
    const endpointMatch = backendContent.match(/@app\.post\("\/api\/filing\/generate-packet"\)[^}]+}/s);
    
    if (endpointMatch) {
      console.log('\n✅ Backend endpoint found');
      
      // Check what the endpoint expects
      const expectsAuth = endpointMatch[0].includes('Depends(');
      const returnsDownloadUrl = endpointMatch[0].includes('download_url');
      const paramName = endpointMatch[0].match(/def \w+\((\w+):/);
      
      console.log(`   - Expects authentication: ${expectsAuth ? 'YES' : 'NO'}`);
      console.log(`   - Returns download_url: ${returnsDownloadUrl ? 'YES' : 'NO'}`);
      console.log(`   - Parameter name: ${paramName ? paramName[1] : 'Unknown'}`);
      
      if (expectsAuth) {
        issues.push({
          file: 'Backend API',
          issue: 'Authentication required but may not be provided',
          detail: 'Endpoint expects authentication token'
        });
      }
    } else {
      issues.push({
        file: 'Backend API',
        issue: 'Endpoint not found',
        detail: '/api/filing/generate-packet endpoint missing'
      });
    }
    
  } catch (error) {
    console.log('   ❌ Backend check error:', error.message);
  }
}

// Main execution
console.log('🔧 Starting comprehensive packet generation analysis...\n');

// Analyze each file
filesToAnalyze.forEach(analyzeFile);

// Compare implementations
compareImplementations();

// Check backend
checkBackendCompatibility();

// Summary report
console.log('\n\n📋 ISSUE SUMMARY');
console.log('=================');

if (issues.length === 0) {
  console.log('✅ No critical issues found');
} else {
  console.log(`❌ Found ${issues.length} potential issues:\n`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}`);
    console.log(`   Issue: ${issue.issue}`);
    console.log(`   Detail: ${issue.detail}`);
    if (issue.line) {
      console.log(`   Line: ${issue.line}`);
    }
    console.log('');
  });
}

// Recommendations
console.log('\n💡 RECOMMENDATIONS');
console.log('==================');
console.log('1. Check browser console for actual error messages');
console.log('2. Verify backend server is running on expected port');
console.log('3. Check network tab for actual API request/response');
console.log('4. Consider using the same fetch pattern as Appeals page');
console.log('5. Ensure data structure matches backend expectations');

// Generate fix suggestions
console.log('\n🔧 SUGGESTED FIXES');
console.log('==================');
console.log('1. Make Filing page use direct fetch() like Appeals page');
console.log('2. Ensure propertyData structure matches what backend expects');
console.log('3. Add detailed error logging to identify exact failure point');
console.log('4. Check if authentication token is being passed correctly');

console.log('\n✨ Debugging script completed!\n');