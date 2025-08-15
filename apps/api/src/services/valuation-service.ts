import { generateWorkfileId } from '../utils/id-generator.js';
import { createErrorBuilder, formatServiceError } from '../utils/error-handler.js';

export interface Comparable {
  id: string;
  address: string;
  saleDate: string;
  salePrice: number;
  squareFootage: number;
  pricePerSF: number;
  condition: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
  location: 'superior' | 'similar' | 'inferior';
  adjustments: {
    condition: number;
    location: number;
    time: number;
    other: number;
  };
  adjustedPrice: number;
  adjustedPricePerSF: number;
  weight: number;
}

export interface SalesComparisonRequest {
  propertyId: string;
  comparables: Comparable[];
}

export interface SalesComparisonResponse {
  workfile_id: string;
  indicated_value: number;
  weighted_avg_price_per_sf: number;
  confidence: number;
  rationale: string[];
  comparables: Comparable[];
  errors: string[];
}

export interface CostApproachData {
  landValue: number;
  improvementValue: number;
  totalReplacementCost: number;
  depreciation: {
    physical: number;
    functional: number;
    external: number;
    total: number;
  };
  depreciatedValue: number;
  indicatedValue: number;
}

export interface CostApproachRequest {
  propertyId: string;
  landValue: number;
  improvementCost: number;
  age: number;
  effectiveAge: number;
  economicLife: number;
  physicalDeterioration: number;
  functionalObsolescence: number;
  externalObsolescence: number;
}

export interface CostApproachResponse {
  workfile_id: string;
  cost_data: CostApproachData;
  confidence: number;
  errors: string[];
}

export class ValuationService {
  
  async calculateSalesComparison(request: SalesComparisonRequest): Promise<SalesComparisonResponse> {
    const workfileId = generateWorkfileId();
    const errorBuilder = createErrorBuilder();

    try {
      // Validate input
      if (!request.propertyId) {
        errorBuilder.add('Property ID is required');
      }

      if (!request.comparables || request.comparables.length === 0) {
        errorBuilder.add('At least one comparable is required');
      }

      if (errorBuilder.hasErrors()) {
        return {
          workfile_id: workfileId,
          indicated_value: 0,
          weighted_avg_price_per_sf: 0,
          confidence: 0,
          rationale: [],
          comparables: request.comparables || [],
          errors: errorBuilder.getErrors()
        };
      }

      // Process comparables and calculate adjusted values
      const processedComparables = request.comparables.map(comp => {
        const totalAdjustment = Object.values(comp.adjustments).reduce((sum, adj) => sum + adj, 0);
        const adjustedPrice = comp.salePrice + totalAdjustment;
        const adjustedPricePerSF = comp.squareFootage > 0 ? adjustedPrice / comp.squareFootage : 0;

        return {
          ...comp,
          adjustedPrice,
          adjustedPricePerSF
        };
      });

      // Validate weights sum to 1.0
      const totalWeight = processedComparables.reduce((sum, comp) => sum + comp.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        errorBuilder.add(`Comparable weights must sum to 1.0 (current sum: ${totalWeight.toFixed(3)})`);
      }

      // Calculate weighted average indicated value
      const weightedValue = processedComparables.reduce((sum, comp) => {
        return sum + (comp.adjustedPrice * comp.weight);
      }, 0);

      // Calculate weighted average price per SF
      const weightedPricePerSF = processedComparables.reduce((sum, comp) => {
        return sum + (comp.adjustedPricePerSF * comp.weight);
      }, 0);

      // Calculate confidence based on comparability and adjustment magnitude
      const confidence = this.calculateSalesComparisonConfidence(processedComparables);

      // Generate rationale
      const rationale = this.generateSalesComparisonRationale(processedComparables);

      return {
        workfile_id: workfileId,
        indicated_value: Math.round(weightedValue),
        weighted_avg_price_per_sf: Math.round(weightedPricePerSF * 100) / 100,
        confidence,
        rationale,
        comparables: processedComparables,
        errors: errorBuilder.getErrors()
      };

    } catch (error) {
      errorBuilder.add(formatServiceError(error, 'Sales comparison calculation failed'));
      return {
        workfile_id: workfileId,
        indicated_value: 0,
        weighted_avg_price_per_sf: 0,
        confidence: 0,
        rationale: [],
        comparables: request.comparables || [],
        errors: errorBuilder.getErrors()
      };
    }
  }

  async calculateCostApproach(request: CostApproachRequest): Promise<CostApproachResponse> {
    const workfileId = generateWorkfileId();
    const errorBuilder = createErrorBuilder();

    try {
      // Validate input
      if (!request.propertyId) {
        errorBuilder.add('Property ID is required');
      }

      if (request.landValue <= 0) {
        errorBuilder.add('Land value must be greater than 0');
      }

      if (request.improvementCost <= 0) {
        errorBuilder.add('Improvement cost must be greater than 0');
      }

      if (request.age < 0 || request.effectiveAge < 0 || request.economicLife <= 0) {
        errorBuilder.add('Age and economic life values must be valid');
      }

      if (errorBuilder.hasErrors()) {
        return {
          workfile_id: workfileId,
          cost_data: {
            landValue: 0,
            improvementValue: 0,
            totalReplacementCost: 0,
            depreciation: { physical: 0, functional: 0, external: 0, total: 0 },
            depreciatedValue: 0,
            indicatedValue: 0
          },
          confidence: 0,
          errors: errorBuilder.getErrors()
        };
      }

      // Calculate depreciation
      const physicalDepreciation = Math.min(request.physicalDeterioration / 100, 1.0);
      const functionalDepreciation = Math.min(request.functionalObsolescence / 100, 1.0);
      const externalDepreciation = Math.min(request.externalObsolescence / 100, 1.0);

      // Age-based depreciation calculation (straight-line)
      const ageBasedDepreciation = Math.min(request.effectiveAge / request.economicLife, 1.0);
      
      // Combine depreciation factors (not additive to avoid over-depreciation)
      const totalDepreciationRate = Math.min(
        ageBasedDepreciation + physicalDepreciation + functionalDepreciation + externalDepreciation,
        0.95 // Cap at 95% depreciation
      );

      const totalDepreciationAmount = request.improvementCost * totalDepreciationRate;
      const depreciatedImprovementValue = request.improvementCost - totalDepreciationAmount;
      const indicatedValue = request.landValue + depreciatedImprovementValue;

      // Calculate confidence based on data quality and assumptions
      const confidence = this.calculateCostApproachConfidence(request, totalDepreciationRate);

      const costData: CostApproachData = {
        landValue: request.landValue,
        improvementValue: depreciatedImprovementValue,
        totalReplacementCost: request.improvementCost,
        depreciation: {
          physical: request.improvementCost * physicalDepreciation,
          functional: request.improvementCost * functionalDepreciation,
          external: request.improvementCost * externalDepreciation,
          total: totalDepreciationAmount
        },
        depreciatedValue: depreciatedImprovementValue,
        indicatedValue: Math.round(indicatedValue)
      };

      return {
        workfile_id: workfileId,
        cost_data: costData,
        confidence,
        errors: errorBuilder.getErrors()
      };

    } catch (error) {
      errorBuilder.add(formatServiceError(error, 'Cost approach calculation failed'));
      return {
        workfile_id: workfileId,
        cost_data: {
          landValue: 0,
          improvementValue: 0,
          totalReplacementCost: 0,
          depreciation: { physical: 0, functional: 0, external: 0, total: 0 },
          depreciatedValue: 0,
          indicatedValue: 0
        },
        confidence: 0,
        errors: errorBuilder.getErrors()
      };
    }
  }

  private calculateSalesComparisonConfidence(comparables: Comparable[]): number {
    if (comparables.length === 0) return 0;

    let confidenceScore = 0.8; // Base confidence

    // Adjust for number of comparables
    if (comparables.length >= 3) confidenceScore += 0.1;
    if (comparables.length >= 5) confidenceScore += 0.05;

    // Adjust for sale recency (assume sales within last year are better)
    const recentSales = comparables.filter(comp => {
      const saleDate = new Date(comp.saleDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return saleDate >= oneYearAgo;
    }).length;

    confidenceScore += (recentSales / comparables.length) * 0.1;

    // Adjust for magnitude of adjustments
    const avgAdjustmentMagnitude = comparables.reduce((sum, comp) => {
      const totalAdjustment = Math.abs(Object.values(comp.adjustments).reduce((s, adj) => s + adj, 0));
      return sum + (totalAdjustment / comp.salePrice);
    }, 0) / comparables.length;

    // Lower confidence if adjustments are too large
    if (avgAdjustmentMagnitude > 0.2) confidenceScore -= 0.15;
    else if (avgAdjustmentMagnitude > 0.1) confidenceScore -= 0.05;

    return Math.max(0.3, Math.min(0.95, confidenceScore));
  }

  private calculateCostApproachConfidence(request: CostApproachRequest, totalDepreciationRate: number): number {
    let confidenceScore = 0.7; // Base confidence for cost approach

    // Adjust for property age (newer properties have higher confidence)
    if (request.age <= 5) confidenceScore += 0.15;
    else if (request.age <= 10) confidenceScore += 0.1;
    else if (request.age <= 20) confidenceScore += 0.05;
    else if (request.age > 40) confidenceScore -= 0.1;

    // Adjust for total depreciation (excessive depreciation reduces confidence)
    if (totalDepreciationRate > 0.7) confidenceScore -= 0.2;
    else if (totalDepreciationRate > 0.5) confidenceScore -= 0.1;

    // Adjust for data completeness
    if (request.landValue > 0 && request.improvementCost > 0) confidenceScore += 0.05;

    return Math.max(0.3, Math.min(0.9, confidenceScore));
  }

  private generateSalesComparisonRationale(comparables: Comparable[]): string[] {
    const rationale: string[] = [];

    rationale.push(`Analysis based on ${comparables.length} comparable sale${comparables.length > 1 ? 's' : ''}`);

    // Sale recency
    const recentSales = comparables.filter(comp => {
      const saleDate = new Date(comp.saleDate);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return saleDate >= sixMonthsAgo;
    }).length;

    if (recentSales > 0) {
      rationale.push(`${recentSales} sale${recentSales > 1 ? 's' : ''} within the last 6 months`);
    }

    // Price range
    const prices = comparables.map(comp => comp.adjustedPricePerSF);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    rationale.push(`Adjusted price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)} per SF`);

    // Adjustments summary
    const hasSignificantAdjustments = comparables.some(comp => {
      const totalAdjustment = Math.abs(Object.values(comp.adjustments).reduce((s, adj) => s + adj, 0));
      return (totalAdjustment / comp.salePrice) > 0.1;
    });

    if (hasSignificantAdjustments) {
      rationale.push('Adjustments made for condition, location, and market timing differences');
    } else {
      rationale.push('Minimal adjustments required - highly comparable properties');
    }

    return rationale;
  }
}