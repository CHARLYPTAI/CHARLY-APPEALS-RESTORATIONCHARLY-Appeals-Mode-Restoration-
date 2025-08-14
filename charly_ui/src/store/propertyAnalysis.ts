import { create } from "zustand";

// Enhanced Phase 1 Data Models for Enterprise Intelligence
export interface ComparableSale {
  id: string;
  address: string;
  saleDate: string;
  salePrice: number;
  pricePerSqFt: number;
  squareFootage: number;
  propertyType: string;
  distanceFromSubject: number; // miles
  daysSinceListingDate: number;
  daysOnMarket: number;
  adjustedSalePrice: number;
  adjustments: {
    location: number;
    condition: number;
    size: number;
    age: number;
    features: number;
    total: number;
  };
  dataSource: 'MLS' | 'County_Records' | 'Third_Party';
  confidence: number; // 0-100
}

export interface MarketTrendAnalysis {
  jurisdiction: string;
  timeframe: '1Y' | '3Y' | '5Y';
  averagePriceChange: number; // percentage
  medianPriceChange: number;
  salesVolume: number;
  averageDaysOnMarket: number;
  priceVariance: number;
  marketCondition: 'Sellers' | 'Buyers' | 'Balanced';
  seasonalAdjustment: number;
  lastUpdated: string;
}

export interface AssessmentHistory {
  taxYear: number;
  landValue: number;
  improvementValue: number;
  totalAssessment: number;
  exemptions: number;
  netTaxableValue: number;
  effectiveTaxRate: number;
  changeFromPreviousYear: number; // percentage
  appealStatus: 'None' | 'Filed' | 'Settled' | 'Denied';
  marketValue?: number; // if available
}

export interface JurisdictionIntelligence {
  name: string;
  county: string;
  state: string;
  appealDeadline: string; // format or calculation rule
  appealFee: number;
  appealSuccessRate: number; // percentage based on historical data
  averageReduction: number; // percentage
  assessmentCycle: 'Annual' | 'Biennial' | 'Triennial';
  assessmentRatio: number; // assessment to market value ratio
  recentReforms: string[];
  contactInfo: {
    assessorName: string;
    phone: string;
    email: string;
    address: string;
  };
  lastUpdated: string;
}

export interface PropertyDetailedAnalytics {
  conditionScore: number; // 1-10
  effectiveAge: number;
  functionalObsolescence: number; // percentage
  externalObsolescence: number; // percentage
  renovationHistory: {
    year: number;
    type: string;
    cost: number;
    impact: number; // value impact percentage
  }[];
  complianceIssues: string[];
  marketPosition: 'Superior' | 'Average' | 'Below_Average';
  investmentGrade: 'A' | 'B' | 'C' | 'D';
  liquidityScore: number; // 1-10
}

export interface NarrativeResult {
  success: boolean;
  narrative_type: 'income_summary' | 'sales_comparison' | 'cost_approach';
  narrative: string;
  model_used: string;
  tokens_used: number;
  estimated_cost: number;
  generation_time: number;
  confidence_score: number;
}

export interface PropertyAnalysisResult {
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
  
  // Enhanced Phase 1 Data
  marketData?: {
    comparableSales: ComparableSale[];
    marketTrends: MarketTrendAnalysis;
    pricePerSqFtAnalysis: {
      subject: number;
      marketAverage: number;
      variance: number;
      ranking: 'Above' | 'At' | 'Below';
    };
  };
  assessmentHistory?: AssessmentHistory[];
  jurisdictionData?: JurisdictionIntelligence;
  propertyAnalytics?: PropertyDetailedAnalytics;
  
  // Enhanced scoring and insights
  marketPositionScore?: number; // 1-100
  appealTimingScore?: number; // 1-100, optimal timing analysis
  strategicRecommendations?: {
    primaryStrategy: string;
    alternativeStrategies: string[];
    riskMitigation: string[];
    timeline: string;
    expectedOutcome: string;
  };
}

export interface AnalysisProperty {
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

export interface ValuationData {
  incomeValue: number;
  salesValue: number;
  costValue: number;
  weightedValue: number;
  isComplete: boolean;
  completedDate?: string;
}

interface PropertyAnalysisState {
  // Current analysis session
  currentProperty: AnalysisProperty | null;
  analysisResults: Record<string, PropertyAnalysisResult>;
  valuationData: Record<string, ValuationData>;
  
  // UI state
  isAnalyzing: string | null;
  showAnalysisModal: boolean;
  analysisComplete: boolean;
  
  // Actions
  setCurrentProperty: (property: AnalysisProperty | null) => void;
  setAnalysisResult: (propertyId: string, result: PropertyAnalysisResult) => void;
  setValuationData: (propertyId: string, data: ValuationData) => void;
  setAnalyzing: (propertyId: string | null) => void;
  setShowAnalysisModal: (show: boolean) => void;
  setAnalysisComplete: (complete: boolean) => void;
  
  // Derived state
  getCurrentAnalysis: () => PropertyAnalysisResult | null;
  getCurrentValuation: () => ValuationData | null;
  isPropertyAnalyzed: (propertyId: string) => boolean;
  getAppealReadiness: (propertyId: string) => boolean;
  
  // Workflow actions
  startAnalysis: (property: AnalysisProperty) => void;
  completeAnalysis: () => void;
  resetAnalysis: () => void;
}

export const usePropertyAnalysisStore = create<PropertyAnalysisState>((set, get) => ({
  // Initial state
  currentProperty: null,
  analysisResults: {},
  valuationData: {},
  isAnalyzing: null,
  showAnalysisModal: false,
  analysisComplete: false,

  // Actions
  setCurrentProperty: (property) => set({ currentProperty: property }),
  
  setAnalysisResult: (propertyId, result) => 
    set((state) => ({
      analysisResults: {
        ...state.analysisResults,
        [propertyId]: {
          ...result,
          analysis_date: new Date().toISOString()
        }
      }
    })),
  
  setValuationData: (propertyId, data) =>
    set((state) => ({
      valuationData: {
        ...state.valuationData,
        [propertyId]: {
          ...data,
          completedDate: data.isComplete ? new Date().toISOString() : data.completedDate
        }
      }
    })),
  
  setAnalyzing: (propertyId) => set({ isAnalyzing: propertyId }),
  setShowAnalysisModal: (show) => set({ showAnalysisModal: show }),
  setAnalysisComplete: (complete) => set({ analysisComplete: complete }),

  // Derived state getters
  getCurrentAnalysis: () => {
    const { currentProperty, analysisResults } = get();
    if (!currentProperty) return null;
    return analysisResults[currentProperty.id] || null;
  },

  getCurrentValuation: () => {
    const { currentProperty, valuationData } = get();
    if (!currentProperty) return null;
    return valuationData[currentProperty.id] || null;
  },

  isPropertyAnalyzed: (propertyId) => {
    const { analysisResults } = get();
    return !!analysisResults[propertyId];
  },

  getAppealReadiness: (propertyId) => {
    const { analysisResults, valuationData } = get();
    const hasAnalysis = !!analysisResults[propertyId];
    const hasValuation = !!valuationData[propertyId]?.isComplete;
    return hasAnalysis && hasValuation;
  },

  // Workflow actions
  startAnalysis: (property) => {
    set({
      currentProperty: property,
      showAnalysisModal: true,
      analysisComplete: false,
      isAnalyzing: property.id
    });
  },

  completeAnalysis: () => {
    set({
      analysisComplete: true,
      isAnalyzing: null
    });
  },

  resetAnalysis: () => {
    set({
      currentProperty: null,
      showAnalysisModal: false,
      analysisComplete: false,
      isAnalyzing: null
    });
  }
}));