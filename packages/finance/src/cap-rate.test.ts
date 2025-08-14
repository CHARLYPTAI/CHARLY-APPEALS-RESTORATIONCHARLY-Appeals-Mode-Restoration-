import { describe, it, expect } from 'vitest';
import { calculateCapRate, calculateImpliedValue } from './cap-rate.js';

describe('calculateCapRate', () => {
  it('should calculate cap rate correctly', () => {
    const result = calculateCapRate(100000, 1250000);
    
    expect(result.capRate).toBe(0.08);
    expect(result.impliedValue).toBe(1250000);
  });

  it('should handle zero NOI', () => {
    const result = calculateCapRate(0, 1000000);
    
    expect(result.capRate).toBe(0);
    expect(result.impliedValue).toBe(1000000);
  });

  it('should throw error for negative NOI', () => {
    expect(() => calculateCapRate(-1000, 1000000)).toThrow('NOI must be non-negative');
  });

  it('should throw error for zero property value', () => {
    expect(() => calculateCapRate(100000, 0)).toThrow('Property value must be positive');
  });

  it('should throw error for negative property value', () => {
    expect(() => calculateCapRate(100000, -1000000)).toThrow('Property value must be positive');
  });
});

describe('calculateImpliedValue', () => {
  it('should calculate implied value correctly', () => {
    const result = calculateImpliedValue(100000, 0.08);
    
    expect(result.capRate).toBe(0.08);
    expect(result.impliedValue).toBe(1250000);
  });

  it('should handle zero NOI', () => {
    const result = calculateImpliedValue(0, 0.05);
    
    expect(result.capRate).toBe(0.05);
    expect(result.impliedValue).toBe(0);
  });

  it('should throw error for negative NOI', () => {
    expect(() => calculateImpliedValue(-1000, 0.08)).toThrow('NOI must be non-negative');
  });

  it('should throw error for zero market cap rate', () => {
    expect(() => calculateImpliedValue(100000, 0)).toThrow('Market cap rate must be positive');
  });

  it('should throw error for negative market cap rate', () => {
    expect(() => calculateImpliedValue(100000, -0.05)).toThrow('Market cap rate must be positive');
  });
});