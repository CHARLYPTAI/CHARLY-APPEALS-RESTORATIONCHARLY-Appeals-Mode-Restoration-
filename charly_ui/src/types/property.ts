/**
 * 🍎 CHARLY 2.0 - COLLABORATIVE PROPERTY TYPES
 * 
 * Enhanced property types supporting collaborative intelligence
 * and community-driven property management features.
 */

// ============================================================================
// CORE PROPERTY TYPES
// ============================================================================

export interface BaseProperty {
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

// ============================================================================
// COLLABORATIVE OWNERSHIP TYPES
// ============================================================================

export type OwnershipStatus = 'claimed' | 'verified' | 'disputed';
export type VerificationMethod = 'deed' | 'tax_bill' | 'utility_bill' | 'lease_agreement' | 'management_contract';

export interface PropertyOwnership {
  userId: string;
  propertyId: string;
  status: OwnershipStatus;
  claimedAt: Date;
  verifiedAt?: Date;
  verificationMethod?: VerificationMethod;
  verificationDocuments?: string[];
  notes?: string;
  isActive: boolean;
}

export interface PropertyClaim {
  id: string;
  propertyId: string;
  userId: string;
  claimType: 'owner' | 'agent' | 'manager' | 'attorney';
  relationship: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'disputed';
  evidenceProvided: VerificationMethod[];
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

// ============================================================================
// COMMUNITY INTELLIGENCE TYPES
// ============================================================================

export interface PropertyCommunityData {
  propertyId: string;
  sharedWithCommunity: boolean;
  communityInsightCount: number;
  marketConfidence: number; // 0-1 score
  lastCommunityUpdate: Date;
  anonymousDataPoints: number;
  marketComparables: number;
}

export interface MarketInsight {
  id: string;
  propertyId: string;
  insightType: 'comparable_sale' | 'assessment_variance' | 'market_trend' | 'jurisdiction_pattern';
  confidence: number; // 0-1 score
  value: number;
  source: 'community' | 'public_records' | 'mls' | 'aggregated';
  contributorId?: string; // Anonymous hash
  createdAt: Date;
  verifiedAt?: Date;
}

export interface CommunityContribution {
  userId: string;
  propertiesShared: number;
  dataQualityScore: number; // 0-1 score
  communityTrustScore: number; // 0-1 score
  successfulAppeals: number;
  lastContribution: Date;
  reputationLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// ============================================================================
// ENHANCED PROPERTY TYPE
// ============================================================================

export interface CollaborativeProperty extends BaseProperty {
  // Ownership information
  ownership?: PropertyOwnership;
  ownershipClaims?: PropertyClaim[];
  
  // Community intelligence
  communityData?: PropertyCommunityData;
  marketInsights?: MarketInsight[];
  
  // Analysis metadata
  lastAnalyzed?: Date;
  analysisVersion?: string;
  analysisConfidence?: number;
  flaggingReasons?: string[];
  
  // Collaborative features
  sharedWithTeam?: boolean;
  teamMembers?: string[];
  collaborativeNotes?: string;
  
  // Appeal tracking
  appealHistory?: AppealRecord[];
  currentAppeal?: AppealRecord;
}

// ============================================================================
// APPEAL MANAGEMENT TYPES
// ============================================================================

export type AppealStatus = 'draft' | 'filed' | 'hearing_scheduled' | 'decided' | 'settled';
export type AppealType = 'over_assessment' | 'exemption' | 'classification' | 'special_use';
export type AppealOutcome = 'full_success' | 'partial_success' | 'no_change' | 'pending';

export interface AppealRecord {
  id: string;
  propertyId: string;
  userId: string;
  appealType: AppealType;
  filingYear: number;
  currentAssessment: number;
  targetAssessment: number;
  
  // Status tracking
  status: AppealStatus;
  filedDate?: Date;
  hearingDate?: Date;
  decisionDate?: Date;
  
  // Outcome
  finalAssessment?: number;
  savingsAchieved?: number;
  outcome?: AppealOutcome;
  
  // Documentation
  packetGenerated: boolean;
  packetId?: string;
  documentsSubmitted?: string[];
  
  // Community insights
  shareOutcome: boolean;
  outcomeSharedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PORTFOLIO MANAGEMENT TYPES
// ============================================================================

export interface PropertyFilter {
  search?: string;
  jurisdiction?: string;
  propertyType?: string;
  status?: string;
  ownershipStatus?: OwnershipStatus;
  minValue?: number;
  maxValue?: number;
  hasAppeals?: boolean;
  sharedWithCommunity?: boolean;
  flaggedOnly?: boolean;
  recentlyAnalyzed?: boolean;
}

export interface PortfolioMetrics {
  totalProperties: number;
  totalValue: number;
  totalSavings: number;
  flaggedProperties: number;
  verifiedProperties: number;
  communitySharedProperties: number;
  activeAppeals: number;
  successfulAppeals: number;
  avgSavingsPercent: number;
  portfolioConfidence: number;
}

export interface BulkAction {
  type: 'analyze' | 'flag' | 'share_community' | 'update_status' | 'file_appeal' | 'export';
  propertyIds: string[];
  parameters?: Record<string, unknown>;
  scheduledFor?: Date;
  userId: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface PropertyCardState {
  isExpanded: boolean;
  isSelected: boolean;
  showAnalysis: boolean;
  showCommunityData: boolean;
  showOwnershipStatus: boolean;
}

export interface PortfolioViewState {
  viewMode: 'list' | 'grid' | 'map' | 'analytics';
  sortBy: 'address' | 'value' | 'savings' | 'status' | 'lastAnalyzed' | 'communityInsights';
  sortDirection: 'asc' | 'desc';
  selectedProperties: string[];
  showAdvancedFilters: boolean;
  showCommunityFeatures: boolean;
  showOwnershipPanel: boolean;
}