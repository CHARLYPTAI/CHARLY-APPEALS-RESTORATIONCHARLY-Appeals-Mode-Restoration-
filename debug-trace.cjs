#!/usr/bin/env node
/**
 * CHARLY Frontend Debug Tracer
 * Comprehensive dependency and startup analysis
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('🔍 CHARLY Frontend Debug Tracer Starting...\n');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, label, message) {
  console.log(`${colors[color]}[${label}]${colors.reset} ${message}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(exists ? 'green' : 'red', 'FILE', `${description}: ${exists ? '✅' : '❌'} ${filePath}`);
  return exists;
}

function analyzePackageJson() {
  log('blue', 'DEPS', 'Analyzing package.json dependencies...');
  
  if (!checkFileExists('package.json', 'Main package.json')) return;
  
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check critical dependencies
  const criticalDeps = [
    'react', 'react-dom', 'vite', '@vitejs/plugin-react', 
    'typescript', 'antd', '@types/react', '@types/react-dom'
  ];
  
  const missingDeps = [];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  criticalDeps.forEach(dep => {
    if (allDeps[dep]) {
      log('green', 'DEP', `${dep}: ${allDeps[dep]}`);
    } else {
      log('red', 'DEP', `MISSING: ${dep}`);
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length > 0) {
    log('red', 'ERROR', `Missing critical dependencies: ${missingDeps.join(', ')}`);
    return false;
  }
  
  return true;
}

function analyzeConfigFiles() {
  log('blue', 'CONFIG', 'Analyzing configuration files...');
  
  const configs = [
    { file: 'vite.config.ts', desc: 'Vite config' },
    { file: 'tsconfig.json', desc: 'TypeScript config' },
    { file: 'tsconfig.node.json', desc: 'Node TypeScript config' },
    { file: '.eslintrc.cjs', desc: 'ESLint config' }
  ];
  
  configs.forEach(({ file, desc }) => {
    if (checkFileExists(file, desc)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (file.endsWith('.json')) {
          JSON.parse(content); // Validate JSON
          log('green', 'VALID', `${file} - JSON syntax OK`);
        } else {
          log('green', 'VALID', `${file} - File readable`);
        }
      } catch (error) {
        log('red', 'ERROR', `${file} - Parse error: ${error.message}`);
      }
    }
  });
}

function analyzeCriticalSourceFiles() {
  log('blue', 'SOURCE', 'Analyzing critical source files...');
  
  const sourceFiles = [
    'src/App.tsx',
    'src/main.tsx', 
    'src/components/Dashboard.tsx',
    'src/components/Login.tsx',
    'src/pages/AdminBulkJobs.tsx',
    'src/design-system/theme.ts'
  ];
  
  sourceFiles.forEach(file => {
    if (checkFileExists(file, `Source file`)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for common issues
        const issues = [];
        if (content.includes('import.*from.*undefined')) issues.push('Undefined imports');
        if (content.includes('export.*undefined')) issues.push('Undefined exports');
        if (content.match(/import.*from\s+['"]['"]['"]/)) issues.push('Empty import paths');
        if (content.includes('// @ts-ignore')) issues.push('TypeScript ignores');
        
        if (issues.length > 0) {
          log('yellow', 'WARN', `${file} - Issues: ${issues.join(', ')}`);
        } else {
          log('green', 'OK', `${file} - No obvious issues`);
        }
        
        // Count imports to detect circular dependencies
        const imports = (content.match(/^import.*from/gm) || []).length;
        log('cyan', 'INFO', `${file} - ${imports} imports`);
        
      } catch (error) {
        log('red', 'ERROR', `${file} - Read error: ${error.message}`);
      }
    }
  });
}

function checkNodeModules() {
  log('blue', 'MODULES', 'Analyzing node_modules...');
  
  if (!checkFileExists('node_modules', 'node_modules directory')) {
    log('red', 'FATAL', 'node_modules missing - run npm install');
    return false;
  }
  
  // Check critical module subdirectories
  const criticalModules = [
    'node_modules/react',
    'node_modules/vite', 
    'node_modules/typescript',
    'node_modules/@vitejs/plugin-react',
    'node_modules/antd'
  ];
  
  criticalModules.forEach(mod => {
    checkFileExists(mod, `Module: ${path.basename(mod)}`);
  });
  
  // Check for node_modules corruption
  try {
    const stats = fs.statSync('node_modules');
    const files = fs.readdirSync('node_modules').length;
    log('cyan', 'INFO', `node_modules: ${files} packages, size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
  } catch (error) {
    log('red', 'ERROR', `node_modules analysis failed: ${error.message}`);
  }
  
  return true;
}

function testCompilation() {
  log('blue', 'COMPILE', 'Testing TypeScript compilation...');
  
  return new Promise((resolve) => {
    exec('npx tsc --noEmit --skipLibCheck', (error, stdout, stderr) => {
      if (error) {
        log('red', 'TS-ERROR', `TypeScript compilation failed:`);
        console.log(stderr || stdout);
        resolve(false);
      } else {
        log('green', 'TS-OK', 'TypeScript compilation successful');
        resolve(true);
      }
    });
  });
}

function testViteBuild() {
  log('blue', 'BUILD', 'Testing Vite build process...');
  
  return new Promise((resolve) => {
    const buildProcess = spawn('npx', ['vite', 'build', '--logLevel', 'info'], {
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    buildProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    buildProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    const timeout = setTimeout(() => {
      buildProcess.kill();
      log('red', 'BUILD-ERROR', 'Vite build timed out after 30s');
      resolve(false);
    }, 30000);
    
    buildProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        log('green', 'BUILD-OK', 'Vite build successful');
        resolve(true);
      } else {
        log('red', 'BUILD-ERROR', `Vite build failed with code ${code}`);
        if (errorOutput) console.log('STDERR:', errorOutput);
        if (output) console.log('STDOUT:', output);
        resolve(false);
      }
    });
  });
}

function testPortBinding() {
  log('blue', 'PORT', 'Testing port binding...');
  
  return new Promise((resolve) => {
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Test server');
    });
    
    server.listen(5173, '127.0.0.1', () => {
      log('green', 'PORT-OK', 'Port 5173 can be bound successfully');
      server.close();
      resolve(true);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        log('red', 'PORT-ERROR', 'Port 5173 already in use');
        // Try to find what's using it
        exec('lsof -i :5173', (err, stdout) => {
          if (stdout) {
            log('cyan', 'PORT-INFO', `Process using port 5173:\n${stdout}`);
          }
        });
      } else {
        log('red', 'PORT-ERROR', `Port binding error: ${error.message}`);
      }
      resolve(false);
    });
  });
}

function checkSystemEnvironment() {
  log('blue', 'ENV', 'Checking system environment...');
  
  // Node version
  exec('node --version', (err, stdout) => {
    if (stdout) log('cyan', 'NODE', `Version: ${stdout.trim()}`);
  });
  
  // NPM version  
  exec('npm --version', (err, stdout) => {
    if (stdout) log('cyan', 'NPM', `Version: ${stdout.trim()}`);
  });
  
  // Check if we're in the right directory
  const currentDir = process.cwd();
  log('cyan', 'DIR', `Working directory: ${currentDir}`);
  
  if (!currentDir.includes('charly_frontend')) {
    log('red', 'DIR-ERROR', 'Not in charly_frontend directory!');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive debug analysis...\n');
  
  const checks = [
    { name: 'System Environment', fn: checkSystemEnvironment },
    { name: 'Package Dependencies', fn: analyzePackageJson },
    { name: 'Configuration Files', fn: analyzeConfigFiles },
    { name: 'Source Files', fn: analyzeCriticalSourceFiles },
    { name: 'Node Modules', fn: checkNodeModules },
    { name: 'Port Binding', fn: testPortBinding },
    { name: 'TypeScript Compilation', fn: testCompilation },
    { name: 'Vite Build', fn: testViteBuild }
  ];
  
  const results = {};
  
  for (const check of checks) {
    console.log(`\n${'='.repeat(50)}`);
    log('magenta', 'CHECK', `Running: ${check.name}`);
    console.log('='.repeat(50));
    
    try {
      const result = await check.fn();
      results[check.name] = result;
      log(result ? 'green' : 'red', 'RESULT', `${check.name}: ${result ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      log('red', 'ERROR', `${check.name} threw error: ${error.message}`);
      results[check.name] = false;
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  log('magenta', 'SUMMARY', 'Debug Analysis Results');
  console.log('='.repeat(60));
  
  const failed = [];
  const passed = [];
  
  Object.entries(results).forEach(([check, result]) => {
    if (result) {
      passed.push(check);
      log('green', '✅', check);
    } else {
      failed.push(check);
      log('red', '❌', check);
    }
  });
  
  console.log(`\n📊 Results: ${passed.length} passed, ${failed.length} failed`);
  
  if (failed.length > 0) {
    log('red', 'RECOMMENDATION', 'Focus on fixing these failed checks:');
    failed.forEach(check => console.log(`   - ${check}`));
  } else {
    log('green', 'SUCCESS', 'All checks passed! The issue may be timing or environment-specific.');
  }
  
  console.log('\n🔍 Debug trace complete.');
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n🛑 Debug trace interrupted by user');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log('red', 'FATAL', `Uncaught exception: ${error.message}`);
  process.exit(1);
});

main().catch(error => {
  log('red', 'FATAL', `Debug script failed: ${error.message}`);
  process.exit(1);
});