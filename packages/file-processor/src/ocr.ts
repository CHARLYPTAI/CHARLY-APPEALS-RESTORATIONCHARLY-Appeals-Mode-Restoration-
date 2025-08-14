import type { OCRResult } from './types.js';

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<OCRResult> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }
  
  if (mimeType.startsWith('image/')) {
    return extractTextFromImage(buffer);
  }

  return {
    text: '',
    confidence: 0,
    language: 'unknown'
  };
}

async function extractTextFromPDF(buffer: Buffer): Promise<OCRResult> {
  try {
    const text = await mockPDFExtraction(buffer);
    
    return {
      text,
      confidence: 0.95,
      language: 'en',
      pages: [
        {
          pageNumber: 1,
          text,
          confidence: 0.95
        }
      ]
    };
  } catch (error) {
    return {
      text: '',
      confidence: 0,
      language: 'unknown'
    };
  }
}

async function extractTextFromImage(buffer: Buffer): Promise<OCRResult> {
  try {
    const text = await mockImageOCR(buffer);
    
    return {
      text,
      confidence: 0.85,
      language: 'en'
    };
  } catch (error) {
    return {
      text: '',
      confidence: 0,
      language: 'unknown'
    };
  }
}

async function mockPDFExtraction(buffer: Buffer): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (buffer.length < 100) {
    throw new Error('Invalid PDF');
  }

  return `Sample PDF text content extracted from ${buffer.length} byte file.
Property Name: Commercial Plaza
Address: 123 Business Ave
Assessed Value: $2,500,000
Market Value: $3,000,000`;
}

async function mockImageOCR(buffer: Buffer): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  if (buffer.length < 100) {
    throw new Error('Invalid image');
  }

  return `Text extracted from image (${buffer.length} bytes)
Property assessment document
Tax year: 2023`;
}