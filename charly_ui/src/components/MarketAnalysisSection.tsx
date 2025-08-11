
interface MarketAnalysisData {
  jurisdiction?: string;
  propertyType?: string;
  marketTrend?: string;
  averagePricePerSqFt?: number;
  subjectPricePerSqFt?: number;
  priceVariance?: number;
  marketPosition?: 'Above' | 'At' | 'Below';
  comparableSales?: Array<{
    address: string;
    salePrice: number;
    pricePerSqFt: number;
    distanceFromSubject: number;
    adjustedSalePrice: number;
    dataSource: string;
  }>;
  assessmentHistory?: Array<{
    taxYear: number;
    totalAssessment: number;
    changeFromPreviousYear: number;
  }>;
  jurisdictionIntelligence?: {
    appealSuccessRate: number;
    averageReduction: number;
    appealFee: number;
  };
}

interface MarketAnalysisSectionProps {
  marketAnalysis: MarketAnalysisData;
}

export function MarketAnalysisSection({ marketAnalysis }: MarketAnalysisSectionProps) {
  return (
    <div className="bg-amber-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center">
        <span className="w-1 h-8 bg-amber-600 mr-3"></span>
        MARKET ANALYSIS
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded">
          <h4 className="font-semibold text-gray-700 mb-3">Market Conditions</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Market Trend:</span>
              <span className="font-semibold">{marketAnalysis.marketTrend}</span>
            </div>
            <div className="flex justify-between">
              <span>Property Type:</span>
              <span className="font-semibold">{marketAnalysis.propertyType}</span>
            </div>
            <div className="flex justify-between">
              <span>Jurisdiction:</span>
              <span className="font-semibold">{marketAnalysis.jurisdiction}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded">
          <h4 className="font-semibold text-gray-700 mb-3">Pricing Analysis</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Market Average $/SF:</span>
              <span className="font-semibold">${marketAnalysis.averagePricePerSqFt}</span>
            </div>
            <div className="flex justify-between">
              <span>Subject $/SF:</span>
              <span className="font-semibold">${marketAnalysis.subjectPricePerSqFt?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Variance:</span>
              <span className={`font-semibold ${
                (marketAnalysis.priceVariance || 0) > 5 
                  ? 'text-red-600' : (marketAnalysis.priceVariance || 0) < -5
                  ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {marketAnalysis.priceVariance?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Market Position:</span>
              <span className={`font-semibold ${
                marketAnalysis.marketPosition === 'Above' ? 'text-red-600' :
                marketAnalysis.marketPosition === 'Below' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {marketAnalysis.marketPosition}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Phase 1 Data - Comparable Sales */}
      {marketAnalysis.comparableSales && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700 mb-3">Comparable Sales Analysis</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Address</th>
                  <th className="border border-gray-300 p-2 text-right">Sale Price</th>
                  <th className="border border-gray-300 p-2 text-right">Price/SF</th>
                  <th className="border border-gray-300 p-2 text-right">Distance</th>
                  <th className="border border-gray-300 p-2 text-right">Adjusted Price</th>
                  <th className="border border-gray-300 p-2 text-center">Source</th>
                </tr>
              </thead>
              <tbody>
                {marketAnalysis.comparableSales.map((comp, index) => (
                  <tr key={index} className="even:bg-gray-50">
                    <td className="border border-gray-300 p-2">{comp.address}</td>
                    <td className="border border-gray-300 p-2 text-right">${comp.salePrice.toLocaleString()}</td>
                    <td className="border border-gray-300 p-2 text-right">${comp.pricePerSqFt.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right">{comp.distanceFromSubject.toFixed(1)} mi</td>
                    <td className="border border-gray-300 p-2 text-right">${comp.adjustedSalePrice.toLocaleString()}</td>
                    <td className="border border-gray-300 p-2 text-center">{comp.dataSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Assessment History Trend */}
      {marketAnalysis.assessmentHistory && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700 mb-3">5-Year Assessment History</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            {marketAnalysis.assessmentHistory.map((year, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="font-semibold text-center">{year.taxYear}</div>
                <div className="text-center text-xs space-y-1 mt-2">
                  <div>${(year.totalAssessment / 1000).toFixed(0)}K</div>
                  <div className={`${
                    year.changeFromPreviousYear > 5 ? 'text-red-600' :
                    year.changeFromPreviousYear < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {year.changeFromPreviousYear > 0 ? '+' : ''}{year.changeFromPreviousYear.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Jurisdiction Intelligence */}
      {marketAnalysis.jurisdictionIntelligence && (
        <div className="mt-6 bg-blue-50 p-4 rounded">
          <h4 className="font-semibold text-blue-900 mb-3">Jurisdiction Intelligence</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Appeal Success Rate:</span>
              <div className="text-lg font-bold text-blue-600">
                {marketAnalysis.jurisdictionIntelligence.appealSuccessRate}%
              </div>
            </div>
            <div>
              <span className="font-medium">Average Reduction:</span>
              <div className="text-lg font-bold text-green-600">
                {marketAnalysis.jurisdictionIntelligence.averageReduction}%
              </div>
            </div>
            <div>
              <span className="font-medium">Appeal Fee:</span>
              <div className="text-lg font-bold text-gray-600">
                ${marketAnalysis.jurisdictionIntelligence.appealFee}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketAnalysisSection;