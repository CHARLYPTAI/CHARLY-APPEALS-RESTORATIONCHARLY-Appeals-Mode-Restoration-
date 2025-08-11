// Supernova Phase 2B: Advanced AI Analysis Service
import type { MarketDataRequest } from './marketDataService';

export interface AISuccessProbabilityModel {
  baseSuccessRate: number;
  marketFactors: {
    priceVariance: number;
    marketCondition: number;
    comparabilityStrength: number;
    dataQuality: number;
  };
  propertyFactors: {
    assessmentRatio: number;
    ageAndCondition: number;
    uniquenessScore: number;
    improvementAccuracy: number;
  };
  jurisdictionFactors: {
    historicalSuccessRate: number;
    assessorProfessionalism: number;
    recentReforms: number;
    appealVolume: number;
  };
  timingFactors: {
    daysToDeadline: number;
    seasonalOptimality: number;
    workloadTiming: number;
  };
  overallProbability: number;
  confidenceInterval: [number, number];
  keyRiskFactors: string[];
  strengthIndicators: string[];
}

export interface SmartComparableSelection {
  selectedComparables: Array<{
    id: string;
    address: string;
    weight: number;
    relevanceScore: number;
    strengthRating: 'Excellent' | 'Good' | 'Fair' | 'Weak';
    adjustmentReliability: number;
    persuasionValue: number;
    reasoning: string[];
  }>;
  rejectedComparables: Array<{
    id: string;
    address: string;
    rejectionReason: string;
    weaknessFactors: string[];
  }>;
  overallStrength: number;
  recommendedNarrative: string;
}

export interface EnhancedMarketPositioning {
  competitiveAnalysis: {
    subjectRanking: number; // 1-100 percentile
    peerComparison: Array<{
      metric: string;
      subjectValue: number;
      marketAverage: number;
      advantageScore: number;
    }>;
  };
  valuationApproachOptimization: {
    primaryApproach: 'sales' | 'income' | 'cost';
    approachStrengths: Record<string, number>;
    recommendedWeighting: {
      sales: number;
      income: number;
      cost: number;
    };
    reasoning: string[];
  };
  strategicPositioning: {
    appealStrategy: 'aggressive' | 'moderate' | 'conservative';
    narrativeThemes: string[];
    evidenceHierarchy: string[];
    anticipatedCounterarguments: string[];
    responseStrategies: string[];
  };
}

export class AIAnalysisService {
  /**
   * Advanced AI Success Probability Modeling
   * Uses machine learning-inspired algorithms to predict appeal success
   */
  static async generateSuccessProbabilityModel(
    request: MarketDataRequest,
    marketData: Record<string, unknown>,
    assessmentHistory: Record<string, unknown>[],
    jurisdictionData: Record<string, unknown>
  ): Promise<AISuccessProbabilityModel> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Market Factors Analysis (25% weight)
    const marketFactors = {
      priceVariance: this.calculatePriceVarianceScore(marketData),
      marketCondition: this.calculateMarketConditionScore(marketData.marketTrends as Record<string, unknown>),
      comparabilityStrength: this.calculateComparabilityScore(marketData.comparableSales as Record<string, unknown>[]),
      dataQuality: this.calculateDataQualityScore(marketData.comparableSales as Record<string, unknown>[])
    };

    // Property Factors Analysis (30% weight)
    const propertyFactors = {
      assessmentRatio: this.calculateAssessmentRatioScore(assessmentHistory),
      ageAndCondition: this.calculateAgeConditionScore(request.yearBuilt),
      uniquenessScore: this.calculateUniquenessScore(request),
      improvementAccuracy: this.calculateImprovementAccuracyScore(assessmentHistory)
    };

    // Jurisdiction Factors Analysis (25% weight)
    const jurisdictionFactors = {
      historicalSuccessRate: (jurisdictionData.appealSuccessRate as number) || 65,
      assessorProfessionalism: this.calculateAssessorProfessionalismScore(jurisdictionData),
      recentReforms: this.calculateReformImpactScore((jurisdictionData.recentReforms as string[]) || []),
      appealVolume: this.calculateAppealVolumeScore()
    };

    // Timing Factors Analysis (20% weight)
    const timingFactors = {
      daysToDeadline: this.calculateDeadlineTimingScore(),
      seasonalOptimality: this.calculateSeasonalScore(),
      workloadTiming: this.calculateWorkloadTimingScore()
    };

    // AI-weighted probability calculation
    const weightedScore = (
      (marketFactors.priceVariance * 0.08 + marketFactors.marketCondition * 0.06 + 
       marketFactors.comparabilityStrength * 0.06 + marketFactors.dataQuality * 0.05) +
      (propertyFactors.assessmentRatio * 0.12 + propertyFactors.ageAndCondition * 0.06 +
       propertyFactors.uniquenessScore * 0.06 + propertyFactors.improvementAccuracy * 0.06) +
      (jurisdictionFactors.historicalSuccessRate * 0.08 + jurisdictionFactors.assessorProfessionalism * 0.06 +
       jurisdictionFactors.recentReforms * 0.06 + jurisdictionFactors.appealVolume * 0.05) +
      (timingFactors.daysToDeadline * 0.08 + timingFactors.seasonalOptimality * 0.06 +
       timingFactors.workloadTiming * 0.06)
    );

    const overallProbability = Math.min(95, Math.max(15, weightedScore));
    const confidenceInterval: [number, number] = [
      Math.max(5, overallProbability - 12),
      Math.min(98, overallProbability + 12)
    ];

    // AI-generated risk and strength analysis
    const keyRiskFactors = this.identifyRiskFactors({
      marketFactors,
      propertyFactors,
      jurisdictionFactors,
      timingFactors
    });

    const strengthIndicators = this.identifyStrengthIndicators({
      marketFactors,
      propertyFactors,
      jurisdictionFactors,
      timingFactors
    });

    return {
      baseSuccessRate: (jurisdictionData.appealSuccessRate as number) || 65,
      marketFactors,
      propertyFactors,
      jurisdictionFactors,
      timingFactors,
      overallProbability: Math.round(overallProbability * 100) / 100,
      confidenceInterval,
      keyRiskFactors,
      strengthIndicators
    };
  }

  /**
   * Smart Comparable Property Selection Algorithm
   * AI-powered selection and weighting of comparable sales
   */
  static async selectOptimalComparables(
    comparableSales: Record<string, unknown>[],
    subjectProperty: MarketDataRequest
  ): Promise<SmartComparableSelection> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const analyzedComparables = comparableSales.map(comp => {
      const relevanceScore = this.calculateRelevanceScore(comp, subjectProperty);
      const adjustmentReliability = this.calculateAdjustmentReliability(comp);
      const persuasionValue = this.calculatePersuasionValue(comp, relevanceScore);
      
      return {
        id: (comp.id as string) || `comp-${Math.random().toString(36).substr(2, 9)}`,
        address: (comp.address as string) || 'Unknown Address',
        relevanceScore,
        adjustmentReliability,
        persuasionValue,
        strengthRating: this.determineStrengthRating(relevanceScore, adjustmentReliability, persuasionValue),
        weight: this.calculateOptimalWeight(relevanceScore, adjustmentReliability, persuasionValue),
        reasoning: this.generateReasoningPoints(comp, subjectProperty, relevanceScore)
      };
    });

    // AI-driven selection: keep top performers, reject weak ones
    const selectedComparables = analyzedComparables
      .filter(comp => comp.relevanceScore >= 65)
      .sort((a, b) => b.persuasionValue - a.persuasionValue)
      .slice(0, 5);

    const rejectedComparables = analyzedComparables
      .filter(comp => comp.relevanceScore < 65)
      .map(comp => ({
        id: comp.id,
        address: comp.address,
        rejectionReason: this.generateRejectionReason(comp),
        weaknessFactors: this.identifyWeaknessFactors(comp)
      }));

    const overallStrength = selectedComparables.length > 0 
      ? selectedComparables.reduce((sum, comp) => sum + comp.persuasionValue, 0) / selectedComparables.length
      : 0;

    const recommendedNarrative = this.generateComparableNarrative(overallStrength);

    return {
      selectedComparables,
      rejectedComparables,
      overallStrength: Math.round(overallStrength * 100) / 100,
      recommendedNarrative
    };
  }

  /**
   * Enhanced Market Positioning Intelligence
   * AI-driven strategic positioning and approach optimization
   */
  static async generateEnhancedMarketPositioning(
    marketData: Record<string, unknown>,
    successProbability: AISuccessProbabilityModel,
    comparableSelection: SmartComparableSelection
  ): Promise<EnhancedMarketPositioning> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Competitive Analysis
    const competitiveAnalysis = {
      subjectRanking: this.calculateSubjectRanking(marketData),
      peerComparison: this.generatePeerComparison(marketData)
    };

    // Valuation Approach Optimization
    const valuationApproachOptimization = {
      primaryApproach: this.determinePrimaryApproach(successProbability, comparableSelection) as 'sales' | 'income' | 'cost',
      approachStrengths: {
        sales: comparableSelection.overallStrength,
        income: this.calculateIncomeApproachStrength(),
        cost: this.calculateCostApproachStrength()
      },
      recommendedWeighting: this.calculateOptimalWeighting(comparableSelection),
      reasoning: this.generateApproachReasoning(comparableSelection)
    };

    // Strategic Positioning
    const strategicPositioning = {
      appealStrategy: this.determineAppealStrategy(successProbability.overallProbability) as 'aggressive' | 'moderate' | 'conservative',
      narrativeThemes: this.generateNarrativeThemes(successProbability, comparableSelection),
      evidenceHierarchy: this.createEvidenceHierarchy(),
      anticipatedCounterarguments: this.anticipateCounterarguments(),
      responseStrategies: this.developResponseStrategies()
    };

    return {
      competitiveAnalysis,
      valuationApproachOptimization,
      strategicPositioning
    };
  }

  // Private helper methods for AI calculations
  private static calculatePriceVarianceScore(marketData: Record<string, unknown>): number {
    const analysis = marketData.pricePerSqFtAnalysis as Record<string, unknown> || {};
    const variance = Math.abs((analysis.variance as number) || 0);
    return Math.min(100, Math.max(0, 100 - (variance * 2)));
  }

  private static calculateMarketConditionScore(trends: Record<string, unknown>): number {
    const conditionMap = { 'Buyer': 85, 'Balanced': 70, 'Seller': 55 };
    return conditionMap[trends?.marketCondition as keyof typeof conditionMap] || 70;
  }

  private static calculateComparabilityScore(comparables: Record<string, unknown>[]): number {
    if (!comparables || comparables.length === 0) return 0;
    const avgConfidence = comparables.reduce((sum, comp) => sum + ((comp.confidence as number) || 70), 0) / comparables.length;
    return Math.min(100, avgConfidence * 1.2);
  }

  private static calculateDataQualityScore(comparables: Record<string, unknown>[]): number {
    if (!comparables || comparables.length === 0) return 0;
    const mlsCount = comparables.filter(comp => comp.dataSource === 'MLS').length;
    return Math.min(100, (mlsCount / comparables.length) * 80 + 20);
  }

  private static calculateAssessmentRatioScore(history: Record<string, unknown>[]): number {
    if (!history || history.length === 0) return 50;
    const latest = history[0] || {};
    const latestRatio = ((latest.totalAssessment as number) || 0) / ((latest.marketValue as number) || 1);
    return Math.min(100, Math.max(0, (1.1 - latestRatio) * 200));
  }

  private static calculateAgeConditionScore(yearBuilt: number): number {
    const age = new Date().getFullYear() - yearBuilt;
    return Math.min(100, Math.max(20, 100 - (age * 0.8)));
  }

  private static calculateUniquenessScore(request: MarketDataRequest): number {
    // Commercial properties typically have higher uniqueness
    const baseScore = request.propertyType.toLowerCase().includes('office') ? 75 : 85;
    const sizeAdjustment = request.squareFootage > 20000 ? -10 : request.squareFootage < 5000 ? -15 : 0;
    return Math.min(100, Math.max(30, baseScore + sizeAdjustment));
  }

  private static calculateImprovementAccuracyScore(history: Record<string, unknown>[]): number {
    if (!history || history.length < 2) return 70;
    const improvementTrend = history.slice(0, 3).map(h => (h.improvementValue as number) || 0);
    const consistency = this.calculateTrendConsistency(improvementTrend);
    return Math.min(100, consistency * 1.2);
  }

  private static calculateAssessorProfessionalismScore(jurisdiction: Record<string, unknown>): number {
    const reforms = jurisdiction.recentReforms as string[] || [];
    const hasRecentReforms = reforms.length > 0;
    const hasContactInfo = !!jurisdiction.contactInfo;
    return hasRecentReforms && hasContactInfo ? 85 : hasContactInfo ? 70 : 55;
  }

  private static calculateReformImpactScore(reforms: string[]): number {
    return Math.min(100, reforms.length * 15 + 40);
  }

  private static calculateAppealVolumeScore(): number {
    // Mock calculation based on jurisdiction activity
    return 75;
  }

  private static calculateDeadlineTimingScore(): number {
    const daysToDeadline = 45; // Mock
    return Math.min(100, (daysToDeadline / 30) * 70 + 30);
  }

  private static calculateSeasonalScore(): number {
    const month = new Date().getMonth();
    // Q1 and Q2 typically better for appeals
    return month < 6 ? 80 : 65;
  }

  private static calculateWorkloadTimingScore(): number {
    // Mock scoring based on optimal timing
    return 75;
  }

  private static calculateTrendConsistency(values: number[]): number {
    if (values.length < 2) return 70;
    const changes = values.slice(1).map((val, i) => Math.abs(val - values[i]) / values[i]);
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    return Math.min(100, Math.max(30, 100 - (avgChange * 100)));
  }

  private static identifyRiskFactors(factors: Record<string, unknown>): string[] {
    const risks: string[] = [];
    const marketFactors = factors.marketFactors as Record<string, unknown> || {};
    const propertyFactors = factors.propertyFactors as Record<string, unknown> || {};
    const jurisdictionFactors = factors.jurisdictionFactors as Record<string, unknown> || {};
    const timingFactors = factors.timingFactors as Record<string, unknown> || {};
    
    if ((marketFactors.priceVariance as number || 100) < 50) risks.push('High price variance in market');
    if ((propertyFactors.assessmentRatio as number || 100) < 60) risks.push('Assessment appears reasonable relative to market');
    if ((jurisdictionFactors.historicalSuccessRate as number || 100) < 50) risks.push('Low historical success rate in jurisdiction');
    if ((timingFactors.daysToDeadline as number || 100) < 50) risks.push('Limited time remaining before deadline');
    return risks;
  }

  private static identifyStrengthIndicators(factors: Record<string, unknown>): string[] {
    const strengths: string[] = [];
    const marketFactors = factors.marketFactors as Record<string, unknown> || {};
    const propertyFactors = factors.propertyFactors as Record<string, unknown> || {};
    const jurisdictionFactors = factors.jurisdictionFactors as Record<string, unknown> || {};
    const timingFactors = factors.timingFactors as Record<string, unknown> || {};
    
    if ((marketFactors.comparabilityStrength as number || 0) > 80) strengths.push('Strong comparable sales evidence');
    if ((propertyFactors.assessmentRatio as number || 0) > 80) strengths.push('Assessment appears high relative to market value');
    if ((jurisdictionFactors.historicalSuccessRate as number || 0) > 70) strengths.push('Favorable jurisdiction with good success rates');
    if ((timingFactors.seasonalOptimality as number || 0) > 75) strengths.push('Optimal timing for appeal filing');
    return strengths;
  }

  private static calculateRelevanceScore(comp: Record<string, unknown>, subject: MarketDataRequest): number {
    let score = 70; // Base score
    
    // Distance penalty
    const distance = (comp.distanceFromSubject as number) || 1;
    score -= Math.min(20, distance * 5);
    
    // Size similarity bonus
    const compSqFt = (comp.squareFootage as number) || subject.squareFootage;
    const sizeDiff = Math.abs(compSqFt - subject.squareFootage) / subject.squareFootage;
    score += Math.max(0, 15 - (sizeDiff * 30));
    
    // Property type match
    if (comp.propertyType === subject.propertyType) score += 10;
    
    // Sale date recency
    const daysSinceSale = (comp.daysSinceListingDate as number) || 100;
    score += Math.max(0, 15 - (daysSinceSale / 30));
    
    return Math.min(100, Math.max(0, score));
  }

  private static calculateAdjustmentReliability(comp: Record<string, unknown>): number {
    const adjustments = comp.adjustments as Record<string, unknown> || {};
    const totalAdjustment = Math.abs((adjustments.total as number) || 0);
    return Math.min(100, Math.max(30, 100 - (totalAdjustment * 8)));
  }

  private static calculatePersuasionValue(comp: Record<string, unknown>, relevanceScore: number): number {
    const confidence = (comp.confidence as number) || 70;
    const dataQuality = comp.dataSource === 'MLS' ? 100 : comp.dataSource === 'County_Records' ? 85 : 70;
    return (relevanceScore * 0.4 + confidence * 0.3 + dataQuality * 0.3);
  }

  private static determineStrengthRating(relevance: number, reliability: number, persuasion: number): 'Excellent' | 'Good' | 'Fair' | 'Weak' {
    const overall = (relevance + reliability + persuasion) / 3;
    if (overall >= 85) return 'Excellent';
    if (overall >= 70) return 'Good';
    if (overall >= 55) return 'Fair';
    return 'Weak';
  }

  private static calculateOptimalWeight(relevance: number, reliability: number, persuasion: number): number {
    return Math.round(((relevance + reliability + persuasion) / 3) * 100) / 100;
  }

  private static generateReasoningPoints(comp: Record<string, unknown>, subject: MarketDataRequest, relevance: number): string[] {
    const points: string[] = [];
    if (relevance > 80) points.push('Highly comparable location and characteristics');
    if (comp.dataSource === 'MLS') points.push('Verified MLS transaction data');
    if ((comp.distanceFromSubject as number || 999) <= 0.5) points.push('Excellent proximity to subject property');
    const compSqFt = (comp.squareFootage as number) || subject.squareFootage;
    if (Math.abs(compSqFt - subject.squareFootage) / subject.squareFootage < 0.1) {
      points.push('Very similar square footage');
    }
    return points;
  }

  private static generateRejectionReason(comp: Record<string, unknown>): string {
    if ((comp.distanceFromSubject as number || 0) > 2) return 'Too distant from subject property';
    if ((comp.confidence as number || 100) < 60) return 'Low confidence in sale data';
    const adjustments = comp.adjustments as Record<string, unknown> || {};
    if (Math.abs((adjustments.total as number) || 0) > 15) return 'Requires excessive adjustments';
    return 'Insufficient comparability';
  }

  private static identifyWeaknessFactors(comp: Record<string, unknown>): string[] {
    const factors: string[] = [];
    if ((comp.distanceFromSubject as number || 0) > 1.5) factors.push('Distance from subject');
    if ((comp.confidence as number || 100) < 70) factors.push('Data reliability concerns');
    if ((comp.daysOnMarket as number || 0) > 90) factors.push('Extended marketing time');
    return factors;
  }

  private static generateComparableNarrative(strength: number): string {
    if (strength > 85) {
      return 'Excellent comparable sales provide strong market evidence with minimal adjustments required.';
    } else if (strength > 70) {
      return 'Good comparable sales support market valuation with reasonable adjustments.';
    } else {
      return 'Limited but usable comparable sales require careful adjustment analysis.';
    }
  }

  // Additional helper methods for enhanced positioning
  private static calculateSubjectRanking(marketData: Record<string, unknown>): number {
    const analysis = marketData.pricePerSqFtAnalysis as Record<string, unknown> || {};
    const variance = (analysis.variance as number) || 0;
    return Math.min(95, Math.max(5, 50 + variance));
  }

  private static generatePeerComparison(marketData: Record<string, unknown>): Array<{metric: string; subjectValue: number; marketAverage: number; advantageScore: number}> {
    const analysis = marketData.pricePerSqFtAnalysis as Record<string, unknown> || {};
    return [
      {
        metric: 'Price per Square Foot',
        subjectValue: (analysis.subject as number) || 0,
        marketAverage: (analysis.marketAverage as number) || 0,
        advantageScore: Math.abs((analysis.variance as number) || 0)
      }
    ];
  }

  private static determinePrimaryApproach(successProbability: AISuccessProbabilityModel, comparables: SmartComparableSelection): string {
    if (comparables.overallStrength > 75) return 'sales';
    if (successProbability.propertyFactors.assessmentRatio > 75) return 'income';
    return 'cost';
  }

  private static calculateIncomeApproachStrength(): number {
    return 70; // Mock calculation
  }

  private static calculateCostApproachStrength(): number {
    return 65; // Mock calculation
  }

  private static calculateOptimalWeighting(comparables: SmartComparableSelection): {sales: number; income: number; cost: number} {
    const salesStrength = comparables.overallStrength;
    const total = salesStrength + 70 + 65; // income + cost strengths
    
    return {
      sales: Math.round((salesStrength / total) * 100),
      income: Math.round((70 / total) * 100),
      cost: Math.round((65 / total) * 100)
    };
  }

  private static generateApproachReasoning(comparables: SmartComparableSelection): string[] {
    const reasoning: string[] = [];
    if (comparables.overallStrength > 75) {
      reasoning.push('Strong comparable sales evidence supports market approach');
    }
    reasoning.push('Multiple approaches provide comprehensive valuation perspective');
    return reasoning;
  }

  private static determineAppealStrategy(probability: number): string {
    if (probability > 80) return 'aggressive';
    if (probability > 60) return 'moderate';
    return 'conservative';
  }

  private static generateNarrativeThemes(successProbability: AISuccessProbabilityModel, comparables: SmartComparableSelection): string[] {
    const themes: string[] = [];
    if (successProbability.overallProbability > 75) {
      themes.push('Market evidence strongly supports lower valuation');
    }
    if (comparables.overallStrength > 80) {
      themes.push('Comparable sales demonstrate overassessment');
    }
    themes.push('Professional analysis indicates assessment exceeds market value');
    return themes;
  }

  private static createEvidenceHierarchy(): string[] {
    return [
      'Comparable sales analysis',
      'Market trend analysis',
      'Assessment history review',
      'Property-specific factors'
    ];
  }

  private static anticipateCounterarguments(): string[] {
    return [
      'Assessor may claim comparables are not sufficiently similar',
      'Assessment methodology may be defended as standard practice',
      'Market appreciation since assessment date may be cited'
    ];
  }

  private static developResponseStrategies(): string[] {
    return [
      'Prepare detailed comparable analysis with adjustment justifications',
      'Document assessment methodology concerns with specific examples',
      'Provide current market evidence to support valuation conclusions'
    ];
  }
}