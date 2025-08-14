export type DecisionLabel = 'OVER' | 'FAIR' | 'UNDER';

export interface DecisionInput {
  assessedValue: number;
  estimatedMarketValue: number;
  valueConfidence: number;
  taxRate: number;
  jurisdictionPriors: JurisdictionPriors;
}

export interface JurisdictionPriors {
  successRate: number;
  averageFees: number;
  averageTimeToResolution: number;
  reassessmentRisk: number;
}

export interface DecisionOutput {
  label: DecisionLabel;
  rationale: string[];
  savingsEstimate: number;
  sensitivity: SensitivityAnalysis;
  confidence: number;
}

export interface SensitivityAnalysis {
  atValueMinus5Percent: DecisionLabel;
  atValueMinus10Percent: DecisionLabel;
  atValuePlus5Percent: DecisionLabel;
  atValuePlus10Percent: DecisionLabel;
}

export interface DecisionBands {
  overThreshold: number;
  underThreshold: number;
  confidenceMinimum: number;
}