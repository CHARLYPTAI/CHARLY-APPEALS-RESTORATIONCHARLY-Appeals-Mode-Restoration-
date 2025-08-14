import type { 
  DecisionInput, 
  DecisionOutput, 
  DecisionLabel, 
  DecisionBands,
  SensitivityAnalysis 
} from './types.js';
import { calculateTaxSavings, isAppealWorthwhile } from '@charly/finance';

const DEFAULT_BANDS: DecisionBands = {
  overThreshold: 1.05,
  underThreshold: 0.95,
  confidenceMinimum: 0.7
};

export function makeAssessmentDecision(
  input: DecisionInput,
  bands: DecisionBands = DEFAULT_BANDS
): DecisionOutput {
  validateInput(input, bands);

  const assessmentRatio = input.assessedValue / input.estimatedMarketValue;
  const rationale: string[] = [];
  
  const taxSavings = calculateTaxSavings(
    input.assessedValue,
    input.estimatedMarketValue,
    input.taxRate,
    {
      appealFee: input.jurisdictionPriors.averageFees * 0.3,
      professionalFees: input.jurisdictionPriors.averageFees * 0.7,
      estimatedTime: input.jurisdictionPriors.averageTimeToResolution
    }
  );

  const expectedSavings = taxSavings.tenYearSavings * input.jurisdictionPriors.successRate;
  const expectedCosts = taxSavings.appealCosts;
  const expectedValue = expectedSavings - expectedCosts;

  let label: DecisionLabel;
  let confidence = input.valueConfidence;

  if (assessmentRatio >= bands.overThreshold && input.valueConfidence >= bands.confidenceMinimum) {
    if (expectedValue > 0 && isAppealWorthwhile(taxSavings)) {
      label = 'OVER';
      rationale.push(`Property assessed at ${(assessmentRatio * 100).toFixed(1)}% of estimated market value`);
      rationale.push(`Expected 10-year savings: $${expectedSavings.toLocaleString()}`);
      rationale.push(`Expected costs: $${expectedCosts.toLocaleString()}`);
      rationale.push(`Jurisdiction success rate: ${(input.jurisdictionPriors.successRate * 100).toFixed(1)}%`);
    } else {
      label = 'FAIR';
      rationale.push(`Assessment ratio ${(assessmentRatio * 100).toFixed(1)}% suggests overassessment`);
      rationale.push(`However, expected costs ($${expectedCosts.toLocaleString()}) exceed expected savings`);
      rationale.push(`Appeal not economically justified at this time`);
    }
  } else if (assessmentRatio <= bands.underThreshold && input.valueConfidence >= bands.confidenceMinimum) {
    label = 'UNDER';
    rationale.push(`Property assessed at ${(assessmentRatio * 100).toFixed(1)}% of estimated market value`);
    rationale.push(`Assessment appears favorable to property owner`);
    rationale.push(`Warning: Appeal could trigger reassessment upward`);
    rationale.push(`Reassessment risk: ${(input.jurisdictionPriors.reassessmentRisk * 100).toFixed(1)}%`);
    confidence *= (1 - input.jurisdictionPriors.reassessmentRisk * 0.5);
  } else {
    label = 'FAIR';
    if (input.valueConfidence < bands.confidenceMinimum) {
      rationale.push(`Value confidence ${(input.valueConfidence * 100).toFixed(1)}% below minimum threshold`);
      rationale.push(`Additional market analysis recommended before proceeding`);
    } else {
      rationale.push(`Assessment ratio ${(assessmentRatio * 100).toFixed(1)}% within normal range`);
      rationale.push(`No significant overassessment detected`);
    }
  }

  const sensitivity = calculateSensitivity(input, bands);

  return {
    label,
    rationale,
    savingsEstimate: Math.max(0, expectedSavings),
    sensitivity,
    confidence: Math.max(0, Math.min(1, confidence))
  };
}

function calculateSensitivity(input: DecisionInput, bands: DecisionBands): SensitivityAnalysis {
  const scenarios = [
    { factor: 0.95, key: 'atValueMinus5Percent' as const },
    { factor: 0.90, key: 'atValueMinus10Percent' as const },
    { factor: 1.05, key: 'atValuePlus5Percent' as const },
    { factor: 1.10, key: 'atValuePlus10Percent' as const }
  ];

  const result = {} as SensitivityAnalysis;

  for (const scenario of scenarios) {
    const adjustedInput = {
      ...input,
      estimatedMarketValue: input.estimatedMarketValue * scenario.factor
    };
    const decision = makeAssessmentDecision(adjustedInput, bands);
    result[scenario.key] = decision.label;
  }

  return result;
}

function validateInput(input: DecisionInput, bands: DecisionBands): void {
  if (input.assessedValue <= 0) {
    throw new Error('Assessed value must be positive');
  }
  if (input.estimatedMarketValue <= 0) {
    throw new Error('Estimated market value must be positive');
  }
  if (input.valueConfidence < 0 || input.valueConfidence > 1) {
    throw new Error('Value confidence must be between 0 and 1');
  }
  if (input.taxRate < 0 || input.taxRate > 1) {
    throw new Error('Tax rate must be between 0 and 1');
  }
  if (input.jurisdictionPriors.successRate < 0 || input.jurisdictionPriors.successRate > 1) {
    throw new Error('Success rate must be between 0 and 1');
  }
  if (input.jurisdictionPriors.averageFees < 0) {
    throw new Error('Average fees must be non-negative');
  }
  if (input.jurisdictionPriors.reassessmentRisk < 0 || input.jurisdictionPriors.reassessmentRisk > 1) {
    throw new Error('Reassessment risk must be between 0 and 1');
  }
  if (bands.overThreshold <= 1) {
    throw new Error('Over threshold must be greater than 1');
  }
  if (bands.underThreshold >= 1) {
    throw new Error('Under threshold must be less than 1');
  }
  if (bands.confidenceMinimum < 0 || bands.confidenceMinimum > 1) {
    throw new Error('Confidence minimum must be between 0 and 1');
  }
}