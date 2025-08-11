import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SuccessProbabilityChart } from "@/components/charts/SuccessProbabilityChart";
import { MarketFactorsChart } from "@/components/charts/MarketFactorsChart";
import { FinancialImpactChart } from "@/components/charts/FinancialImpactChart";
import { IAAAOComplianceSection } from "@/components/IAAAOComplianceSection";
import { PDFExportService } from "@/services/pdfExportService";
import type { ComparableSale, StrategicRecommendations, MarketAnalysis } from "@/types/report";
import { useAccessibility, useKeyboardNavigation } from "@/hooks/useAccessibility";
import type { ReportData } from "@/types/report";

interface ReportPreviewProps {
  showReportPreview: boolean;
  setShowReportPreview: (show: boolean) => void;
  reportData: ReportData | null;
}

// Type guard function to safely access strategic recommendations
const getStrategicRecommendations = (marketAnalysis: MarketAnalysis | Record<string, unknown>): StrategicRecommendations | null => {
  if ('strategicRecommendations' in marketAnalysis && marketAnalysis.strategicRecommendations) {
    return marketAnalysis.strategicRecommendations as StrategicRecommendations;
  }
  return null;
};

export function ReportPreview({
  showReportPreview,
  setShowReportPreview,
  reportData
}: ReportPreviewProps) {
  const { toast } = useToast();
  
  // Accessibility hooks
  const { containerRef, announce } = useAccessibility({
    trapFocus: showReportPreview,
    announceOnMount: showReportPreview ? 'Report preview opened. Use Tab to navigate, Escape to close.' : undefined,
    announceOnUnmount: 'Report preview closed.',
    returnFocusOnCleanup: true
  });

  useKeyboardNavigation(
    () => setShowReportPreview(false), // Escape to close
    undefined, // Enter (handled by individual elements)
    undefined  // Space (handled by individual elements)
  );

  if (!reportData) return null;

  // Extract Supernova 2B data with proper fallbacks
  const supernovaData = reportData.supernovaEnhancements;
  const successProbability = supernovaData?.successProbability?.overallProbability || 
                             reportData.assessmentAnalysis?.successProbability || 0;
  const confidenceLevel = supernovaData?.confidenceLevel || 
                         reportData.assessmentAnalysis?.confidenceLevel || 0;
  
  // Fix percentage formatting (convert decimals to percentages)
  const formatPercentage = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.0';
    if (value <= 1) return (value * 100).toFixed(1);
    return value.toFixed(1);
  };

  return (
    <Dialog open={showReportPreview} onOpenChange={setShowReportPreview}>
      <DialogContent 
        className="max-w-6xl max-h-[85vh] overflow-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-preview-title"
        aria-describedby="report-preview-description"
        ref={containerRef}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-xl font-bold flex items-center gap-2"
            id="report-preview-title"
          >
            🌟 Supernova 2B Property Analysis Report Preview
            {supernovaData && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800"
                aria-label="AI Enhanced Report"
              >
                AI Enhanced
              </Badge>
            )}
          </DialogTitle>
          <p id="report-preview-description" className="sr-only">
            Interactive preview of property tax appeal analysis report with AI-enhanced insights, charts, and export options
          </p>
        </DialogHeader>
        
        <div id="report-content" className="space-y-8 p-8 bg-white">
          {/* Professional Report Header */}
          <div className="text-center border-b-2 border-gray-300 pb-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">PROPERTY TAX APPEAL ANALYSIS</h1>
              <h2 className="text-xl text-gray-700 mt-2">{reportData.reportType}</h2>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Prepared by: {reportData.preparedBy}</p>
              <p>Analysis Date: {reportData.date}</p>
              <p>IAAO/MAI Standards Compliant</p>
            </div>
          </div>

          {/* SUPERNOVA 2B EXECUTIVE SUMMARY */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-100 p-6 rounded-lg shadow-md border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
              <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 mr-3"></span>
              🌟 SUPERNOVA 2B EXECUTIVE SUMMARY
              {supernovaData && (
                <Badge className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600">
                  AI Analysis v{supernovaData.aiAnalysisVersion}
                </Badge>
              )}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">🎯 Appeal Recommendation</h3>
                <div className={`text-2xl font-bold mb-2 ${
                  reportData.appealRecommendation?.includes('STRONG') ? 'text-green-600' :
                  reportData.appealRecommendation?.includes('MARGINAL') ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {reportData.appealRecommendation}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">AI Success Probability:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={successProbability} className="w-16 h-2" />
                      <span className="font-bold text-green-600 text-lg">{formatPercentage(successProbability)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">AI Confidence Level:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={confidenceLevel} className="w-16 h-2" />
                      <span className="font-bold text-blue-600 text-lg">{formatPercentage(confidenceLevel)}%</span>
                    </div>
                  </div>
                  {supernovaData?.successProbability?.confidenceInterval && (
                    <div className="text-xs text-gray-500 mt-1">
                      Range: {supernovaData.successProbability.confidenceInterval[0].toFixed(1)}% - 
                      {supernovaData.successProbability.confidenceInterval[1].toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">💰 Financial Impact</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Current Assessment:</span>
                    <span className="font-semibold">${reportData.assessmentAnalysis?.currentAssessment?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Market Value:</span>
                    <span className="font-semibold">${reportData.assessmentAnalysis?.estimatedMarketValue?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Over-Assessment:</span>
                    <span className="font-semibold text-red-600">${reportData.assessmentAnalysis?.overAssessmentAmount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Assessment Ratio:</span>
                    <span className="font-semibold">{reportData.assessmentAnalysis?.assessmentToValueRatio || 0}%</span>
                  </div>
                </div>
              </div>

              {supernovaData && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg shadow border-l-4 border-purple-500">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">🤖 AI Intelligence</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Analysis Version:</span>
                      <Badge variant="outline" className="text-xs">{supernovaData.aiAnalysisVersion}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Overall Confidence:</span>
                      <span className="font-bold text-purple-600">{supernovaData.confidenceLevel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Level:</span>
                      <Badge variant={
                        supernovaData.supernovaRecommendations?.riskAssessment?.level === 'Low' ? 'default' :
                        supernovaData.supernovaRecommendations?.riskAssessment?.level === 'Medium' ? 'secondary' : 'destructive'
                      } className="text-xs">
                        {supernovaData.supernovaRecommendations?.riskAssessment?.level || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Generated: {new Date(supernovaData.generatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SUPERNOVA 2B: AI SUCCESS PROBABILITY MODEL */}
          {supernovaData?.successProbability && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-100 p-6 rounded-lg shadow-md border-2 border-emerald-200">
              <h2 className="text-2xl font-bold text-emerald-900 mb-4 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-emerald-600 to-teal-600 mr-3"></span>
                🧠 AI SUCCESS PROBABILITY MODEL
                <Badge className="ml-2 bg-emerald-600">Machine Learning</Badge>
              </h2>
              
              {/* Success Probability Charts */}
              <div className="mb-6">
                <SuccessProbabilityChart 
                  successProbability={supernovaData.successProbability.overallProbability}
                  confidenceLevel={supernovaData.confidenceLevel / 100}
                />
              </div>
              
              {/* Market Factors Analysis Chart */}
              <div className="mb-6">
                <MarketFactorsChart 
                  marketFactors={supernovaData.successProbability.marketFactors}
                  propertyFactors={supernovaData.successProbability.propertyFactors}
                  jurisdictionFactors={supernovaData.successProbability.jurisdictionFactors}
                  timingFactors={supernovaData.successProbability.timingFactors}
                />
              </div>
              
              <div className="mt-4 bg-gradient-to-r from-emerald-100 to-teal-100 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-emerald-800">AI Risk & Strength Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-sm font-medium text-red-700">Key Risk Factors:</span>
                        <ul className="text-xs text-red-600 mt-1">
                          {supernovaData.successProbability.keyRiskFactors.map((risk: string, index: number) => (
                            <li key={index}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-700">Strength Indicators:</span>
                        <ul className="text-xs text-green-600 mt-1">
                          {supernovaData.successProbability.strengthIndicators.map((strength: string, index: number) => (
                            <li key={index}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-700">
                      {formatPercentage(supernovaData.successProbability?.overallProbability)}%
                    </div>
                    <div className="text-sm text-emerald-600">Overall Probability</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPERNOVA 2B: SMART COMPARABLE ANALYSIS */}
          {supernovaData?.smartComparables && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-100 p-6 rounded-lg shadow-md border-2 border-indigo-200">
              <h2 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-blue-600 mr-3"></span>
                📊 SMART COMPARABLE ANALYSIS
                <Badge className="ml-2 bg-indigo-600">AI Selected</Badge>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-semibold text-indigo-800 mb-3">AI-Selected Comparables</h4>
                  <div className="space-y-3">
                    {supernovaData.smartComparables.selectedComparables.slice(0, 3).map((comp: ComparableSale, index: number) => {
                      const address = comp.address || 'Unknown Address';
                      const relevanceScore = comp.relevanceScore || 0;
                      const weight = comp.weight || 0;
                      const strengthRating = comp.strengthRating || 'Unknown';
                      
                      return (
                        <div key={index} className="border-l-4 border-indigo-300 pl-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">{address}</div>
                              <div className="text-xs text-gray-600">
                                Relevance: {relevanceScore.toFixed(1)} | 
                                Weight: {weight.toFixed(2)}
                              </div>
                            </div>
                            <Badge variant={
                              strengthRating === 'Excellent' ? 'default' :
                              strengthRating === 'Good' ? 'secondary' :
                              strengthRating === 'Fair' ? 'outline' : 'destructive'
                            } className="text-xs">
                              {strengthRating}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Array.isArray(comp.reasoning) ? comp.reasoning.slice(0, 2).join(', ') : (comp.reasoning || 'Selected by AI analysis')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-semibold text-indigo-800 mb-3">Analysis Quality</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overall Strength:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={supernovaData.smartComparables.overallStrength} className="w-20 h-2" />
                        <span className="font-bold text-indigo-600">{supernovaData.smartComparables.overallStrength.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">AI Narrative:</span>
                      <p className="text-gray-600 text-xs mt-1">{supernovaData.smartComparables.recommendedNarrative}</p>
                    </div>
                    {supernovaData.smartComparables.rejectedComparables.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium text-red-700">Rejected Comparables:</span>
                        <div className="text-red-600 mt-1">
                          {supernovaData.smartComparables.rejectedComparables.length} comparables excluded due to 
                          insufficient relevance or reliability issues
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCIAL IMPACT ANALYSIS */}
          <div className="bg-green-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
              <span className="w-1 h-8 bg-green-600 mr-3"></span>
              FINANCIAL IMPACT ANALYSIS
            </h2>
            
            {/* Financial Impact Charts */}
            {reportData.financialImpact && (
              <div className="mb-6">
                <FinancialImpactChart financialImpact={reportData.financialImpact} />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded">
                <h4 className="font-semibold text-gray-700 mb-3">Tax Burden Comparison</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Annual Taxes:</span>
                    <span className="font-semibold">${reportData.financialImpact?.currentAnnualTaxes?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projected Annual Taxes:</span>
                    <span className="font-semibold text-green-600">${reportData.financialImpact?.projectedAnnualTaxes?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Annual Savings:</span>
                    <span className="font-bold text-green-600">${reportData.financialImpact?.annualTaxSavings?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded">
                <h4 className="font-semibold text-gray-700 mb-3">5-Year ROI Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>5-Year Savings:</span>
                    <span className="font-semibold">${reportData.financialImpact?.fiveYearSavings?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Appeal Cost:</span>
                    <span className="font-semibold">${reportData.financialImpact?.appealCost?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Net Benefit:</span>
                    <span className="font-bold text-green-600">${reportData.financialImpact?.netBenefit?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROI:</span>
                    <span className="font-bold text-blue-600">{reportData.financialImpact?.roi?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded">
                <h4 className="font-semibold text-gray-700 mb-3">Investment Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Payback Period:</span>
                    <span className="font-semibold">{reportData.financialImpact?.paybackPeriod || 'N/A'} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-800">Investment Grade:</span>
                    <span className={`text-lg font-bold ${
                      (reportData.financialImpact?.roi || 0) > 300 ? 'text-green-600' :
                      (reportData.financialImpact?.roi || 0) > 100 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(reportData.financialImpact?.roi || 0) > 300 ? 'EXCELLENT' :
                       (reportData.financialImpact?.roi || 0) > 100 ? 'GOOD' : 'POOR'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SUPERNOVA 2B: ENHANCED STRATEGIC RECOMMENDATIONS */}
          {(supernovaData?.supernovaRecommendations || reportData.marketAnalysis?.strategicRecommendations) && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-100 p-6 rounded-lg shadow-md border-2 border-violet-200">
              <h2 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-violet-600 to-purple-600 mr-3"></span>
                🎯 SUPERNOVA 2B STRATEGIC RECOMMENDATIONS
                {supernovaData && (
                  <Badge className="ml-2 bg-gradient-to-r from-violet-600 to-purple-600">
                    AI Enhanced
                  </Badge>
                )}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-purple-800 mb-3">🎯 AI Strategy</h4>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    <Badge className="mb-2" variant={
                      supernovaData?.supernovaRecommendations?.primaryStrategy?.approach === 'aggressive' ? 'destructive' :
                      supernovaData?.supernovaRecommendations?.primaryStrategy?.approach === 'moderate' ? 'secondary' : 'default'
                    }>
                      {supernovaData?.supernovaRecommendations?.primaryStrategy?.approach?.toUpperCase() || 'MODERATE'}
                    </Badge>
                    <p className="text-sm">
                      {supernovaData?.supernovaRecommendations?.narrativeThemes?.[0] || 
                       getStrategicRecommendations(reportData.marketAnalysis)?.primaryStrategy || 
                       'Market-based appeal strategy'}
                    </p>
                  </div>
                  
                  <h4 className="font-semibold text-purple-800 mb-3 mt-4">🎲 Risk Assessment</h4>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    {supernovaData?.supernovaRecommendations?.riskAssessment && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Risk Level:</span>
                          <Badge variant={
                            supernovaData.supernovaRecommendations.riskAssessment.level === 'Low' ? 'default' :
                            supernovaData.supernovaRecommendations.riskAssessment.level === 'Medium' ? 'secondary' : 'destructive'
                          }>
                            {supernovaData.supernovaRecommendations.riskAssessment.level}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Key Factors:</span>
                          <ul className="mt-1">
                            {supernovaData.supernovaRecommendations.riskAssessment.factors.slice(0, 2).map((factor: string, index: number) => (
                              <li key={index}>• {factor}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-purple-800 mb-3">📈 Success Prediction</h4>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    {supernovaData?.supernovaRecommendations?.successPrediction && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Success Probability:</span>
                          <span className="font-bold text-green-600">
                            {formatPercentage(supernovaData.supernovaRecommendations.successPrediction?.overallProbability)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Confidence Level:</span>
                          <span className="font-bold text-blue-600 text-xs">
                            {formatPercentage(supernovaData.supernovaRecommendations.successPrediction?.confidenceLevel)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Key Strengths:</span>
                          <div>{supernovaData.supernovaRecommendations.successPrediction.keyStrengths?.[0] || 'Strong case'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-purple-800 mb-3 mt-4">⏰ Optimal Timing</h4>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    <p className="text-sm font-medium text-orange-700">
                      {supernovaData?.optimalTiming?.timeline || 
                       getStrategicRecommendations(reportData.marketAnalysis)?.timeline ||
                       'File within 30 days for optimal positioning'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-purple-800 mb-3">🔄 Evidence Hierarchy</h4>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    <ul className="text-sm space-y-1">
                      {(supernovaData?.evidenceHierarchy?.alternativeStrategies || 
                        getStrategicRecommendations(reportData.marketAnalysis)?.alternativeStrategies || 
                        ['Comparable sales analysis', 'Market trend analysis', 'Assessment history review']
                      ).map((strategy: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-purple-600 mr-2 font-bold">{index + 1}.</span>
                          {strategy}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <h4 className="font-semibold text-purple-800 mb-3 mt-4">🛡️ AI Risk Mitigation</h4>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    <ul className="text-sm space-y-1">
                      {(supernovaData?.supernovaRecommendations?.riskAssessment?.mitigationStrategies || 
                        getStrategicRecommendations(reportData.marketAnalysis)?.alternativeStrategies ||
                        ['File before deadline with comprehensive documentation', 'Prepare for potential counter-evidence']
                      ).map((risk: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-600 mr-2">⚠</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-gradient-to-r from-violet-100 to-purple-100 p-4 rounded border border-violet-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="font-semibold text-purple-800">🎯 Market Position:</span>
                        <div className="text-2xl font-bold text-purple-700">
                          {reportData.marketPositionScore || 0}/100
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-800">⏰ Appeal Timing:</span>
                        <div className="text-2xl font-bold text-blue-700">
                          {reportData.appealTimingScore || 0}/100
                        </div>
                      </div>
                      {supernovaData && (
                        <div>
                          <span className="font-semibold text-emerald-800">🤖 AI Confidence:</span>
                          <div className="text-2xl font-bold text-emerald-700">
                            {supernovaData.confidenceLevel}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IAAO COMPLIANCE VALIDATION */}
          <IAAAOComplianceSection reportData={reportData} />

          {/* PROFESSIONAL DISCLAIMER */}
          <div className="border-t-2 pt-6 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Important Disclaimers:</h3>
            <ul className="space-y-1 text-xs">
              <li>• This analysis is based on available data and market conditions as of {reportData.date}</li>
              <li>• All valuations are estimates subject to professional appraisal verification</li>
              <li>• Success probabilities are statistical estimates based on historical appeal outcomes</li>
              <li>• Actual results may vary based on jurisdiction-specific factors and appeal board decisions</li>
              <li>• This report complies with IAAO mass appraisal standards and MAI valuation principles</li>
              <li>• Legal and professional fees may vary by jurisdiction and complexity</li>
            </ul>
          </div>

          {/* Supernova 2B Report Footer */}
          <div className="text-center pt-6 border-t-2 border-gradient-to-r from-blue-300 to-purple-300 text-sm">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🌟</span>
                <p className="font-bold text-gray-800">SUPERNOVA 2B AI-Enhanced Analysis</p>
                <span className="text-2xl">🌟</span>
              </div>
              <p className="text-gray-600">© {new Date().getFullYear()} CHARLY AI Property Tax Appeal Analysis System</p>
              <p className="text-gray-600">Confidential and Proprietary - For Client Use Only</p>
              {supernovaData && (
                <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Analysis Version: {supernovaData.aiAnalysisVersion}</span>
                  <span>•</span>
                  <span>Generated: {new Date(supernovaData.generatedAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>AI Confidence: {supernovaData.confidenceLevel}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div 
          className="flex justify-between items-center pt-4 border-t"
          role="toolbar"
          aria-label="Report actions"
        >
          <Button 
            variant="outline" 
            onClick={() => setShowReportPreview(false)}
            aria-label="Close report preview and return to portfolio"
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close Preview
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                setShowReportPreview(false);
                announce('Analysis preview closed, ready for editing');
                toast({
                  title: "Analysis Preview Closed",
                  description: "Modify valuation data or property details and regenerate analysis",
                });
              }}
              aria-label="Close preview and edit analysis parameters"
              className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Analysis
            </Button>
            <div 
              className="flex gap-2"
              role="group"
              aria-label="Export options"
            >
              <Button
                onClick={async () => {
                  try {
                    announce('Generating Enterprise PDF report');
                    await PDFExportService.generateEnterprisePDF(reportData);
                    announce('Enterprise PDF generated successfully');
                    toast({
                      title: "🌟 Enterprise PDF Generated",
                      description: supernovaData ? 
                        `AI-Enhanced IAAO/MAI compliant analysis with charts and ${supernovaData.confidenceLevel}% confidence` :
                        "Professional property tax appeal analysis with interactive charts",
                    });
                  } catch (error) {
                    console.error('PDF generation failed:', error);
                    announce('PDF generation failed');
                    toast({
                      title: "PDF Generation Error",
                      description: "Failed to generate PDF. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Export report as Enterprise PDF with charts and AI analysis"
                aria-describedby="pdf-export-description"
              >
                <span aria-hidden="true">📄</span> Enterprise PDF
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    announce('Generating Excel export');
                    await PDFExportService.generateExcelExport(reportData);
                    announce('Excel export generated successfully');
                    toast({
                      title: "📊 Excel Export Generated",
                      description: "Comprehensive analysis data exported to Excel format",
                    });
                  } catch (error) {
                    console.error('Excel export failed:', error);
                    announce('Excel export failed');
                    toast({
                      title: "Export Error",
                      description: "Failed to generate Excel export. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Export report data as Excel spreadsheet"
                aria-describedby="excel-export-description"
              >
                <span aria-hidden="true">📊</span> Excel
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    announce('Generating Word document');
                    await PDFExportService.generateWordDocument(reportData);
                    announce('Word document generated successfully');
                    toast({
                      title: "📝 Word Document Generated",
                      description: "Professional report exported to Word format",
                    });
                  } catch (error) {
                    console.error('Word document generation failed:', error);
                    announce('Word document generation failed');
                    toast({
                      title: "Export Error",
                      description: "Failed to generate Word document. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Export report as Word document"
                aria-describedby="word-export-description"
              >
                <span aria-hidden="true">📝</span> Word
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReportPreview;