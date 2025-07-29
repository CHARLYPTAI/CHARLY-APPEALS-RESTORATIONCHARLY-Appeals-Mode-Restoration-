#!/usr/bin/env node

/**
 * CTO-Level Debug Script: GCP Black Screen Issue
 * This script traces the issue across multiple files to find the root cause
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CTO DEBUG: Tracing GCP Black Screen Issue');
console.log('==============================================');

// 1. Check if we're using the correct commit
console.log('\n1. COMMIT VERIFICATION:');
const { execSync } = require('child_process');
try {
  const currentCommit = execSync('git log --oneline -1', { encoding: 'utf8' }).trim();
  console.log(`Current commit: ${currentCommit}`);
  
  if (currentCommit.includes('86a8b7f')) {
    console.log('✅ Correct commit (86a8b7f)');
  } else {
    console.log('❌ WRONG COMMIT - Should be 86a8b7f');
  }
} catch (e) {
  console.log('❌ Git command failed:', e.message);
}

// 2. Check App.tsx configuration
console.log('\n2. APP.TSX CONFIGURATION:');
const appPath = './src/App.tsx';
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // Check default workflow
  const defaultWorkflowMatch = appContent.match(/setCurrentWorkflow\(['"]([^'"]+)['"]\)/);
  if (defaultWorkflowMatch) {
    console.log(`✅ Default workflow: ${defaultWorkflowMatch[1]}`);
  } else {
    console.log('❌ Default workflow not found');
  }
  
  // Check DASHBOARD_NEW case
  if (appContent.includes('case \'DASHBOARD_NEW\'')) {
    console.log('✅ DASHBOARD_NEW case exists');
    
    // Check what component it returns
    const dashboardNewMatch = appContent.match(/case 'DASHBOARD_NEW':\s*[^]*?return\s*<([^>]+)/);
    if (dashboardNewMatch) {
      console.log(`✅ Returns component: ${dashboardNewMatch[1]}`);
    }
  } else {
    console.log('❌ DASHBOARD_NEW case not found');
  }
  
  // Check FixedDashboard import
  if (appContent.includes('import FixedDashboard')) {
    console.log('✅ FixedDashboard imported');
  } else {
    console.log('❌ FixedDashboard not imported');
  }
} else {
  console.log('❌ App.tsx not found');
}

// 3. Check FixedDashboard component
console.log('\n3. FIXEDDASHBOARD COMPONENT:');
const fixedDashboardPath = './src/components/FixedDashboard.tsx';
if (fs.existsSync(fixedDashboardPath)) {
  const stats = fs.statSync(fixedDashboardPath);
  const content = fs.readFileSync(fixedDashboardPath, 'utf8');
  const lines = content.split('\n').length;
  
  console.log(`✅ FixedDashboard exists: ${lines} lines, ${stats.size} bytes`);
  
  // Check for key features
  if (content.includes('react-beautiful-dnd')) {
    console.log('✅ Contains drag-and-drop (react-beautiful-dnd)');
  } else {
    console.log('❌ Missing drag-and-drop');
  }
  
  if (content.includes('Analytics') && content.includes('Insights') && content.includes('Settings')) {
    console.log('✅ Contains all three tabs');
  } else {
    console.log('❌ Missing tabs');
  }
} else {
  console.log('❌ FixedDashboard.tsx not found');
}

// 4. Check build output
console.log('\n4. BUILD OUTPUT:');
const distPath = './dist';
if (fs.existsSync(distPath)) {
  const distFiles = fs.readdirSync(distPath);
  console.log(`✅ Dist folder exists with ${distFiles.length} files`);
  
  if (distFiles.includes('index.html')) {
    console.log('✅ index.html exists');
    
    // Check index.html content
    const indexContent = fs.readFileSync('./dist/index.html', 'utf8');
    console.log(`✅ index.html size: ${indexContent.length} characters`);
    
    // Check for script tags
    const scriptTags = indexContent.match(/<script[^>]*src="[^"]*"[^>]*>/g);
    if (scriptTags) {
      console.log(`✅ ${scriptTags.length} script tags found`);
      scriptTags.forEach((tag, i) => {
        console.log(`   Script ${i + 1}: ${tag}`);
      });
    } else {
      console.log('❌ No script tags found in index.html');
    }
  } else {
    console.log('❌ index.html not found');
  }
  
  // Check for JS files
  const jsFiles = distFiles.filter(f => f.endsWith('.js') || f.includes('assets'));
  console.log(`✅ JavaScript files/assets: ${jsFiles.length}`);
  
} else {
  console.log('❌ Dist folder not found');
}

// 5. Check app.yaml configuration
console.log('\n5. APP.YAML CONFIGURATION:');
const appYamlPath = './app.yaml';
if (fs.existsSync(appYamlPath)) {
  const appYamlContent = fs.readFileSync(appYamlPath, 'utf8');
  console.log('✅ app.yaml exists');
  
  if (appYamlContent.includes('static_files: dist/index.html')) {
    console.log('✅ Correct static file routing');
  } else {
    console.log('❌ Incorrect static file routing');
  }
  
  if (appYamlContent.includes('service: final-dashboard')) {
    console.log('✅ Correct service name');
  } else {
    console.log('❌ Incorrect service name');
  }
} else {
  console.log('❌ app.yaml not found');
}

// 6. Check for console errors in built files
console.log('\n6. POTENTIAL CONSOLE ERRORS:');
const assetsPath = './dist/assets';
if (fs.existsSync(assetsPath)) {
  const assetFiles = fs.readdirSync(assetsPath);
  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  
  console.log(`Checking ${jsFiles.length} JS files for potential issues...`);
  
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common issues
    if (content.includes('Cannot read prop') || content.includes('undefined is not')) {
      console.log(`❌ Potential runtime error in ${file}`);
    }
    
    if (content.includes('FixedDashboard')) {
      console.log(`✅ FixedDashboard found in ${file}`);
    }
  });
}

console.log('\n==============================================');
console.log('🔍 DEBUG COMPLETE');
console.log('==============================================');

// 7. Recommendations
console.log('\n7. CTO RECOMMENDATIONS:');
console.log('1. Check browser console on GCP URL for JavaScript errors');
console.log('2. Verify network tab shows all assets loading correctly');
console.log('3. Check if there are CORS issues with static files');
console.log('4. Verify GCP deployment completed successfully');
console.log('5. Check if the service is actually running on GCP');
console.log('\nNext steps: Run this script and check the specific issues flagged above.');