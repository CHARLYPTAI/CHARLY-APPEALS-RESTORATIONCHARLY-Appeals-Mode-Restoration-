import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const sha = execSync('git rev-parse HEAD').toString().trim();
const time = new Date().toISOString();
const env = `VITE_BUILD_SHA=${sha}\nVITE_BUILD_TIME=${time}\n`;
writeFileSync('./charly_ui/.env', env);
console.log('[BUILD] Injected', { sha, time });