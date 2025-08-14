#!/usr/bin/env node

console.log('🔍 CHARLY SITE DEBUG - ROOT CAUSE ANALYSIS');
console.log('='.repeat(60));

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Check current directory and files
console.log('\n1. CURRENT DIRECTORY ANALYSIS:');
console.log('Working Directory:', process.cwd());
console.log('Files in current directory:');
try {
  const files = fs
    .readdirSync('.')
    .filter((f) => !f.startsWith('.') && !f.includes('node_modules'));
  files.forEach((file) => {
    const stat = fs.statSync(file);
    console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
  });
} catch (e) {
  console.error('Error reading directory:', e.message);
}

// 2. Check package.json
console.log('\n2. PACKAGE.JSON ANALYSIS:');
try {
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('  ✅ Package.json found');
    console.log('  Name:', pkg.name);
    console.log('  Scripts:', Object.keys(pkg.scripts || {}));
  } else {
    console.log('  ❌ No package.json found');
  }
} catch (e) {
  console.error('  ❌ Error reading package.json:', e.message);
}

// 3. Check for React entry points
console.log('\n3. REACT ENTRY POINTS:');
const entryPoints = ['src/main.tsx', 'src/index.tsx', 'src/App.tsx'];
entryPoints.forEach((entry) => {
  if (fs.existsSync(entry)) {
    console.log(`  ✅ ${entry} exists`);
  } else {
    console.log(`  ❌ ${entry} missing`);
  }
});

// 4. Check if Vite is running
console.log('\n4. VITE PROCESS CHECK:');
try {
  const processes = execSync('ps aux | grep vite | grep -v grep', { encoding: 'utf8' });
  if (processes.trim()) {
    console.log('  ✅ Vite process running:');
    console.log('  ' + processes.trim());
  } else {
    console.log('  ❌ No Vite process found');
  }
} catch (e) {
  console.log('  ❌ No Vite process running');
}

// 5. Check network connectivity
console.log('\n5. NETWORK CHECK:');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173', {
    encoding: 'utf8',
  });
  if (response.trim() === '200') {
    console.log('  ✅ localhost:5173 responding (HTTP 200)');
  } else {
    console.log(`  ❌ localhost:5173 returned HTTP ${response.trim()}`);
  }
} catch (e) {
  console.log('  ❌ localhost:5173 not accessible');
}

// 6. Check Git status
console.log('\n6. GIT STATUS:');
try {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  console.log('  Current branch:', branch);
  console.log('  Modified files:', status ? status.split('\n').length : 0);
} catch (e) {
  console.log('  ❌ Git error:', e.message);
}

// 7. SOLUTION RECOMMENDATIONS
console.log('\n7. 🚨 SOLUTION RECOMMENDATIONS:');
console.log('='.repeat(60));

if (!fs.existsSync('package.json')) {
  console.log('❌ CRITICAL: No package.json - wrong directory');
  console.log('🔧 FIX: cd to correct directory with package.json');
} else if (!fs.existsSync('src/main.tsx') && !fs.existsSync('src/index.tsx')) {
  console.log('❌ CRITICAL: No React entry point');
  console.log('🔧 FIX: Missing src/main.tsx or src/index.tsx');
} else {
  console.log('✅ Basic structure OK');
  console.log('🔧 TRY: Kill existing processes and restart');
  console.log('   Commands: pkill -f vite && npm run dev');
}

console.log('\n🚀 QUICK FIX COMMAND:');
console.log('pkill -f vite && sleep 2 && npm run dev');
