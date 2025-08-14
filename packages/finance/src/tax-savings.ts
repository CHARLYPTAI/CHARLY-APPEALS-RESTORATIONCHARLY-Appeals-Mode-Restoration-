import type { PropertyFinancials, TaxSavingsCalculation, JurisdictionCosts } from './types.js';

export function calculateTaxSavings(
  currentAssessedValue: number,
  proposedAssessedValue: number,
  taxRate: number,
  jurisdictionCosts: JurisdictionCosts
): TaxSavingsCalculation {
  if (currentAssessedValue <= 0) {
    throw new Error('Current assessed value must be positive');
  }
  if (proposedAssessedValue < 0) {
    throw new Error('Proposed assessed value must be non-negative');
  }
  if (taxRate < 0 || taxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }

  const currentTaxes = currentAssessedValue * taxRate;
  const projectedTaxes = proposedAssessedValue * taxRate;
  const annualSavings = Math.max(0, currentTaxes - projectedTaxes);
  const tenYearSavings = annualSavings * 10;
  
  const appealCosts = jurisdictionCosts.appealFee + jurisdictionCosts.professionalFees;
  const netBenefit = tenYearSavings - appealCosts;
  const roi = appealCosts > 0 ? (tenYearSavings / appealCosts) - 1 : Infinity;

  return {
    currentTaxes,
    projectedTaxes,
    annualSavings,
    tenYearSavings,
    appealCosts,
    netBenefit,
    roi
  };
}

export function isAppealWorthwhile(
  taxSavings: TaxSavingsCalculation,
  minimumROI: number = 3.0
): boolean {
  return taxSavings.roi >= minimumROI && taxSavings.netBenefit > 0;
}