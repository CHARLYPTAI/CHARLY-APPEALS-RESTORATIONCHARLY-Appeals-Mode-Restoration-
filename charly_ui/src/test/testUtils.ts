// Test Utilities for CHARLY System
import type { ReportData } from '@/types/report'

/**
 * Creates a complete mock ReportData object with all required fields
 */
export function createMockReportData(overrides: Partial<ReportData> = {}): ReportData {
  const baseReportData: ReportData = {
    property: {
      id: 'test-property-1',
      address: '123 Test Street',
      currentAssessment: 450000,
      estimatedValue: 520000,
      potentialSavings: 70000,
      squareFootage: 2500,
      yearBuilt: 2010,
      propertyType: 'Residential',
      jurisdiction: 'Test County',
      parcelNumber: 'TEST123456',
      ...overrides.property
    },
    analysis: {
      confidence_score: 0.85,
      success_probability: 85,
      key_factors: [
        'Market value significantly exceeds assessed value',
        'Strong comparable sales support lower valuation'
      ],
      assessment_issues: [
        'Assessment appears 13.5% above market value',
        'Comparable sales indicate overvaluation'
      ],
      market_position: 'Favorable for appeal',
      recommendation: 'Proceed with formal appeal',
      narrative: 'Property assessment exceeds market indicators by significant margin.',
      ...overrides.analysis
    },
    valuation: {
      incomeValue: 510000,
      salesValue: 520000,
      costValue: 495000,
      weightedValue: 515000,
      approach_weights: {
        income: 0.3,
        sales: 0.5,
        cost: 0.2
      },
      ...overrides.valuation
    },
    date: new Date().toISOString().split('T')[0],
    preparedBy: 'CHARLY AI System',
    reportType: 'Supernova 2B Analysis',
    appealRecommendation: 'Proceed with formal appeal based on market analysis',
    assessmentAnalysis: {
      currentAssessment: 450000,
      estimatedMarketValue: 520000,
      assessmentToValueRatio: '86.5%',
      overAssessmentAmount: 70000,
      overAssessmentPercentage: '13.5%',
      confidenceLevel: 85,
      successProbability: 85,
      ...overrides.assessmentAnalysis
    },
    financialImpact: {
      currentAnnualTaxes: 11250,
      projectedAnnualTaxes: 9500,
      annualTaxSavings: 1750,
      fiveYearSavings: 8750,
      appealCost: 2500,
      netBenefit: 6250,
      roi: 2.5,
      paybackPeriod: '1.4 years',
      ...overrides.financialImpact
    },
    valuationSummary: {
      incomeApproachValue: 510000,
      salesApproachValue: 520000,
      costApproachValue: 495000,
      reconciledValue: 515000,
      weights: {
        income: 0.3,
        sales: 0.5,
        cost: 0.2
      },
      ...overrides.valuationSummary
    },
    marketAnalysis: {
      jurisdiction: 'Test County',
      propertyType: 'Residential',
      comparableSalesCount: 5,
      marketTrend: 'Stable',
      averagePricePerSqFt: 208,
      subjectPricePerSqFt: 180,
      priceVariance: -13.5,
      marketPosition: 'Below market average',
      comparableSales: [
        {
          address: '125 Test Street',
          saleDate: '2024-01-15',
          salePrice: 485000,
          squareFootage: 2400,
          pricePerSqFt: 202,
          distance: 0.1
        },
        {
          address: '127 Test Street', 
          saleDate: '2024-02-20',
          salePrice: 510000,
          squareFootage: 2600,
          pricePerSqFt: 196,
          distance: 0.15
        }
      ],
      assessmentHistory: [
        {
          year: 2024,
          assessment: 450000,
          marketValue: 520000,
          change: 5.2
        },
        {
          year: 2023,
          assessment: 427500,
          marketValue: 495000,
          change: 3.8
        }
      ],
      jurisdictionIntelligence: {
        appealFee: 500,
        averageAppealTime: '90 days',
        successRate: 67,
        appealDeadline: '2024-09-30',
        assessmentRatio: 0.86
      },
      propertyAnalytics: {
        marketTrendScore: 75,
        assessmentHistoryScore: 82,
        comparabilityScore: 88,
        liquidityScore: 70
      },
      strategicRecommendations: {
        appealTiming: 'File within 30 days for optimal positioning',
        keyArguments: [
          'Assessment exceeds market value by 13.5%',
          'Recent comparable sales support 15% reduction',
          'Property characteristics align with lower-valued comparables'
        ],
        evidenceStrength: 85,
        alternativeStrategies: [
          'Informal hearing first to test assessor response',
          'Independent appraisal to strengthen position'
        ]
      },
      ...overrides.marketAnalysis
    },
    marketPositionScore: 82,
    appealTimingScore: 88,
    supernovaEnhancements: {
      aiAnalysis: {
        successProbability: 85,
        keyStrengths: [
          'Market value significantly exceeds assessed value',
          'Strong comparable sales support lower valuation'
        ],
        riskFactors: [
          'Limited recent comparable sales',
          'Potential assessor argument for recent improvements'
        ],
        marketFactors: {
          priceVariance: 12.5,
          marketCondition: 8.2,
          comparabilityStrength: 9.1,
          dataQuality: 8.8
        },
        propertyFactors: {
          assessmentRatio: 86.5,
          ageAndCondition: 7.5,
          uniquenessScore: 6.2,
          improvementAccuracy: 8.9
        }
      },
      marketPositioning: {
        recommendation: 'Proceed with formal appeal',
        strategicApproach: 'Focus on market analysis and comparable sales methodology',
        keyArguments: [
          'Assessment exceeds market value by 13.5%',
          'Comparable properties support 15% reduction'
        ],
        potentialChallenges: [
          'Assessor may argue recent improvements',
          'Limited comparable data from current tax year'
        ]
      },
      iaaoCompliance: {
        overallScore: 92,
        standardsAnalysis: [
          { standard: 'Standard 1: Equity', score: 95, status: 'Excellent' },
          { standard: 'Standard 2: Market Value', score: 88, status: 'Good' },
          { standard: 'Standard 3: Uniformity', score: 90, status: 'Excellent' }
        ]
      },
      ...overrides.supernovaEnhancements
    }
  }

  return baseReportData
}

/**
 * Creates a minimal mock ReportData for simple tests
 */
export function createMinimalMockReportData(overrides: Partial<ReportData> = {}): ReportData {
  return createMockReportData({
    property: {
      id: 'minimal-1',
      address: '123 Test Street',
      currentAssessment: 400000,
      estimatedValue: 450000,
      potentialSavings: 50000,
      squareFootage: 2000,
      yearBuilt: 2015,
      propertyType: 'Residential',
      jurisdiction: 'Test County',
      parcelNumber: 'MIN123'
    },
    analysis: {
      confidence_score: 0.75,
      success_probability: 75,
      key_factors: ['Basic market analysis'],
      assessment_issues: ['Minor overassessment'],
      market_position: 'Moderate',
      recommendation: 'Consider appeal'
    },
    ...overrides
  })
}

/**
 * Creates accessibility-focused test data
 */
export function createAccessibilityMockData(): ReportData {
  return createMockReportData({
    property: {
      address: 'Accessibility Test Property',
      currentAssessment: 500000,
      estimatedValue: 550000
    },
    analysis: {
      recommendation: 'Strong case for accessibility compliance testing'
    }
  })
}

/**
 * Type definitions for jest-axe
 */
// Remove namespace approach for jest-axe types since we installed @types/jest-axe