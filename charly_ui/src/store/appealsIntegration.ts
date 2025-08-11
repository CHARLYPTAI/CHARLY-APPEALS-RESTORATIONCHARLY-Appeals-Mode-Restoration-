import { create } from "zustand";

interface NarrativeResult {
  success: boolean;
  narrative_type: 'income_summary' | 'sales_comparison' | 'cost_approach';
  narrative: string;
  model_used: string;
  tokens_used: number;
  estimated_cost: number;
  generation_time: number;
  confidence_score: number;
}

// Define interfaces locally to avoid import issues
interface AnalysisProperty {
  id: string;
  address: string;
  propertyType: string;
  currentAssessment: number;
  estimatedValue: number;
  potentialSavings: number;
  status: string;
  jurisdiction: string;
  parcelNumber: string;
  ownerName: string;
  yearBuilt: number;
  squareFootage: number;
}

interface PropertyAnalysisResult {
  property_id: string;
  success_probability: number;
  predicted_reduction: number;
  confidence_score: number;
  risk_score: number;
  recommended_action: string;
  reasons: string[];
  appeal_probability: number;
  narratives?: {
    income_summary?: NarrativeResult;
    sales_comparison?: NarrativeResult;
    cost_approach?: NarrativeResult;
  };
  total_cost?: number;
  total_tokens?: number;
  estimated_reduction?: number;
  key_factors?: string[];
  recommendation?: string;
  analysis_date: string;
  model_used?: string;
}

interface ValuationData {
  incomeValue: number;
  salesValue: number;
  costValue: number;
  weightedValue: number;
  isComplete: boolean;
  completedDate?: string;
}

export interface AppealFormData {
  property_address: string;
  current_assessment: string;
  proposed_value: string;
  jurisdiction: string;
  reason: string;
  parcel_number?: string;
  owner_name?: string;
  property_type?: string;
  square_footage?: string;
  year_built?: string;
}

export interface AppealPreparationData {
  property: AnalysisProperty;
  analysisResult: PropertyAnalysisResult;
  valuationData?: ValuationData;
  appealForm: AppealFormData;
  isReady: boolean;
}

interface AppealsIntegrationState {
  // Current appeal preparation
  currentAppealPrep: AppealPreparationData | null;
  isPreparingAppeal: boolean;
  
  // Actions
  prepareAppealFromAnalysis: (
    property: AnalysisProperty, 
    analysisResult: PropertyAnalysisResult,
    valuationData?: ValuationData
  ) => void;
  updateAppealForm: (formData: Partial<AppealFormData>) => void;
  clearAppealPreparation: () => void;
  
  // Getters
  getAppealFormData: () => AppealFormData | null;
  isAppealReady: () => boolean;
  getGeneratedReason: () => string;
}

export const useAppealsIntegrationStore = create<AppealsIntegrationState>((set, get) => ({
  // Initial state
  currentAppealPrep: null,
  isPreparingAppeal: false,

  // Actions
  prepareAppealFromAnalysis: (property, analysisResult, valuationData) => {
    const proposedValue = valuationData?.weightedValue || property.estimatedValue;
    
    const appealForm: AppealFormData = {
      property_address: property.address,
      current_assessment: property.currentAssessment.toString(),
      proposed_value: proposedValue.toString(),
      jurisdiction: property.jurisdiction,
      reason: generateAppealReason(property, analysisResult, valuationData),
      parcel_number: property.parcelNumber,
      owner_name: property.ownerName,
      property_type: property.propertyType,
      square_footage: property.squareFootage.toString(),
      year_built: property.yearBuilt.toString()
    };

    const appealPrep: AppealPreparationData = {
      property,
      analysisResult,
      valuationData,
      appealForm,
      isReady: true
    };

    set({
      currentAppealPrep: appealPrep,
      isPreparingAppeal: true
    });
  },

  updateAppealForm: (formData) => {
    const { currentAppealPrep } = get();
    if (!currentAppealPrep) return;

    set({
      currentAppealPrep: {
        ...currentAppealPrep,
        appealForm: {
          ...currentAppealPrep.appealForm,
          ...formData
        }
      }
    });
  },

  clearAppealPreparation: () => {
    set({
      currentAppealPrep: null,
      isPreparingAppeal: false
    });
  },

  // Getters
  getAppealFormData: () => {
    const { currentAppealPrep } = get();
    return currentAppealPrep?.appealForm || null;
  },

  isAppealReady: () => {
    const { currentAppealPrep } = get();
    return currentAppealPrep?.isReady || false;
  },

  getGeneratedReason: () => {
    const { currentAppealPrep } = get();
    if (!currentAppealPrep) return "";
    
    return generateAppealReason(
      currentAppealPrep.property,
      currentAppealPrep.analysisResult,
      currentAppealPrep.valuationData
    );
  }
}));

// Helper function to generate comprehensive appeal reason
function generateAppealReason(
  property: AnalysisProperty,
  analysisResult: PropertyAnalysisResult,
  valuationData?: ValuationData
): string {
  const currentValue = property.currentAssessment;
  const proposedValue = valuationData?.weightedValue || property.estimatedValue;
  const reduction = currentValue - proposedValue;
  const reductionPercent = ((reduction / currentValue) * 100).toFixed(1);

  let reason = `Based on comprehensive analysis of ${property.address}, the current assessment of $${currentValue.toLocaleString()} appears to be excessive. `;

  // Add AI analysis insights
  if (analysisResult.appeal_probability > 0.7) {
    reason += `Our AI analysis indicates a ${Math.round(analysisResult.appeal_probability * 100)}% probability of appeal success with ${Math.round(analysisResult.confidence_score * 100)}% confidence. `;
  }

  // Add key factors
  if (analysisResult.key_factors && analysisResult.key_factors.length > 0) {
    reason += `Key factors supporting this appeal include: ${analysisResult.key_factors.join(', ')}. `;
  }

  // Add valuation methodology if available
  if (valuationData && valuationData.isComplete) {
    reason += `Our comprehensive valuation analysis using industry-standard approaches `;
    
    const approaches = [];
    if (valuationData.incomeValue > 0) approaches.push(`Income Approach ($${valuationData.incomeValue.toLocaleString()})`);
    if (valuationData.salesValue > 0) approaches.push(`Sales Comparison ($${valuationData.salesValue.toLocaleString()})`);
    if (valuationData.costValue > 0) approaches.push(`Cost Approach ($${valuationData.costValue.toLocaleString()})`);
    
    if (approaches.length > 0) {
      reason += `(${approaches.join(', ')}) `;
    }
    
    reason += `supports a fair market value of $${proposedValue.toLocaleString()}. `;
  }

  // Add conclusion
  reason += `We respectfully request a reduction of $${reduction.toLocaleString()} (${reductionPercent}%) to reflect the true market value of this property.`;

  return reason;
}