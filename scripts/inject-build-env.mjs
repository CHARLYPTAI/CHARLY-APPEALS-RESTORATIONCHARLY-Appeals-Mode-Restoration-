import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const sha = execSync('git rev-parse HEAD').toString().trim();
const time = new Date().toISOString();

// Preserve existing .env content
let existingEnv = '';
try {
  existingEnv = readFileSync('./charly_ui/.env', 'utf8');
  // Remove any existing BUILD_SHA/BUILD_TIME lines
  existingEnv = existingEnv.split('\n')
    .filter(line => !line.startsWith('VITE_BUILD_SHA=') && !line.startsWith('VITE_BUILD_TIME='))
    .join('\n');
  if (existingEnv && !existingEnv.endsWith('\n')) existingEnv += '\n';
} catch (e) {
  // File doesn't exist, that's ok
}

const buildVars = `VITE_BUILD_SHA=${sha}\nVITE_BUILD_TIME=${time}\n`;
writeFileSync('./charly_ui/.env', existingEnv + buildVars);
console.log('[BUILD] Injected', { sha, time });