import type { CapRateCalculation } from './types.js';

export function calculateCapRate(noi: number, propertyValue: number): CapRateCalculation {
  if (noi < 0) {
    throw new Error('NOI must be non-negative');
  }
  if (propertyValue <= 0) {
    throw new Error('Property value must be positive');
  }

  const capRate = noi / propertyValue;
  
  return {
    capRate,
    impliedValue: propertyValue
  };
}

export function calculateImpliedValue(noi: number, marketCapRate: number): CapRateCalculation {
  if (noi < 0) {
    throw new Error('NOI must be non-negative');
  }
  if (marketCapRate <= 0) {
    throw new Error('Market cap rate must be positive');
  }

  const impliedValue = noi / marketCapRate;
  
  return {
    capRate: marketCapRate,
    impliedValue
  };
}