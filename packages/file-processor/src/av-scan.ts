import type { AVScanResult } from './types.js';

export async function scanForViruses(buffer: Buffer): Promise<AVScanResult> {
  const scanResult: AVScanResult = {
    clean: true,
    scanTime: new Date()
  };

  try {
    const threats = await performAVScan(buffer);
    
    if (threats.length > 0) {
      scanResult.clean = false;
      scanResult.threats = threats;
    }
  } catch (error) {
    scanResult.clean = false;
    scanResult.threats = [`AV scan failed: ${error}`];
  }

  return scanResult;
}

async function performAVScan(buffer: Buffer): Promise<string[]> {
  const threats: string[] = [];
  
  const suspiciousPatterns = [
    { pattern: Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR', 'ascii'), name: 'EICAR-Test-String' },
    { pattern: Buffer.from('%PDF-1.'), name: 'PDF-Header' }
  ];

  for (const { pattern, name } of suspiciousPatterns) {
    if (name === 'EICAR-Test-String' && buffer.includes(pattern)) {
      threats.push(`Test virus detected: ${name}`);
    }
  }

  if (buffer.length > 0 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    threats.push('Executable file detected (MZ header)');
  }

  const javascriptPatterns = [
    /eval\s*\(/gi,
    /document\.write\s*\(/gi,
    /window\.location\s*=/gi
  ];

  const bufferStr = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
  for (const pattern of javascriptPatterns) {
    if (pattern.test(bufferStr)) {
      threats.push('Potentially malicious JavaScript detected');
      break;
    }
  }

  await new Promise(resolve => setTimeout(resolve, 10));

  return threats;
}