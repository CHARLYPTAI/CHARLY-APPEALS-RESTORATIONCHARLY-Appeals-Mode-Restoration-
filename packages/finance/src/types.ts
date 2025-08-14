export interface PropertyFinancials {
  grossRentalIncome: number;
  operatingExpenses: number;
  vacancyRate: number;
  assessedValue: number;
  marketValue?: number;
  taxRate: number;
  currentTaxes: number;
}

export interface NOICalculation {
  netOperatingIncome: number;
  effectiveGrossIncome: number;
  vacancy: number;
}

export interface CapRateCalculation {
  capRate: number;
  impliedValue: number;
}

export interface TaxSavingsCalculation {
  currentTaxes: number;
  projectedTaxes: number;
  annualSavings: number;
  tenYearSavings: number;
  appealCosts: number;
  netBenefit: number;
  roi: number;
}

export interface JurisdictionCosts {
  appealFee: number;
  professionalFees: number;
  estimatedTime: number;
}