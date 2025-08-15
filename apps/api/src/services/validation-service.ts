import { 
  validateCommercialPropertySafe,
  makeAssessmentDecision,
  type CommercialPropertyCore,
  type DecisionInput
} from '../mocks/charly-packages.js';
import type { ValidationResponse, CommercialValidationRequest, ResidentialProperty } from '../types/api.js';
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

  async validateResidential(property: ResidentialProperty): Promise<ValidationResponse> {
    const workfileId = generateWorkfileId();
    const errorBuilder = createErrorBuilder();

    // Validate required fields
    if (!property.property_address) {
      errorBuilder.add('Property address is required');
    } else if (property.property_address.length < 5) {
      errorBuilder.add('Property address must be at least 5 characters');
    }

    // Validate numeric fields if provided
    if (property.assessed_value !== undefined && property.assessed_value < 0) {
      errorBuilder.add('Assessed value must be non-negative');
    }

    if (property.market_value !== undefined && property.market_value < 0) {
      errorBuilder.add('Market value must be non-negative');
    }

    if (property.square_footage !== undefined && property.square_footage < 100) {
      errorBuilder.add('Square footage must be at least 100');
    }

    if (property.year_built !== undefined) {
      const currentYear = new Date().getFullYear();
      if (property.year_built < 1800 || property.year_built > currentYear + 2) {
        errorBuilder.add(`Year built must be between 1800 and ${currentYear + 2}`);
      }
    }

    if (property.bedrooms !== undefined && (property.bedrooms < 0 || property.bedrooms > 20)) {
      errorBuilder.add('Bedrooms must be between 0 and 20');
    }

    if (property.bathrooms !== undefined && (property.bathrooms < 0 || property.bathrooms > 20)) {
      errorBuilder.add('Bathrooms must be between 0 and 20');
    }

    // Validate property type if provided
    const validPropertyTypes = ['single_family', 'condo', 'townhome', 'duplex', 'other'];
    if (property.property_type && !validPropertyTypes.includes(property.property_type)) {
      errorBuilder.add(`Property type must be one of: ${validPropertyTypes.join(', ')}`);
    }

    // Return early if validation errors
    if (errorBuilder.hasErrors()) {
      return {
        workfile_id: workfileId,
        normalized: property,
        errors: errorBuilder.getErrors()
      };
    }

    // Normalize residential property data
    const normalizedProperty: ResidentialProperty = {
      property_address: property.property_address.trim(),
      assessed_value: property.assessed_value,
      market_value: property.market_value,
      jurisdiction: property.jurisdiction?.trim(),
      tax_year: property.tax_year || new Date().getFullYear(),
      homestead_exemption: property.homestead_exemption || false,
      square_footage: property.square_footage,
      lot_size: property.lot_size,
      year_built: property.year_built,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      property_type: property.property_type || 'single_family',
      garage_spaces: property.garage_spaces,
      property_data: property.property_data || {}
    };

    // Generate residential-specific decision preview if we have enough data
    let decisionPreview;
    if (property.assessed_value && property.market_value) {
      const assessmentRatio = property.assessed_value / property.market_value;
      const overAssessed = assessmentRatio > 1.05; // 5% threshold for residential
      const fairlyAssessed = assessmentRatio >= 0.95 && assessmentRatio <= 1.05;
      
      let label: 'OVER' | 'FAIR' | 'UNDER';
      let confidence: number;
      let savingsEstimate: number;

      if (overAssessed) {
        label = 'OVER';
        confidence = Math.min(0.9, (assessmentRatio - 1.05) * 2 + 0.5);
        // Estimate annual tax savings (assuming 1.2% tax rate)
        savingsEstimate = (property.assessed_value - property.market_value) * 0.012;
      } else if (fairlyAssessed) {
        label = 'FAIR';
        confidence = 0.8;
        savingsEstimate = 0;
      } else {
        label = 'UNDER';
        confidence = 0.7;
        savingsEstimate = 0;
      }

      decisionPreview = {
        label,
        confidence: Math.max(0.1, Math.min(0.95, confidence)),
        savings_estimate: Math.max(0, savingsEstimate)
      };
    }

    return {
      workfile_id: workfileId,
      normalized: normalizedProperty,
      errors: [],
      decision_preview: decisionPreview
    };
  }
}