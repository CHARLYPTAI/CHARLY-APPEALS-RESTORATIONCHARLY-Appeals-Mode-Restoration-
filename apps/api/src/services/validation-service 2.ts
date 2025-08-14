import { v4 as uuidv4 } from 'uuid';
import { 
  validateCommercialPropertySafe,
  type CommercialPropertyCore 
} from '@charly/contracts';
import { makeAssessmentDecision, type DecisionInput } from '@charly/core-engine';
import type { ValidationResponse, CommercialValidationRequest } from '../types/api.js';

export class ValidationService {
  async validateCommercial(request: CommercialValidationRequest): Promise<ValidationResponse> {
    const workfileId = uuidv4();
    const errors: string[] = [];

    const propertyValidation = validateCommercialPropertySafe(request.property);
    if (!propertyValidation.valid) {
      errors.push(...(propertyValidation.errors || []));
    }

    if (errors.length > 0) {
      return {
        workfile_id: workfileId,
        normalized: request.property,
        errors
      };
    }

    const property = propertyValidation.data as CommercialPropertyCore;
    
    let decisionPreview;
    if (property.marketValue) {
      try {
        const decisionInput: DecisionInput = {
          assessedValue: property.assessedValue,
          estimatedMarketValue: property.marketValue,
          valueConfidence: 0.8,
          taxRate: property.taxRate,
          jurisdictionPriors: {
            successRate: 0.65,
            averageFees: 5000,
            averageTimeToResolution: 180,
            reassessmentRisk: 0.15
          }
        };

        const decision = makeAssessmentDecision(decisionInput);
        decisionPreview = {
          label: decision.label,
          confidence: decision.confidence,
          savings_estimate: decision.savingsEstimate
        };
      } catch (error) {
        errors.push(`Decision preview failed: ${error}`);
      }
    }

    return {
      workfile_id: workfileId,
      normalized: property,
      errors,
      decision_preview: decisionPreview
    };
  }

  async validateResidential(property: unknown): Promise<ValidationResponse> {
    const workfileId = uuidv4();
    
    return {
      workfile_id: workfileId,
      normalized: property,
      errors: ['Residential validation not yet implemented']
    };
  }
}