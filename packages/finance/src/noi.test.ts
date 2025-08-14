import { describe, it, expect } from 'vitest';
import { calculateNOI } from './noi.js';
import type { PropertyFinancials } from './types.js';

describe('calculateNOI', () => {
  it('should calculate NOI correctly with typical values', () => {
    const financials: PropertyFinancials = {
      grossRentalIncome: 100000,
      operatingExpenses: 30000,
      vacancyRate: 0.05,
      assessedValue: 1000000,
      taxRate: 0.012,
      currentTaxes: 12000
    };

    const result = calculateNOI(financials);

    expect(result.vacancy).toBe(5000);
    expect(result.effectiveGrossIncome).toBe(95000);
    expect(result.netOperatingIncome).toBe(65000);
  });

  it('should handle zero vacancy rate', () => {
    const financials: PropertyFinancials = {
      grossRentalIncome: 100000,
      operatingExpenses: 25000,
      vacancyRate: 0,
      assessedValue: 1000000,
      taxRate: 0.012,
      currentTaxes: 12000
    };

    const result = calculateNOI(financials);

    expect(result.vacancy).toBe(0);
    expect(result.effectiveGrossIncome).toBe(100000);
    expect(result.netOperatingIncome).toBe(75000);
  });

  it('should handle 100% vacancy rate', () => {
    const financials: PropertyFinancials = {
      grossRentalIncome: 100000,
      operatingExpenses: 25000,
      vacancyRate: 1.0,
      assessedValue: 1000000,
      taxRate: 0.012,
      currentTaxes: 12000
    };

    const result = calculateNOI(financials);

    expect(result.vacancy).toBe(100000);
    expect(result.effectiveGrossIncome).toBe(0);
    expect(result.netOperatingIncome).toBe(-25000);
  });

  it('should throw error for negative gross rental income', () => {
    const financials: PropertyFinancials = {
      grossRentalIncome: -1000,
      operatingExpenses: 25000,
      vacancyRate: 0.05,
      assessedValue: 1000000,
      taxRate: 0.012,
      currentTaxes: 12000
    };

    expect(() => calculateNOI(financials)).toThrow('Gross rental income must be non-negative');
  });

  it('should throw error for negative operating expenses', () => {
    const financials: PropertyFinancials = {
      grossRentalIncome: 100000,
      operatingExpenses: -1000,
      vacancyRate: 0.05,
      assessedValue: 1000000,
      taxRate: 0.012,
      currentTaxes: 12000
    };

    expect(() => calculateNOI(financials)).toThrow('Operating expenses must be non-negative');
  });

  it('should throw error for negative vacancy rate', () => {
    const financials: PropertyFinancials = {
      grossRentalIncome: 100000,
      operatingExpenses: 25000,
      vacancyRate: -0.1,
      assessedValue: 1000000,
      taxRate: 0.012,
      currentTaxes: 12000
    };

    expect(() => calculateNOI(financials)).toThrow('Vacancy rate must be between 0 and 1');
  });

  it('should throw error for vacancy rate greater than 1', () => {
    const financials: PropertyFinancials = {
      grossRentalIncome: 100000,
      operatingExpenses: 25000,
      vacancyRate: 1.5,
      assessedValue: 1000000,
      taxRate: 0.012,
      currentTaxes: 12000
    };

    expect(() => calculateNOI(financials)).toThrow('Vacancy rate must be between 0 and 1');
  });
});