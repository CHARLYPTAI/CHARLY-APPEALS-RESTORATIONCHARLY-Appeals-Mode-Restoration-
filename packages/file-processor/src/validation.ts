import { fileTypeFromBuffer } from 'file-type';
import type { FileValidationResult } from './types.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png', 
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_REQUEST_SIZE = 200 * 1024 * 1024; // 200MB

export async function validateFile(
  buffer: Buffer, 
  declaredMimeType: string,
  filename: string
): Promise<FileValidationResult> {
  const errors: string[] = [];
  
  if (buffer.length > MAX_FILE_SIZE) {
    errors.push(`File size ${buffer.length} exceeds maximum ${MAX_FILE_SIZE} bytes`);
  }

  if (!ALLOWED_MIME_TYPES.has(declaredMimeType)) {
    errors.push(`MIME type ${declaredMimeType} not allowed`);
  }

  let actualMimeType: string | undefined;
  try {
    const detectedType = await fileTypeFromBuffer(buffer);
    actualMimeType = detectedType?.mime;
    
    if (actualMimeType && actualMimeType !== declaredMimeType) {
      if (!ALLOWED_MIME_TYPES.has(actualMimeType)) {
        errors.push(`Detected MIME type ${actualMimeType} not allowed`);
      } else {
        errors.push(`MIME type mismatch: declared ${declaredMimeType}, detected ${actualMimeType}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to detect file type: ${error}`);
  }

  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.com$/i,
    /\.pif$/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(filename))) {
    errors.push(`Suspicious file extension in filename: ${filename}`);
  }

  return {
    valid: errors.length === 0,
    mimeType: declaredMimeType,
    actualMimeType,
    fileSize: buffer.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validateRequestSize(totalSize: number): boolean {
  return totalSize <= MAX_REQUEST_SIZE;
}