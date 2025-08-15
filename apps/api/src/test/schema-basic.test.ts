import { test, expect, describe } from 'vitest';
import { validateRuleTemplate, formatValidationErrors } from '../utils/schema-validator.js';

describe('Basic Schema Validation Tests', () => {
  
  test('validates a minimal valid rule template', () => {
    const minimalTemplate = {
      name: "Test Template",
      version: "1.0.0",
      tenantType: "COMMERCIAL",
      rules: {
        valuation: {
          approaches: {
            sales: {
              enabled: true
            }
          }
        },
        appeal: {
          filingDeadline: {
            daysFromNotice: 30
          },
          evidenceRequirements: [
            {
              type: "property_photos",
              required: true
            }
          ]
        }
      }
    };
    
    const result = validateRuleTemplate(minimalTemplate);
    expect(result.valid).toBe(true);
  });

  test('fails validation for missing required fields', () => {
    const invalidTemplate = {
      version: "1.0.0",
      tenantType: "COMMERCIAL"
      // Missing name and rules
    };
    
    const result = validateRuleTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  test('validates tenant type enum', () => {
    const invalidTemplate = {
      name: "Test",
      version: "1.0.0",
      tenantType: "INVALID_TYPE",
      rules: {
        valuation: {
          approaches: {
            sales: { enabled: true }
          }
        },
        appeal: {
          filingDeadline: { daysFromNotice: 30 },
          evidenceRequirements: [{ type: "property_photos", required: true }]
        }
      }
    };
    
    const result = validateRuleTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates version format', () => {
    const invalidTemplate = {
      name: "Test",
      version: "1.0", // Invalid - should be x.y.z
      tenantType: "COMMERCIAL",
      rules: {
        valuation: {
          approaches: {
            sales: { enabled: true }
          }
        },
        appeal: {
          filingDeadline: { daysFromNotice: 30 },
          evidenceRequirements: [{ type: "property_photos", required: true }]
        }
      }
    };
    
    const result = validateRuleTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('requires at least one valuation approach', () => {
    const invalidTemplate = {
      name: "Test",
      version: "1.0.0",
      tenantType: "COMMERCIAL",
      rules: {
        valuation: {
          approaches: {} // Empty approaches
        },
        appeal: {
          filingDeadline: { daysFromNotice: 30 },
          evidenceRequirements: [{ type: "property_photos", required: true }]
        }
      }
    };
    
    const result = validateRuleTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('validates evidence requirement types', () => {
    const invalidTemplate = {
      name: "Test",
      version: "1.0.0",
      tenantType: "COMMERCIAL",
      rules: {
        valuation: {
          approaches: {
            sales: { enabled: true }
          }
        },
        appeal: {
          filingDeadline: { daysFromNotice: 30 },
          evidenceRequirements: [
            {
              type: "invalid_type", // Invalid evidence type
              required: true
            }
          ]
        }
      }
    };
    
    const result = validateRuleTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('formats validation errors correctly', () => {
    const result = validateRuleTemplate({});
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    
    const formatted = formatValidationErrors(result.errors!);
    expect(Array.isArray(formatted)).toBe(true);
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted.every(error => typeof error === 'string')).toBe(true);
  });

  test('handles null and undefined inputs', () => {
    const nullResult = validateRuleTemplate(null);
    expect(nullResult.valid).toBe(false);
    
    const undefinedResult = validateRuleTemplate(undefined);
    expect(undefinedResult.valid).toBe(false);
  });

  test('validates filing deadline range', () => {
    const invalidTemplate = {
      name: "Test",
      version: "1.0.0",
      tenantType: "COMMERCIAL",
      rules: {
        valuation: {
          approaches: {
            sales: { enabled: true }
          }
        },
        appeal: {
          filingDeadline: { daysFromNotice: 500 }, // > 365 max
          evidenceRequirements: [{ type: "property_photos", required: true }]
        }
      }
    };
    
    const result = validateRuleTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  test('requires evidence requirements array to have at least one item', () => {
    const invalidTemplate = {
      name: "Test",
      version: "1.0.0",
      tenantType: "COMMERCIAL",
      rules: {
        valuation: {
          approaches: {
            sales: { enabled: true }
          }
        },
        appeal: {
          filingDeadline: { daysFromNotice: 30 },
          evidenceRequirements: [] // Empty array
        }
      }
    };
    
    const result = validateRuleTemplate(invalidTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});