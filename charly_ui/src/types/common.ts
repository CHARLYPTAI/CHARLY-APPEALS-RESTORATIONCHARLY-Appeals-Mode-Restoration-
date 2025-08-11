// Common type utilities for type-safe development

// Generic cache data interface
export interface CacheStats {
  size: number;
  entries: number;
  lastModified: string;
  version: string;
}

// Service Worker cache data
export interface CacheData {
  key: string;
  value: Record<string, unknown>;
  timestamp: number;
  expiry?: number;
}

// Report data for caching
export interface CacheableReportData {
  id: string;
  type: 'supernova2b' | 'market-analysis' | 'assessment-history';
  data: Record<string, unknown>;
  metadata: {
    generated: string;
    version: string;
    propertyId: string;
  };
}

// Enhanced property data with strict typing
export interface ExtendedPropertyData {
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
  additionalAttributes?: Record<string, string | number | boolean>;
}

// Type-safe assessment history
export interface TypedAssessmentHistoryItem {
  year: number;
  assessment: number;
  marketValue: number;
  change: number;
  additionalData?: Record<string, string | number>;
}

// Type-safe jurisdiction data
export interface TypedJurisdictionData {
  appealFee: number;
  averageAppealTime: string;
  successRate: number;
  appealDeadline: string;
  assessmentRatio: number;
  additionalInfo?: Record<string, string | number>;
}

// Type-safe analytics
export interface TypedPropertyAnalytics {
  marketTrendScore: number;
  assessmentHistoryScore: number;
  comparabilityScore: number;
  liquidityScore: number;
  additionalMetrics?: Record<string, number>;
}

// Type-safe recommendations
export interface TypedStrategicRecommendations {
  appealTiming: string;
  keyArguments: string[];
  evidenceStrength: number;
  alternativeStrategies: string[];
  additionalOptions?: Record<string, string | string[]>;
}