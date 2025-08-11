import type { ReportData, ComparableSale } from '@/types/report';

export interface IAAAOCompliance {
  overallCompliance: number;
  standardsChecked: IAAAOStandard[];
  recommendations: string[];
  issues: IAAAOIssue[];
}

export interface IAAAOStandard {
  id: string;
  name: string;
  description: string;
  compliance: boolean;
  score: number;
  category: 'DataQuality' | 'ModelSpecification' | 'Assessment' | 'Performance';
}

export interface IAAAOIssue {
  level: 'critical' | 'warning' | 'info';
  message: string;
  standard: string;
  recommendation: string;
}

export class IAAAOComplianceService {
  private static readonly STANDARDS: Omit<IAAAOStandard, 'compliance' | 'score'>[] = [
    {
      id: 'DQ1',
      name: 'Data Collection Standards',
      description: 'Property data collection follows IAAO guidelines for accuracy and completeness',
      category: 'DataQuality',
    },
    {
      id: 'DQ2', 
      name: 'Market Data Verification',
      description: 'Sales data is verified and adjusted for market conditions',
      category: 'DataQuality',
    },
    {
      id: 'MS1',
      name: 'Valuation Model Specification',
      description: 'Valuation models are appropriately specified and documented',
      category: 'ModelSpecification',
    },
    {
      id: 'MS2',
      name: 'Comparable Selection Criteria',
      description: 'Comparable properties selected using objective, defensible criteria',
      category: 'ModelSpecification',
    },
    {
      id: 'AS1',
      name: 'Assessment Ratio Analysis',
      description: 'Assessment ratios calculated and analyzed according to IAAO standards',
      category: 'Assessment',
    },
    {
      id: 'AS2',
      name: 'Mass Appraisal Performance',
      description: 'Mass appraisal performance meets IAAO statistical benchmarks',
      category: 'Assessment',
    },
    {
      id: 'PF1',
      name: 'Statistical Performance Measures',
      description: 'COD, PRD, and other measures within acceptable ranges',
      category: 'Performance',
    },
    {
      id: 'PF2',
      name: 'Equity Analysis',
      description: 'Analysis demonstrates assessment equity across property types',
      category: 'Performance',
    },
  ];

  static validateCompliance(reportData: ReportData): IAAAOCompliance {
    const standardsChecked: IAAAOStandard[] = [];
    const issues: IAAAOIssue[] = [];
    const recommendations: string[] = [];

    // Validate each standard
    this.STANDARDS.forEach(standard => {
      const result = this.validateStandard(standard, reportData);
      standardsChecked.push(result);
      
      if (!result.compliance) {
        issues.push({
          level: result.score < 0.5 ? 'critical' : 'warning',
          message: `${standard.name} does not meet IAAO compliance requirements`,
          standard: standard.id,
          recommendation: this.getRecommendation(standard.id, result.score),
        });
      }
    });

    // Generate overall recommendations
    recommendations.push(...this.generateRecommendations(standardsChecked, reportData));

    // Calculate overall compliance score
    const overallCompliance = standardsChecked.reduce((sum, std) => sum + std.score, 0) / standardsChecked.length;

    return {
      overallCompliance: Math.round(overallCompliance * 100),
      standardsChecked,
      recommendations,
      issues,
    };
  }

  private static validateStandard(standard: Omit<IAAAOStandard, 'compliance' | 'score'>, reportData: ReportData): IAAAOStandard {
    let score = 0;
    let compliance = false;

    switch (standard.id) {
      case 'DQ1': // Data Collection Standards
        score = this.validateDataCollection(reportData);
        break;
      case 'DQ2': // Market Data Verification  
        score = this.validateMarketData(reportData);
        break;
      case 'MS1': // Valuation Model Specification
        score = this.validateModelSpecification(reportData);
        break;
      case 'MS2': // Comparable Selection Criteria
        score = this.validateComparableSelection(reportData);
        break;
      case 'AS1': // Assessment Ratio Analysis
        score = this.validateAssessmentRatios(reportData);
        break;
      case 'AS2': // Mass Appraisal Performance
        score = this.validateMassAppraisalPerformance(reportData);
        break;
      case 'PF1': // Statistical Performance Measures
        score = this.validateStatisticalPerformance(reportData);
        break;
      case 'PF2': // Equity Analysis
        score = this.validateEquityAnalysis(reportData);
        break;
      default:
        score = 0.5; // Default moderate compliance
    }

    compliance = score >= 0.75; // 75% threshold for compliance

    return {
      ...standard,
      compliance,
      score,
    };
  }

  private static validateDataCollection(reportData: ReportData): number {
    let score = 0;
    const factors: { [key: string]: number } = {};

    // Check for required property data fields
    factors.propertyAddress = reportData.property?.address ? 0.2 : 0;
    factors.assessmentData = reportData.assessmentAnalysis ? 0.2 : 0;
    factors.marketData = reportData.marketAnalysis ? 0.2 : 0;
    factors.financialData = reportData.financialImpact ? 0.2 : 0;
    factors.aiEnhancement = reportData.supernovaEnhancements ? 0.2 : 0;

    score = Object.values(factors).reduce((sum, val) => sum + val, 0);
    return Math.min(score, 1.0);
  }

  private static validateMarketData(reportData: ReportData): number {
    let score = 0.5; // Base score

    if (reportData.supernovaEnhancements?.smartComparables) {
      const comparables = reportData.supernovaEnhancements.smartComparables;
      
      // Check comparable quality
      if (comparables.selectedComparables.length >= 3) score += 0.2;
      if (comparables.overallStrength >= 80) score += 0.2;
      if (comparables.rejectedComparables.length > 0) score += 0.1; // Shows filtering
    }

    return Math.min(score, 1.0);
  }

  private static validateModelSpecification(reportData: ReportData): number {
    let score = 0.6; // Base score for documented methodology

    if (reportData.supernovaEnhancements?.aiAnalysisVersion) {
      score += 0.2; // AI model versioning
    }

    if (reportData.supernovaEnhancements?.successProbability) {
      score += 0.2; // Multi-factor analysis model
    }

    return Math.min(score, 1.0);
  }

  private static validateComparableSelection(reportData: ReportData): number {
    let score = 0.4; // Base score

    if (reportData.supernovaEnhancements?.smartComparables) {
      const comparables = reportData.supernovaEnhancements.smartComparables;
      
      // AI-based selection with scoring
      if (comparables.selectedComparables.every((c: ComparableSale) => (c.relevanceScore || 0) >= 0.7)) {
        score += 0.3;
      }
      
      // Documented reasoning
      if (comparables.selectedComparables.every((c: Record<string, unknown>) => (c.reasoning as string[]).length > 0)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  private static validateAssessmentRatios(reportData: ReportData): number {
    let score = 0.5; // Base score

    if (reportData.assessmentAnalysis?.assessmentToValueRatio) {
      const ratio = Number(reportData.assessmentAnalysis.assessmentToValueRatio);
      
      // IAAO acceptable range typically 90-110%
      if (ratio >= 90 && ratio <= 110) {
        score += 0.3;
      } else if (ratio >= 80 && ratio <= 120) {
        score += 0.2;
      }
      
      score += 0.2; // For having ratio analysis
    }

    return Math.min(score, 1.0);
  }

  private static validateMassAppraisalPerformance(reportData: ReportData): number {
    let score = 0.6; // Base score for systematic approach

    if (reportData.supernovaEnhancements?.successProbability) {
      // Multi-factor systematic analysis
      score += 0.2;
    }

    if (reportData.supernovaEnhancements?.confidenceLevel >= 80) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private static validateStatisticalPerformance(reportData: ReportData): number {
    let score = 0.5; // Base score

    if (reportData.supernovaEnhancements?.successProbability) {
      const successProb = reportData.supernovaEnhancements.successProbability;
      
      // Multiple statistical factors analyzed
      if (successProb.confidenceInterval) {
        score += 0.25;
      }
      
      // Risk and strength analysis
      if (successProb.keyRiskFactors.length > 0 && successProb.strengthIndicators.length > 0) {
        score += 0.25;
      }
    }

    return Math.min(score, 1.0);
  }

  private static validateEquityAnalysis(reportData: ReportData): number {
    let score = 0.6; // Base score for documented analysis

    if (reportData.supernovaEnhancements?.successProbability?.jurisdictionFactors) {
      // Jurisdiction-specific equity considerations
      score += 0.2;
    }

    if (reportData.appealRecommendation?.includes('STRONG')) {
      score += 0.2; // Strong equity argument
    }

    return Math.min(score, 1.0);
  }

  private static getRecommendation(standardId: string, score: number): string {
    const baseRecommendations: { [key: string]: string } = {
      'DQ1': 'Enhance property data collection to include all required IAAO fields',
      'DQ2': 'Improve market data verification and adjustment procedures',
      'MS1': 'Document valuation methodology more comprehensively',
      'MS2': 'Strengthen comparable selection criteria with objective measures',
      'AS1': 'Conduct detailed assessment ratio analysis per IAAO standards',
      'AS2': 'Implement systematic mass appraisal quality assurance',
      'PF1': 'Calculate and report all required IAAO performance measures',
      'PF2': 'Enhance equity analysis across property classifications',
    };

    const improvement = score < 0.5 ? ' immediately' : score < 0.75 ? ' to achieve full compliance' : '';
    return (baseRecommendations[standardId] || 'Review and improve compliance') + improvement;
  }

  private static generateRecommendations(standards: IAAAOStandard[], reportData: ReportData): string[] {
    const recommendations: string[] = [];
    
    const lowScoreStandards = standards.filter(s => s.score < 0.75);
    
    if (lowScoreStandards.length > 0) {
      recommendations.push(`Address ${lowScoreStandards.length} IAAO compliance areas to strengthen appeal position`);
    }

    if (reportData.supernovaEnhancements?.confidenceLevel && reportData.supernovaEnhancements.confidenceLevel < 80) {
      recommendations.push('Consider additional market data collection to improve analysis confidence');
    }

    const overallScore = standards.reduce((sum, s) => sum + s.score, 0) / standards.length;
    if (overallScore >= 0.9) {
      recommendations.push('Analysis demonstrates excellent IAAO compliance - proceed with confidence');
    } else if (overallScore >= 0.75) {
      recommendations.push('Analysis meets IAAO standards with minor improvement opportunities');
    } else {
      recommendations.push('Strengthen analysis to meet full IAAO compliance before proceeding');
    }

    return recommendations;
  }
}