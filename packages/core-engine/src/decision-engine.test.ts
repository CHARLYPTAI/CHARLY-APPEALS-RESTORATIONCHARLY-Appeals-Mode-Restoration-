import { describe, it, expect } from 'vitest';
import { makeAssessmentDecision } from './decision-engine.js';
import type { DecisionInput, DecisionBands } from './types.js';

describe('makeAssessmentDecision', () => {
  const baseInput: DecisionInput = {
    assessedValue: 2500000,
    estimatedMarketValue: 3000000,
    valueConfidence: 0.85,
    taxRate: 0.012,
    jurisdictionPriors: {
      successRate: 0.65,
      averageFees: 5000,
      averageTimeToResolution: 180,
      reassessmentRisk: 0.15
    }
  };

  it('should classify overassessed property as OVER', () => {
    const result = makeAssessmentDecision(baseInput);
    
    expect(result.label).toBe('OVER');
    expect(result.rationale).toContain('Property assessed at 83.3% of estimated market value');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.savingsEstimate).toBeGreaterThan(0);
  });

  it('should classify underassessed property as UNDER', () => {
    const underassessedInput: DecisionInput = {
      ...baseInput,
      assessedValue: 2700000,
      estimatedMarketValue: 3000000
    };
    
    const result = makeAssessmentDecision(underassessedInput);
    
    expect(result.label).toBe('UNDER');
    expect(result.rationale).toContain('Property assessed at 90.0% of estimated market value');
    expect(result.rationale).toContain('Warning: Appeal could trigger reassessment upward');
  });

  it('should classify fairly assessed property as FAIR', () => {
    const fairInput: DecisionInput = {
      ...baseInput,
      assessedValue: 3000000,
      estimatedMarketValue: 3000000
    };
    
    const result = makeAssessmentDecision(fairInput);
    
    expect(result.label).toBe('FAIR');
    expect(result.rationale).toContain('Assessment ratio 100.0% within normal range');
  });

  it('should classify as FAIR when confidence is too low', () => {
    const lowConfidenceInput: DecisionInput = {
      ...baseInput,
      valueConfidence: 0.5
    };
    
    const result = makeAssessmentDecision(lowConfidenceInput);
    
    expect(result.label).toBe('FAIR');
    expect(result.rationale).toContain('Value confidence 50.0% below minimum threshold');
  });

  it('should handle custom decision bands', () => {
    const customBands: DecisionBands = {
      overThreshold: 1.10,
      underThreshold: 0.90,
      confidenceMinimum: 0.8
    };
    
    const input: DecisionInput = {
      ...baseInput,
      assessedValue: 2700000,
      estimatedMarketValue: 3000000
    };
    
    const result = makeAssessmentDecision(input, customBands);
    
    expect(result.label).toBe('FAIR');
  });

  it('should calculate sensitivity analysis', () => {
    const result = makeAssessmentDecision(baseInput);
    
    expect(result.sensitivity.atValueMinus5Percent).toBeDefined();
    expect(result.sensitivity.atValueMinus10Percent).toBeDefined();
    expect(result.sensitivity.atValuePlus5Percent).toBeDefined();
    expect(result.sensitivity.atValuePlus10Percent).toBeDefined();
  });

  it('should reduce confidence for underassessed properties due to reassessment risk', () => {
    const underInput: DecisionInput = {
      ...baseInput,
      assessedValue: 2700000,
      estimatedMarketValue: 3000000
    };
    
    const result = makeAssessmentDecision(underInput);
    
    expect(result.confidence).toBeLessThan(baseInput.valueConfidence);
  });

  describe('input validation', () => {
    it('should throw error for zero assessed value', () => {
      const invalidInput = { ...baseInput, assessedValue: 0 };
      expect(() => makeAssessmentDecision(invalidInput)).toThrow('Assessed value must be positive');
    });

    it('should throw error for negative assessed value', () => {
      const invalidInput = { ...baseInput, assessedValue: -1000000 };
      expect(() => makeAssessmentDecision(invalidInput)).toThrow('Assessed value must be positive');
    });

    it('should throw error for zero estimated market value', () => {
      const invalidInput = { ...baseInput, estimatedMarketValue: 0 };
      expect(() => makeAssessmentDecision(invalidInput)).toThrow('Estimated market value must be positive');
    });

    it('should throw error for negative estimated market value', () => {
      const invalidInput = { ...baseInput, estimatedMarketValue: -1000000 };
      expect(() => makeAssessmentDecision(invalidInput)).toThrow('Estimated market value must be positive');
    });

    it('should throw error for value confidence out of range', () => {
      expect(() => makeAssessmentDecision({ ...baseInput, valueConfidence: -0.1 }))
        .toThrow('Value confidence must be between 0 and 1');
      expect(() => makeAssessmentDecision({ ...baseInput, valueConfidence: 1.1 }))
        .toThrow('Value confidence must be between 0 and 1');
    });

    it('should throw error for tax rate out of range', () => {
      expect(() => makeAssessmentDecision({ ...baseInput, taxRate: -0.01 }))
        .toThrow('Tax rate must be between 0 and 1');
      expect(() => makeAssessmentDecision({ ...baseInput, taxRate: 1.1 }))
        .toThrow('Tax rate must be between 0 and 1');
    });

    it('should throw error for success rate out of range', () => {
      const invalidInput = {
        ...baseInput,
        jurisdictionPriors: { ...baseInput.jurisdictionPriors, successRate: 1.5 }
      };
      expect(() => makeAssessmentDecision(invalidInput))
        .toThrow('Success rate must be between 0 and 1');
    });

    it('should throw error for negative average fees', () => {
      const invalidInput = {
        ...baseInput,
        jurisdictionPriors: { ...baseInput.jurisdictionPriors, averageFees: -1000 }
      };
      expect(() => makeAssessmentDecision(invalidInput))
        .toThrow('Average fees must be non-negative');
    });

    it('should throw error for reassessment risk out of range', () => {
      const invalidInput = {
        ...baseInput,
        jurisdictionPriors: { ...baseInput.jurisdictionPriors, reassessmentRisk: 1.5 }
      };
      expect(() => makeAssessmentDecision(invalidInput))
        .toThrow('Reassessment risk must be between 0 and 1');
    });
  });

  describe('decision bands validation', () => {
    it('should throw error for over threshold less than or equal to 1', () => {
      const invalidBands: DecisionBands = {
        overThreshold: 1.0,
        underThreshold: 0.95,
        confidenceMinimum: 0.7
      };
      expect(() => makeAssessmentDecision(baseInput, invalidBands))
        .toThrow('Over threshold must be greater than 1');
    });

    it('should throw error for under threshold greater than or equal to 1', () => {
      const invalidBands: DecisionBands = {
        overThreshold: 1.05,
        underThreshold: 1.0,
        confidenceMinimum: 0.7
      };
      expect(() => makeAssessmentDecision(baseInput, invalidBands))
        .toThrow('Under threshold must be less than 1');
    });

    it('should throw error for confidence minimum out of range', () => {
      const invalidBands: DecisionBands = {
        overThreshold: 1.05,
        underThreshold: 0.95,
        confidenceMinimum: 1.5
      };
      expect(() => makeAssessmentDecision(baseInput, invalidBands))
        .toThrow('Confidence minimum must be between 0 and 1');
    });
  });
});