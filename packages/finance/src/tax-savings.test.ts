import { describe, it, expect } from 'vitest';
import { calculateTaxSavings, isAppealWorthwhile } from './tax-savings.js';
import type { JurisdictionCosts } from './types.js';

describe('calculateTaxSavings', () => {
  const basicCosts: JurisdictionCosts = {
    appealFee: 1000,
    professionalFees: 4000,
    estimatedTime: 180
  };

  it('should calculate tax savings correctly', () => {
    const result = calculateTaxSavings(2500000, 2000000, 0.012, basicCosts);
    
    expect(result.currentTaxes).toBe(30000);
    expect(result.projectedTaxes).toBe(24000);
    expect(result.annualSavings).toBe(6000);
    expect(result.tenYearSavings).toBe(60000);
    expect(result.appealCosts).toBe(5000);
    expect(result.netBenefit).toBe(55000);
    expect(result.roi).toBe(11);
  });

  it('should handle no savings scenario', () => {
    const result = calculateTaxSavings(2000000, 2500000, 0.012, basicCosts);
    
    expect(result.currentTaxes).toBe(24000);
    expect(result.projectedTaxes).toBe(30000);
    expect(result.annualSavings).toBe(0);
    expect(result.tenYearSavings).toBe(0);
    expect(result.appealCosts).toBe(5000);
    expect(result.netBenefit).toBe(-5000);
    expect(result.roi).toBe(-1);
  });

  it('should handle zero proposed assessed value', () => {
    const result = calculateTaxSavings(2500000, 0, 0.012, basicCosts);
    
    expect(result.currentTaxes).toBe(30000);
    expect(result.projectedTaxes).toBe(0);
    expect(result.annualSavings).toBe(30000);
    expect(result.tenYearSavings).toBe(300000);
    expect(result.netBenefit).toBe(295000);
  });

  it('should handle zero appeal costs', () => {
    const zeroCosts: JurisdictionCosts = {
      appealFee: 0,
      professionalFees: 0,
      estimatedTime: 30
    };
    
    const result = calculateTaxSavings(2500000, 2000000, 0.012, zeroCosts);
    
    expect(result.appealCosts).toBe(0);
    expect(result.roi).toBe(Infinity);
  });

  it('should throw error for zero current assessed value', () => {
    expect(() => calculateTaxSavings(0, 2000000, 0.012, basicCosts))
      .toThrow('Current assessed value must be positive');
  });

  it('should throw error for negative current assessed value', () => {
    expect(() => calculateTaxSavings(-1000000, 2000000, 0.012, basicCosts))
      .toThrow('Current assessed value must be positive');
  });

  it('should throw error for negative proposed assessed value', () => {
    expect(() => calculateTaxSavings(2500000, -1000, 0.012, basicCosts))
      .toThrow('Proposed assessed value must be non-negative');
  });

  it('should throw error for negative tax rate', () => {
    expect(() => calculateTaxSavings(2500000, 2000000, -0.01, basicCosts))
      .toThrow('Tax rate must be between 0 and 1');
  });

  it('should throw error for tax rate greater than 1', () => {
    expect(() => calculateTaxSavings(2500000, 2000000, 1.5, basicCosts))
      .toThrow('Tax rate must be between 0 and 1');
  });
});

describe('isAppealWorthwhile', () => {
  it('should return true for worthwhile appeal with default ROI', () => {
    const savings = {
      currentTaxes: 30000,
      projectedTaxes: 24000,
      annualSavings: 6000,
      tenYearSavings: 60000,
      appealCosts: 5000,
      netBenefit: 55000,
      roi: 11
    };
    
    expect(isAppealWorthwhile(savings)).toBe(true);
  });

  it('should return false for marginal appeal with default ROI', () => {
    const savings = {
      currentTaxes: 30000,
      projectedTaxes: 28000,
      annualSavings: 2000,
      tenYearSavings: 20000,
      appealCosts: 15000,
      netBenefit: 5000,
      roi: 0.33
    };
    
    expect(isAppealWorthwhile(savings)).toBe(false);
  });

  it('should respect custom minimum ROI', () => {
    const savings = {
      currentTaxes: 30000,
      projectedTaxes: 28000,
      annualSavings: 2000,
      tenYearSavings: 20000,
      appealCosts: 15000,
      netBenefit: 5000,
      roi: 0.33
    };
    
    expect(isAppealWorthwhile(savings, 0.25)).toBe(true);
    expect(isAppealWorthwhile(savings, 0.5)).toBe(false);
  });

  it('should return false for negative net benefit even with high ROI', () => {
    const savings = {
      currentTaxes: 10000,
      projectedTaxes: 8000,
      annualSavings: 2000,
      tenYearSavings: 20000,
      appealCosts: 25000,
      netBenefit: -5000,
      roi: -0.2
    };
    
    expect(isAppealWorthwhile(savings)).toBe(false);
  });
});