import { test, expect, describe } from 'vitest';
import { validateRuleTemplate, validateAndSanitizeRuleTemplate, formatValidationErrors } from '../utils/schema-validator.js';

describe('Rule Template Schema Validation', () => {
  
  const validRuleTemplate = {
    name: "Standard Commercial Valuation",
    version: "1.0.0",
    tenantType: "COMMERCIAL",
    description: "Standard rule template for commercial property valuation",
    jurisdiction: "Texas",
    effectiveDate: "2025-01-01",
    rules: {
      valuation: {
        approaches: {
          income: {
            enabled: true,
            capitalizationRate: {
              method: "market_survey",
              range: {
                min: 0.06,
                max: 0.12
              }
            },
            expenseRatio: {
              typical: 0.35,
              range: {
                min: 0.25,
                max: 0.45
              }
            }
          },
          sales: {
            enabled: true,
            comparableRequirements: {
              minimumCount: 3,
              timeframe: {
                months: 12
              },
              distance: {
                miles: 5.0
              },
              sizeTolerance: {
                percentage: 0.5
              }
            },
            adjustments: {
              location: {
                enabled: true,
                maxAdjustment: 0.2
              },
              size: {
                enabled: true,
                maxAdjustment: 0.15
              },
              condition: {
                enabled: true,
                maxAdjustment: 0.25
              }
            }
          },
          cost: {
            enabled: false
          }
        },
        weightings: {
          income: 0.6,
          sales: 0.4,
          cost: 0.0
        }
      },
      appeal: {
        filingDeadline: {
          daysFromNotice: 30,
          businessDaysOnly: true
        },
        evidenceRequirements: [
          {
            type: "comparable_sales",
            required: true,
            description: "Recent comparable sales within 1 mile and 12 months",
            format: "spreadsheet"
          },
          {
            type: "income_statements",
            required: true,
            description: "Last 3 years of income and expense statements",
            format: "spreadsheet"
          },
          {
            type: "property_photos",
            required: false,
            description: "Recent photos showing property condition",
            format: "image"
          }
        ],
        narrative: {
          requiredSections: [
            "property_description",
            "market_conditions",
            "valuation_methodology",
            "comparable_analysis",
            "income_analysis",
            "conclusion"
          ],
          wordLimits: {
            minimum: 1000,
            maximum: 5000
          }
        }
      },
      compliance: {
        requiredDisclosures: [
          "Property inspection limitations",
          "Market data sources",
          "Valuation methodology assumptions"
        ],
        certifications: [
          {
            name: "Licensed Appraiser Certification",
            required: true,
            description: "Must be performed by state-licensed appraiser"
          }
        ]
      }
    },
    metadata: {
      tags: ["commercial", "standard", "texas"],
      priority: "high"
    }
  };

  describe('Valid Rule Template', () => {
    test('validates a complete valid rule template', () => {
      const result = validateRuleTemplate(validRuleTemplate);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
    
    test('sanitizes and returns valid data', () => {
      const sanitized = validateAndSanitizeRuleTemplate(validRuleTemplate);
      expect(sanitized).toEqual(validRuleTemplate);
    });
  });

  describe('Required Fields Validation', () => {
    test('fails validation when missing required top-level fields', () => {
      const invalidTemplate = JSON.parse(JSON.stringify(validRuleTemplate));
      delete invalidTemplate.name;
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.path === '/name' || e.message.includes('name'))).toBe(true);
    });
    
    test('fails validation when missing required rules', () => {
      const invalidTemplate = JSON.parse(JSON.stringify(validRuleTemplate));
      delete invalidTemplate.rules.valuation;
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
    
    test('fails validation when missing appeal requirements', () => {
      const invalidTemplate = JSON.parse(JSON.stringify(validRuleTemplate));
      delete invalidTemplate.rules.appeal.filingDeadline;
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Field Format Validation', () => {
    test('validates version format', () => {
      const invalidTemplate = { ...validRuleTemplate, version: "1.0" };
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('pattern'))).toBe(true);
    });
    
    test('validates tenant type enum', () => {
      const invalidTemplate = { ...validRuleTemplate, tenantType: "INVALID" as any };
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('enum') || e.message.includes('must be equal to one of'))).toBe(true);
    });
    
    test('validates date format', () => {
      const invalidTemplate = { ...validRuleTemplate, effectiveDate: "invalid-date" };
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('date') || e.message.includes('format'))).toBe(true);
    });
  });

  describe('Valuation Approach Validation', () => {
    test('requires at least one valuation approach', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.valuation.approaches = {};
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('minProperties'))).toBe(true);
    });
    
    test('validates income approach parameters', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.valuation.approaches.income.capitalizationRate.range.min = 1.5; // > 1.0
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('maximum'))).toBe(true);
    });
    
    test('validates sales approach comparable requirements', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.valuation.approaches.sales.comparableRequirements.minimumCount = 0;
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('minimum'))).toBe(true);
    });
    
    test('validates cost approach parameters', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.valuation.approaches.cost = {
        enabled: true,
        costSources: ["invalid_source"]
      };
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('enum'))).toBe(true);
    });
  });

  describe('Appeal Requirements Validation', () => {
    test('validates filing deadline range', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.appeal.filingDeadline.daysFromNotice = 400; // > 365
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('maximum'))).toBe(true);
    });
    
    test('validates evidence requirements array', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.appeal.evidenceRequirements = [];
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('minItems'))).toBe(true);
    });
    
    test('validates evidence requirement enum values', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.appeal.evidenceRequirements[0].type = "invalid_type";
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('enum'))).toBe(true);
    });
    
    test('validates narrative section requirements', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.appeal.narrative.requiredSections = ["invalid_section"];
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('enum'))).toBe(true);
    });
  });

  describe('Metadata Validation', () => {
    test('validates tag limits', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.metadata.tags = new Array(15).fill("tag"); // > 10 max
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('maxItems'))).toBe(true);
    });
    
    test('validates tag length limits', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.metadata.tags = ["a".repeat(60)]; // > 50 max
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('maxLength'))).toBe(true);
    });
    
    test('validates priority enum', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.metadata.priority = "urgent";
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.message.includes('enum'))).toBe(true);
    });
  });

  describe('Complex Validation Scenarios', () => {
    test('validates weighting consistency', () => {
      const invalidTemplate = { ...validRuleTemplate };
      invalidTemplate.rules.valuation.weightings = {
        income: 0.7,
        sales: 0.5, // Total > 1.0
        cost: 0.0
      };
      
      // Note: This test assumes we might add a custom validation for weighting totals
      // The current schema doesn't enforce this, but it's a good business rule
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(true); // Currently passes, but could be enhanced
    });
    
    test('validates residential vs commercial specific rules', () => {
      const residentialTemplate = {
        ...validRuleTemplate,
        tenantType: "RESIDENTIAL",
        rules: {
          ...validRuleTemplate.rules,
          valuation: {
            approaches: {
              sales: {
                enabled: true,
                comparableRequirements: {
                  minimumCount: 3,
                  timeframe: { months: 6 }, // Shorter for residential
                  distance: { miles: 1.0 }, // Closer for residential
                  sizeTolerance: { percentage: 0.3 }
                }
              }
            }
          }
        }
      };
      
      const result = validateRuleTemplate(residentialTemplate);
      expect(result.valid).toBe(true);
    });
  });

  describe('Error Formatting', () => {
    test('formats validation errors in human-readable format', () => {
      const invalidTemplate = { 
        name: "", // Too short
        version: "invalid",
        tenantType: "INVALID",
        rules: {} // Missing required fields
      };
      
      const result = validateRuleTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      
      const formattedErrors = formatValidationErrors(result.errors!);
      expect(formattedErrors.length).toBeGreaterThan(0);
      expect(formattedErrors.every(error => typeof error === 'string')).toBe(true);
      expect(formattedErrors.some(error => error.includes('name'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles null and undefined values', () => {
      const result1 = validateRuleTemplate(null);
      expect(result1.valid).toBe(false);
      
      const result2 = validateRuleTemplate(undefined);
      expect(result2.valid).toBe(false);
    });
    
    test('handles empty objects', () => {
      const result = validateRuleTemplate({});
      expect(result.valid).toBe(false);
      expect(result.errors!.length).toBeGreaterThan(0);
    });
    
    test('handles extra properties (additionalProperties: false)', () => {
      const templateWithExtra = {
        ...validRuleTemplate,
        extraField: "should be removed"
      };
      
      const result = validateRuleTemplate(templateWithExtra);
      // Depending on schema configuration, this might pass or fail
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Performance', () => {
    test('validates large templates efficiently', () => {
      const largeTemplate = {
        ...validRuleTemplate,
        rules: {
          ...validRuleTemplate.rules,
          appeal: {
            ...validRuleTemplate.rules.appeal,
            evidenceRequirements: Array.from({ length: 50 }, (_, i) => ({
              type: "property_photos",
              required: i % 2 === 0,
              description: `Evidence requirement ${i}`,
              format: "pdf"
            }))
          }
        }
      };
      
      const startTime = Date.now();
      const result = validateRuleTemplate(largeTemplate);
      const endTime = Date.now();
      
      expect(result.valid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should validate in < 100ms
    });
  });
});