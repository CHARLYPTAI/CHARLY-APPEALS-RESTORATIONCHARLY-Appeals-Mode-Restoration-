import { createHash } from 'crypto';
import type { HashResult } from './types.js';

const hashRegistry = new Map<string, string>();

export function calculateHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function checkForDuplicate(buffer: Buffer, uploadId: string): HashResult {
  const hash = calculateHash(buffer);
  
  const existingUploadId = hashRegistry.get(hash);
  
  if (existingUploadId && existingUploadId !== uploadId) {
    return {
      sha256: hash,
      isDuplicate: true,
      existingUploadId
    };
  }

  hashRegistry.set(hash, uploadId);
  
  return {
    sha256: hash,
    isDuplicate: false
  };
}

export function clearHashRegistry(): void {
  hashRegistry.clear();
}