// Type definitions for report generation system

export interface PropertyData {
  id: string;
  address: string;
  currentAssessment: number;
  estimatedValue: number;
  potentialSavings: number;
  squareFootage: number;
  yearBuilt: number;
  propertyType: string;
  jurisdiction: string;
  parcelNumber: string;
}

export interface PropertyAnalysis {
  confidence_score: number;
  success_probability: number;
  key_factors: string[];
  assessment_issues: string[];
  market_position: string;
  recommendation: string;
  narrative?: string;
}

export interface PropertyValuation {
  incomeValue: number;
  salesValue: number;
  costValue: number;
  weightedValue: number;
  approach_weights: {
    income: number;
    sales: number;
    cost: number;
  };
}

export interface AssessmentAnalysis {
  currentAssessment: number;
  estimatedMarketValue: number;
  assessmentToValueRatio: string;
  overAssessmentAmount: number;
  overAssessmentPercentage: string | number;
  confidenceLevel: number;
  successProbability: number;
}

export interface FinancialImpact {
  currentAnnualTaxes: number;
  projectedAnnualTaxes: number;
  annualTaxSavings: number;
  fiveYearSavings: number;
  appealCost: number;
  netBenefit: number;
  roi: number;
  paybackPeriod: string;
}

export interface ValuationSummary {
  incomeApproachValue: number;
  salesApproachValue: number;
  costApproachValue: number;
  reconciledValue: number;
  weights: {
    income: number;
    sales: number;
    cost: number;
  };
}

export interface ComparableSale {
  address: string;
  saleDate: string;
  salePrice: number;
  squareFootage: number;
  pricePerSqFt: number;
  distance?: number; // Make optional for compatibility
  relevanceScore?: number;
  weight?: number;
  strengthRating?: string;
  reasoning?: string[] | string;
}

export interface AssessmentHistoryItem {
  year?: number;
  assessment?: number;
  marketValue?: number;
  change?: number;
  additionalData?: Record<string, string | number>;
}

export interface JurisdictionData {
  appealFee?: number;
  averageAppealTime?: string;
  successRate?: number;
  appealDeadline?: string;
  assessmentRatio?: number;
  additionalInfo?: Record<string, string | number>;
}

export interface PropertyAnalytics {
  marketTrendScore?: number;
  assessmentHistoryScore?: number;
  comparabilityScore?: number;
  liquidityScore?: number;
  additionalMetrics?: Record<string, number>;
}

export interface StrategicRecommendations {
  appealTiming?: string;
  keyArguments?: string[];
  evidenceStrength?: number;
  alternativeStrategies?: string[];
  additionalOptions?: Record<string, string | string[]>;
  primaryStrategy?: string;
  timeline?: string;
}

export interface MarketAnalysis {
  jurisdiction: string;
  propertyType: string;
  comparableSalesCount: number;
  marketTrend: string;
  averagePricePerSqFt: number;
  subjectPricePerSqFt: number;
  priceVariance: number;
  marketPosition: string;
  comparableSales: ComparableSale[];
  assessmentHistory: AssessmentHistoryItem[];
  jurisdictionIntelligence: JurisdictionData;
  propertyAnalytics: PropertyAnalytics;
  strategicRecommendations: StrategicRecommendations;
}

// Supernova 2B Enhanced Data Structure
export interface SupernovaEnhancements {
  successProbability?: {
    overallProbability: number;
    confidenceInterval?: [number, number] | { low: number; high: number };
    marketFactors?: Record<string, number>;
    propertyFactors?: Record<string, number>;
    jurisdictionFactors?: Record<string, number>;
    timingFactors?: Record<string, number>;
    keyRiskFactors?: string[];
    strengthIndicators?: string[];
  };
  confidenceLevel?: number;
  riskAssessment?: {
    level: 'Low' | 'Medium' | 'High';
    factors: string[];
    mitigationStrategies: string[];
  };
  selectedComparables?: ComparableSale[];
  rejectedComparables?: ComparableSale[];
  overallStrength?: number;
  recommendedNarrative?: string;
  primaryStrategy?: {
    approach: string;
    timeline: string;
    expectedOutcome: string;
  };
  successPrediction?: {
    overallProbability: number;
    confidenceLevel: number;
    keyStrengths: string[];
    potentialChallenges: string[];
  };
  optimalTiming?: {
    timeline: string;
    recommendations: string[];
  };
  evidenceHierarchy?: {
    alternativeStrategies: string[];
    supportingEvidence: string[];
  };
  narrativeThemes?: string[];
  lastUpdated?: string;
  aiAnalysisVersion?: string;
  generatedAt?: string;
  smartComparables?: {
    selectedComparables: ComparableSale[];
    rejectedComparables: ComparableSale[];
    overallStrength: number;
    recommendedNarrative: string;
  };
  supernovaRecommendations?: {
    riskAssessment: {
      level: 'Low' | 'Medium' | 'High';
      factors: string[];
      mitigationStrategies: string[];
    };
    primaryStrategy: {
      approach: string;
      timeline: string;
      expectedOutcome: string;
    };
    successPrediction?: {
      overallProbability: number;
      confidenceLevel: number;
      keyStrengths: string[];
      potentialChallenges: string[];
    };
    narrativeThemes: string[];
  };
}

export interface ReportData {
  property: PropertyData | Record<string, unknown>; // Allow flexibility for existing property types
  analysis: PropertyAnalysis | Record<string, unknown>; // Allow flexibility for existing analysis types  
  valuation: PropertyValuation | Record<string, unknown>; // Allow flexibility for existing valuation types
  date: string;
  preparedBy: string;
  reportType: string;
  appealRecommendation: string;
  assessmentAnalysis: AssessmentAnalysis;
  financialImpact: FinancialImpact;
  valuationSummary: ValuationSummary;
  marketAnalysis: MarketAnalysis | Record<string, unknown>; // Allow flexibility for AI-enhanced data
  marketPositionScore: number;
  appealTimingScore: number;
  supernovaEnhancements?: SupernovaEnhancements; // Optional Supernova 2B enhancements
}

// API Response types for error handling
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: ApiError;
}