// Phase 1 Market Data Service - Enterprise Intelligence Layer
import type { 
  ComparableSale, 
  MarketTrendAnalysis, 
  AssessmentHistory, 
  JurisdictionIntelligence,
  PropertyDetailedAnalytics 
} from '@/store/propertyAnalysis';

export interface MarketDataRequest {
  address: string;
  propertyType: string;
  squareFootage: number;
  yearBuilt: number;
  jurisdiction: string;
  parcelNumber: string;
  radiusMiles?: number; // default 3 miles
  maxComps?: number; // default 10
  maxAgeDays?: number; // default 365
}

export class MarketDataService {
  // Note: API_BASE reserved for future backend integration
  // private static readonly API_BASE = '/api/market-data';
  
  /**
   * Phase 1: Comparable Sales Analysis with MLS-Style Intelligence
   */
  static async getComparableSales(request: MarketDataRequest): Promise<ComparableSale[]> {
    // For Phase 1, we'll generate sophisticated mock data that demonstrates
    // the enhanced intelligence layer. In production, this would integrate with:
    // - MLS APIs (RETS, RESO Web API)
    // - County records databases
    // - Third-party data providers (CoreLogic, Black Knight, etc.)
    
    const mockComparables: ComparableSale[] = [
      {
        id: 'comp_001',
        address: '1515 Commerce Dr #200',
        saleDate: '2024-03-15',
        salePrice: 2850000,
        pricePerSqFt: 185.50,
        squareFootage: 15360,
        propertyType: request.propertyType,
        distanceFromSubject: 0.3,
        daysSinceListingDate: 45,
        daysOnMarket: 67,
        adjustedSalePrice: 2920000,
        adjustments: {
          location: 2.5, // percentage
          condition: -1.0,
          size: 0.5,
          age: 1.5,
          features: -1.0,
          total: 2.5
        },
        dataSource: 'MLS',
        confidence: 92
      },
      {
        id: 'comp_002',
        address: '2100 Executive Plaza',
        saleDate: '2024-01-22',
        salePrice: 3200000,
        pricePerSqFt: 195.75,
        squareFootage: 16350,
        propertyType: request.propertyType,
        distanceFromSubject: 0.8,
        daysSinceListingDate: 89,
        daysOnMarket: 34,
        adjustedSalePrice: 3150000,
        adjustments: {
          location: -2.0,
          condition: 1.5,
          size: 0.0,
          age: -2.5,
          features: 1.5,
          total: -1.5
        },
        dataSource: 'County_Records',
        confidence: 88
      },
      {
        id: 'comp_003',
        address: '3450 Technology Blvd',
        saleDate: '2023-11-08',
        salePrice: 2650000,
        pricePerSqFt: 172.25,
        squareFootage: 15400,
        propertyType: request.propertyType,
        distanceFromSubject: 1.2,
        daysSinceListingDate: 156,
        daysOnMarket: 89,
        adjustedSalePrice: 2780000,
        adjustments: {
          location: -1.5,
          condition: 2.0,
          size: 0.0,
          age: 3.5,
          features: 0.8,
          total: 4.8
        },
        dataSource: 'Third_Party',
        confidence: 85
      }
    ];

    // Simulate API delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return mockComparables;
  }

  /**
   * Market Trend Analysis with Statistical Intelligence
   */
  static async getMarketTrends(jurisdiction: string): Promise<MarketTrendAnalysis> {
    const mockTrends: MarketTrendAnalysis = {
      jurisdiction,
      timeframe: '3Y',
      averagePriceChange: 8.7, // 8.7% appreciation
      medianPriceChange: 7.2,
      salesVolume: 247, // transactions in timeframe
      averageDaysOnMarket: 52,
      priceVariance: 12.3, // coefficient of variation
      marketCondition: 'Balanced',
      seasonalAdjustment: -2.1, // Q1 adjustment
      lastUpdated: new Date().toISOString()
    };

    await new Promise(resolve => setTimeout(resolve, 600));
    return mockTrends;
  }

  /**
   * 5-Year Assessment History Analysis
   */
  static async getAssessmentHistory(): Promise<AssessmentHistory[]> {
    const currentYear = new Date().getFullYear();
    const mockHistory: AssessmentHistory[] = [
      {
        taxYear: currentYear - 1,
        landValue: 850000,
        improvementValue: 1950000,
        totalAssessment: 2800000,
        exemptions: 0,
        netTaxableValue: 2800000,
        effectiveTaxRate: 2.45,
        changeFromPreviousYear: 6.8,
        appealStatus: 'None',
        marketValue: 3200000
      },
      {
        taxYear: currentYear - 2,
        landValue: 820000,
        improvementValue: 1800000,
        totalAssessment: 2620000,
        exemptions: 0,
        netTaxableValue: 2620000,
        effectiveTaxRate: 2.41,
        changeFromPreviousYear: 4.2,
        appealStatus: 'None',
        marketValue: 2980000
      },
      {
        taxYear: currentYear - 3,
        landValue: 800000,
        improvementValue: 1715000,
        totalAssessment: 2515000,
        exemptions: 0,
        netTaxableValue: 2515000,
        effectiveTaxRate: 2.38,
        changeFromPreviousYear: 8.9,
        appealStatus: 'Filed',
        marketValue: 2850000
      },
      {
        taxYear: currentYear - 4,
        landValue: 780000,
        improvementValue: 1530000,
        totalAssessment: 2310000,
        exemptions: 0,
        netTaxableValue: 2310000,
        effectiveTaxRate: 2.35,
        changeFromPreviousYear: 3.1,
        appealStatus: 'None',
        marketValue: 2620000
      },
      {
        taxYear: currentYear - 5,
        landValue: 760000,
        improvementValue: 1480000,
        totalAssessment: 2240000,
        exemptions: 0,
        netTaxableValue: 2240000,
        effectiveTaxRate: 2.32,
        changeFromPreviousYear: 2.8,
        appealStatus: 'None',
        marketValue: 2480000
      }
    ];

    await new Promise(resolve => setTimeout(resolve, 500));
    return mockHistory;
  }

  /**
   * Jurisdiction Intelligence with Appeal Analytics
   */
  static async getJurisdictionIntelligence(jurisdiction: string): Promise<JurisdictionIntelligence> {
    const mockIntelligence: JurisdictionIntelligence = {
      name: jurisdiction,
      county: 'Dallas County',
      state: 'Texas',
      appealDeadline: 'May 15th (or 30 days from notice)',
      appealFee: 50,
      appealSuccessRate: 68.5, // percentage
      averageReduction: 12.8, // percentage
      assessmentCycle: 'Annual',
      assessmentRatio: 0.875, // 87.5% of market value
      recentReforms: [
        'SB 2 (2019) - Property tax reform limiting appraisal increases',
        'HB 3 (2019) - School finance reform affecting rates',
        'New homestead exemption increases (2023)'
      ],
      contactInfo: {
        assessorName: 'John C. Ames',
        phone: '(214) 653-7811',
        email: 'appeals@dallascad.org',
        address: '2949 N. Stemmons Fwy, Dallas, TX 75247'
      },
      lastUpdated: new Date().toISOString()
    };

    await new Promise(resolve => setTimeout(resolve, 400));
    return mockIntelligence;
  }

  /**
   * Enhanced Property Analytics
   */
  static async getPropertyAnalytics(request: MarketDataRequest): Promise<PropertyDetailedAnalytics> {
    const currentYear = new Date().getFullYear();
    const effectiveAge = Math.max(0, currentYear - request.yearBuilt - 5); // assuming some renovations
    
    const mockAnalytics: PropertyDetailedAnalytics = {
      conditionScore: 7.5, // 1-10 scale
      effectiveAge,
      functionalObsolescence: 8.5, // percentage
      externalObsolescence: 3.2, // percentage
      renovationHistory: [
        {
          year: 2019,
          type: 'HVAC System Upgrade',
          cost: 125000,
          impact: 4.2 // percentage value impact
        },
        {
          year: 2021,
          type: 'Interior Renovation',
          cost: 89000,
          impact: 3.8
        }
      ],
      complianceIssues: [
        'ADA compliance update recommended',
        'Energy efficiency improvements available'
      ],
      marketPosition: 'Average',
      investmentGrade: 'B',
      liquidityScore: 6.8 // 1-10 scale
    };

    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAnalytics;
  }

  /**
   * SUPERNOVA PHASE 2B: AI-Enhanced Comprehensive Market Intelligence
   * Integrates advanced AI analysis with market intelligence
   */
  static async getComprehensiveMarketIntelligence(request: MarketDataRequest) {
    // Execute all data fetching in parallel for optimal performance
    const [comparables, trends, history, jurisdiction, analytics] = await Promise.all([
      this.getComparableSales(request),
      this.getMarketTrends(request.jurisdiction),
      this.getAssessmentHistory(),
      this.getJurisdictionIntelligence(request.jurisdiction),
      this.getPropertyAnalytics(request)
    ]);

    // Calculate enhanced analytics
    const avgPricePerSqFt = comparables.reduce((sum, comp) => sum + comp.pricePerSqFt, 0) / comparables.length;
    const subjectPricePerSqFt = request.squareFootage > 0 ? (comparables[0]?.adjustedSalePrice || 0) / request.squareFootage : 0;
    
    const pricePerSqFtAnalysis = {
      subject: subjectPricePerSqFt,
      marketAverage: avgPricePerSqFt,
      variance: ((subjectPricePerSqFt - avgPricePerSqFt) / avgPricePerSqFt) * 100,
      ranking: (subjectPricePerSqFt > avgPricePerSqFt * 1.05 ? 'Above' : 
                subjectPricePerSqFt < avgPricePerSqFt * 0.95 ? 'Below' : 'At') as 'Above' | 'At' | 'Below'
    };

    // Calculate market position score (1-100)
    const marketPositionScore = Math.min(100, Math.max(1, 
      50 + (pricePerSqFtAnalysis.variance * 2) + (analytics.conditionScore * 5)
    ));

    // Calculate appeal timing score (1-100)
    const daysToDeadline = 45; // mock calculation
    const appealTimingScore = Math.min(100, Math.max(1,
      (daysToDeadline / 365 * 50) + (jurisdiction.appealSuccessRate / 2) + 25
    ));

    return {
      marketData: {
        comparableSales: comparables,
        marketTrends: trends,
        pricePerSqFtAnalysis
      },
      assessmentHistory: history,
      jurisdictionData: jurisdiction,
      propertyAnalytics: analytics,
      marketPositionScore,
      appealTimingScore,
      strategicRecommendations: {
        primaryStrategy: marketPositionScore > 70 ? 'Market-based appeal with comparable sales evidence' : 'Assessment methodology challenge',
        alternativeStrategies: [
          'Income approach valuation challenge',
          'Functional obsolescence argument',
          'Assessment ratio inequality argument'
        ],
        riskMitigation: [
          'File before deadline with comprehensive documentation',
          'Prepare for potential counter-evidence from assessor',
          'Consider professional appraiser if needed'
        ],
        timeline: 'File within 30 days for optimal positioning',
        expectedOutcome: `${Math.round(jurisdiction.averageReduction)}% reduction potential based on jurisdiction history`
      }
    };
  }

  /**
   * SUPERNOVA PHASE 2B: AI-Enhanced Report Generation
   * Generates supernova-level reports with advanced AI analysis
   */
  static async generateSupernova2BReport(request: MarketDataRequest) {
    // Import AI analysis service dynamically to avoid circular dependencies
    const { AIAnalysisService } = await import('./aiAnalysisService');
    
    // Get base market intelligence
    const baseIntelligence = await this.getComprehensiveMarketIntelligence(request);
    
    // Execute AI analysis in parallel for optimal performance
    const [successProbability, smartComparables] = await Promise.all([
      AIAnalysisService.generateSuccessProbabilityModel(
        request,
        baseIntelligence.marketData as Record<string, unknown>,
        baseIntelligence.assessmentHistory as unknown as Record<string, unknown>[],
        baseIntelligence.jurisdictionData as unknown as Record<string, unknown>
      ),
      AIAnalysisService.selectOptimalComparables(
        baseIntelligence.marketData.comparableSales as unknown as Record<string, unknown>[],
        request
      )
    ]);

    // Generate enhanced positioning with complete data
    const finalEnhancedPositioning = await AIAnalysisService.generateEnhancedMarketPositioning(
      baseIntelligence.marketData as Record<string, unknown>,
      successProbability,
      smartComparables
    );

    return {
      ...baseIntelligence,
      // SUPERNOVA PHASE 2B AI ENHANCEMENTS
      aiEnhancements: {
        successProbabilityModel: successProbability,
        smartComparableSelection: smartComparables,
        enhancedMarketPositioning: finalEnhancedPositioning,
        generatedAt: new Date().toISOString(),
        analysisVersion: '2B-Supernova',
        confidenceLevel: Math.round(
          (successProbability.overallProbability + 
           smartComparables.overallStrength + 
           finalEnhancedPositioning.competitiveAnalysis.subjectRanking) / 3
        )
      },
      // Enhanced strategic recommendations using AI insights
      supernovaRecommendations: {
        primaryStrategy: finalEnhancedPositioning.strategicPositioning.appealStrategy,
        narrativeThemes: finalEnhancedPositioning.strategicPositioning.narrativeThemes,
        evidenceHierarchy: finalEnhancedPositioning.strategicPositioning.evidenceHierarchy,
        anticipatedCounterarguments: finalEnhancedPositioning.strategicPositioning.anticipatedCounterarguments,
        responseStrategies: finalEnhancedPositioning.strategicPositioning.responseStrategies,
        optimalTiming: this.calculateOptimalTiming(successProbability as unknown as Record<string, unknown>),
        riskAssessment: {
          level: successProbability.overallProbability > 75 ? 'Low' : 
                 successProbability.overallProbability > 60 ? 'Medium' : 'High',
          factors: successProbability.keyRiskFactors,
          mitigation: this.generateRiskMitigation(successProbability as unknown as Record<string, unknown>)
        },
        successPrediction: {
          probability: successProbability.overallProbability,
          confidenceInterval: successProbability.confidenceInterval,
          expectedReduction: this.calculateExpectedReduction(successProbability as unknown as Record<string, unknown>, baseIntelligence.jurisdictionData as unknown as Record<string, unknown>),
          timelineEstimate: this.estimateAppealTimeline(baseIntelligence.jurisdictionData as unknown as Record<string, unknown>)
        }
      }
    };
  }

  // Private helper methods for Supernova enhancements
  private static calculateOptimalTiming(successProbability: Record<string, unknown>): string {
    const timingFactors = successProbability.timingFactors as Record<string, unknown> || {};
    const daysToDeadline = (timingFactors.daysToDeadline as number) || 0;
    
    if (daysToDeadline > 80) {
      return 'Optimal timing - file within 2 weeks for maximum effectiveness';
    } else if (daysToDeadline > 60) {
      return 'Good timing - file within 3-4 weeks';
    } else {
      return 'Limited time - file immediately to meet deadline';
    }
  }

  private static generateRiskMitigation(successProbability: Record<string, unknown>): string[] {
    const mitigation: string[] = [];
    const marketFactors = successProbability.marketFactors as Record<string, unknown> || {};
    const propertyFactors = successProbability.propertyFactors as Record<string, unknown> || {};
    const jurisdictionFactors = successProbability.jurisdictionFactors as Record<string, unknown> || {};
    
    if ((marketFactors.priceVariance as number || 100) < 60) {
      mitigation.push('Prepare additional market evidence to strengthen comparable analysis');
    }
    
    if ((propertyFactors.assessmentRatio as number || 100) < 70) {
      mitigation.push('Focus on assessment methodology challenges rather than market value');
    }
    
    if ((jurisdictionFactors.historicalSuccessRate as number || 100) < 60) {
      mitigation.push('Consider professional appraiser testimony to strengthen case');
    }
    
    mitigation.push('Document all analysis thoroughly for potential hearing presentation');
    
    return mitigation;
  }

  private static calculateExpectedReduction(successProbability: Record<string, unknown>, jurisdiction: Record<string, unknown>): string {
    const baseReduction = (jurisdiction.averageReduction as number) || 12;
    const confidenceMultiplier = ((successProbability.overallProbability as number) || 75) / 100;
    const adjustedReduction = baseReduction * confidenceMultiplier;
    
    return `${Math.round(adjustedReduction * 100) / 100}% (${Math.round(adjustedReduction * 0.8)}-${Math.round(adjustedReduction * 1.2)}% range)`;
  }

  private static estimateAppealTimeline(jurisdiction: Record<string, unknown>): string {
    return (jurisdiction.averageAppealTime as string) || '45-90 days from filing to resolution';
  }
}

// Named export for the main function
export const generateSupernova2BReport = MarketDataService.generateSupernova2BReport.bind(MarketDataService);