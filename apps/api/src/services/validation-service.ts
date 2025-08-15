import { 
  validateCommercialPropertySafe,
  makeAssessmentDecision,
  type CommercialPropertyCore,
  type DecisionInput
} from '../mocks/charly-packages.js';
import type { ValidationResponse, CommercialValidationRequest } from '../types/api.js';
import { generateWorkfileId } from '../utils/id-generator.js';
import { createErrorBuilder, formatServiceError } from '../utils/error-handler.js';

export class ValidationService {
  async validateCommercial(request: CommercialValidationRequest): Promise<ValidationResponse> {
    const workfileId = generateWorkfileId();
    const errorBuilder = createErrorBuilder();

    const propertyValidation = validateCommercialPropertySafe(request.property);
    if (!propertyValidation.valid) {
      errorBuilder.addFromArray(propertyValidation.errors || []);
    }

    if (errorBuilder.hasErrors()) {
      return {
        workfile_id: workfileId,
        normalized: request.property,
        errors: errorBuilder.getErrors()
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
        errorBuilder.add(formatServiceError(error, 'Decision preview failed'));
      }
    }

    return {
      workfile_id: workfileId,
      normalized: property,
      errors: errorBuilder.getErrors(),
      decision_preview: decisionPreview
    };
  }

  async validateResidential(property: unknown): Promise<ValidationResponse> {
    const workfileId = generateWorkfileId();
    
    return {
      workfile_id: workfileId,
      normalized: property,
      errors: ['Residential validation not yet implemented']
    };
  }
}