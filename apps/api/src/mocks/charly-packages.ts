// Mock implementations for CHARLY packages

export interface CommercialPropertyCore {
  assessedValue: number;
  marketValue?: number;
  taxRate: number;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface DecisionInput {
  assessedValue: number;
  estimatedMarketValue: number;
  valueConfidence: number;
  taxRate: number;
  jurisdictionPriors: {
    successRate: number;
    averageFees: number;
    averageTimeToResolution: number;
    reassessmentRisk: number;
  };
}

export interface AssessmentDecision {
  label: 'OVER' | 'FAIR' | 'UNDER';
  confidence: number;
  savingsEstimate: number;
}

export function validateCommercialPropertySafe(property: unknown): { valid: boolean; data?: CommercialPropertyCore; errors?: string[] } {
  if (!property || typeof property !== 'object') {
    return { valid: false, errors: ['Property data is required'] };
  }

  const prop = property as any;
  
  if (typeof prop.assessedValue !== 'number' || prop.assessedValue <= 0) {
    return { valid: false, errors: ['Valid assessed value is required'] };
  }

  if (typeof prop.taxRate !== 'number' || prop.taxRate <= 0) {
    return { valid: false, errors: ['Valid tax rate is required'] };
  }

  return {
    valid: true,
    data: {
      assessedValue: prop.assessedValue,
      marketValue: prop.marketValue,
      taxRate: prop.taxRate,
      address: prop.address
    }
  };
}

export function makeAssessmentDecision(input: DecisionInput): AssessmentDecision {
  const ratio = input.assessedValue / input.estimatedMarketValue;
  
  let label: 'OVER' | 'FAIR' | 'UNDER';
  let confidence: number;
  let savingsEstimate: number;

  if (ratio > 1.1) {
    label = 'OVER';
    confidence = Math.min(0.95, 0.6 + (ratio - 1.1) * 2);
    savingsEstimate = (input.assessedValue - input.estimatedMarketValue) * input.taxRate;
  } else if (ratio < 0.9) {
    label = 'UNDER';
    confidence = Math.min(0.95, 0.6 + (0.9 - ratio) * 2);
    savingsEstimate = 0;
  } else {
    label = 'FAIR';
    confidence = Math.min(0.95, 0.8 - Math.abs(ratio - 1) * 4);
    savingsEstimate = 0;
  }

  return {
    label,
    confidence,
    savingsEstimate: Math.max(0, savingsEstimate)
  };
}

// File processor mocks
export async function validateFile(buffer: Buffer, mimeType: string, filename: string): Promise<{ valid: boolean; errors?: string[] }> {
  if (!buffer || buffer.length === 0) {
    return { valid: false, errors: ['Empty file'] };
  }

  const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, errors: [`Unsupported file type: ${mimeType}`] };
  }

  return { valid: true };
}

export async function scanForViruses(buffer: Buffer): Promise<{ clean: boolean; threats?: string[] }> {
  // Mock implementation - always returns clean
  return { clean: true };
}

export async function scrubEXIF(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer }> {
  // Mock implementation - returns same buffer
  return { buffer };
}

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<{ text: string; confidence: number }> {
  // Mock implementation
  return {
    text: 'Mock extracted text content',
    confidence: 0.95
  };
}

export async function generateThumbnail(buffer: Buffer, mimeType: string): Promise<Buffer> {
  // Mock implementation - returns same buffer
  return buffer;
}

export function checkForDuplicate(buffer: Buffer, uploadId: string): { isDuplicate: boolean; sha256: string } {
  // Mock implementation
  const hash = require('crypto').createHash('sha256').update(buffer).digest('hex');
  return {
    isDuplicate: false,
    sha256: hash
  };
}