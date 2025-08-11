/**
 * 🍎 CHARLY 2.0 - PROPERTY ANALYSIS REVOLUTION
 * 
 * Task 8: Progressive disclosure analysis that makes attorneys look brilliant
 * through sophisticated insight revelation and inevitable intelligence patterns.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { usePropertyAnalysisStore } from "@/store/propertyAnalysis";
import { 
  IntelligentCanvas, 
  Card, 
  MetricCard, 
  // FeatureCard,
  Button, 
  // Accordion,
  ExpandableCard,
  // StepDisclosure
} from "@/components/v2";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  // TrendingDown, 
  BarChart3, 
  // Calculator, 
  MapPin, 
  // Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  // Clock,
  Target,
  Brain,
  Zap
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PropertyAnalysisData {
  propertyId: string;
  address: string;
  currentAssessment: number;
  marketValue: number;
  potentialSavings: number;
  confidence: number;
  lastAnalyzed: Date;
  
  // Progressive insight layers
  basicData: {
    propertyType: string;
    yearBuilt: number;
    squareFootage: number;
    lotSize: number;
    bedrooms?: number;
    bathrooms?: number;
  };
  
  financials: {
    assessmentHistory: AssessmentHistoryItem[];
    taxHistory: TaxHistoryItem[];
    marketTrends: MarketTrendData;
  };
  
  marketData: {
    comparableSales: ComparableProperty[];
    neighborhoodAnalysis: NeighborhoodData;
    marketConditions: MarketConditions;
  };
  
  insights: {
    overAssessmentIndicators: string[];
    appealRecommendations: AppealRecommendation[];
    strategicAdvice: string[];
    riskFactors: string[];
    successProbability: number;
  };
}

interface AssessmentHistoryItem {
  year: number;
  assessment: number;
  change: number;
  percentChange: number;
}

interface TaxHistoryItem {
  year: number;
  taxes: number;
  rate: number;
  change: number;
}

interface ComparableProperty {
  id: string;
  address: string;
  salePrice: number;
  saleDate: Date;
  squareFootage: number;
  pricePerSqFt: number;
  distance: number;
  adjustments: number;
  confidence: number;
}

interface AppealRecommendation {
  type: 'assessment_reduction' | 'exemption' | 'classification';
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  successRate: number;
  timeframe: string;
}

// ============================================================================
// PROPERTY ANALYSIS V2 COMPONENT
// ============================================================================

export function PropertyAnalysisV2() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [, ] = useState<'basic' | 'detailed' | 'expert'>('basic'); // Insight level for future use
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock data for demonstration
  const mockAnalysisData: PropertyAnalysisData = {
    propertyId: propertyId || 'prop_1',
    address: '123 Main Street, Chicago, IL 60601',
    currentAssessment: 850000,
    marketValue: 750000,
    potentialSavings: 100000,
    confidence: 92,
    lastAnalyzed: new Date(),
    
    basicData: {
      propertyType: 'Commercial Office',
      yearBuilt: 1995,
      squareFootage: 12500,
      lotSize: 0.75,
    },
    
    financials: {
      assessmentHistory: [
        { year: 2024, assessment: 850000, change: 85000, percentChange: 11.1 },
        { year: 2023, assessment: 765000, change: 45000, percentChange: 6.3 },
        { year: 2022, assessment: 720000, change: 25000, percentChange: 3.6 },
        { year: 2021, assessment: 695000, change: -15000, percentChange: -2.1 },
      ],
      taxHistory: [
        { year: 2024, taxes: 21250, rate: 2.5, change: 2125 },
        { year: 2023, taxes: 19125, rate: 2.5, change: 1125 },
        { year: 2022, taxes: 18000, rate: 2.5, change: 625 },
        { year: 2021, taxes: 17375, rate: 2.5, change: -375 },
      ],
      marketTrends: {
        priceAppreciation: 4.2,
        volatility: 12.8,
        marketCondition: 'stable'
      }
    },
    
    marketData: {
      comparableSales: [
        {
          id: 'comp_1',
          address: '456 Oak Ave',
          salePrice: 725000,
          saleDate: new Date('2024-03-15'),
          squareFootage: 11800,
          pricePerSqFt: 61.44,
          distance: 0.3,
          adjustments: -15000,
          confidence: 87
        },
        {
          id: 'comp_2', 
          address: '789 Pine St',
          salePrice: 780000,
          saleDate: new Date('2024-01-22'),
          squareFootage: 13200,
          pricePerSqFt: 59.09,
          distance: 0.5,
          adjustments: +25000,
          confidence: 91
        },
        {
          id: 'comp_3',
          address: '321 Elm Blvd',
          salePrice: 695000,
          saleDate: new Date('2023-11-08'),
          squareFootage: 12000,
          pricePerSqFt: 57.92,
          distance: 0.7,
          adjustments: -10000,
          confidence: 84
        }
      ],
      neighborhoodAnalysis: {
        medianPrice: 735000,
        priceRange: { min: 650000, max: 850000 },
        appreciation: 3.8,
        stability: 'high'
      },
      marketConditions: {
        inventory: 'low',
        demandLevel: 'moderate',
        priceDirection: 'stable'
      }
    },
    
    insights: {
      overAssessmentIndicators: [
        'Assessment increased 11.1% while market appreciation was 4.2%',
        'Current assessment exceeds comparable sales by 13.3%',
        'Property assessment growth outpaced neighborhood median by 7.3%'
      ],
      appealRecommendations: [
        {
          type: 'assessment_reduction',
          title: 'Market Value Appeal',
          description: 'Challenge assessment based on comparable sales analysis',
          potentialSavings: 85000,
          effort: 'medium',
          successRate: 78,
          timeframe: '4-6 months'
        },
        {
          type: 'exemption',
          title: 'Small Business Exemption',
          description: 'Evaluate eligibility for commercial property tax exemptions',
          potentialSavings: 25000,
          effort: 'low', 
          successRate: 45,
          timeframe: '2-3 months'
        }
      ],
      strategicAdvice: [
        'File appeal before March deadline for maximum savings',
        'Gather additional comparable sales from Q4 2023',
        'Consider professional appraisal to strengthen case',
        'Document any property condition issues affecting value'
      ],
      riskFactors: [
        'Recent comparable sales show mixed pricing trends',
        'Assessment office may challenge older comparables',
        'Property improvements since last assessment could justify increase'
      ],
      successProbability: 78
    }
  };

  // ============================================================================
  // PROGRESSIVE ANALYSIS SIMULATION
  // ============================================================================

  const runProgressiveAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progressive analysis stages
    const stages = [
      { name: 'Loading property data...', progress: 20 },
      { name: 'Analyzing assessment history...', progress: 40 },
      { name: 'Gathering market comparables...', progress: 60 },
      { name: 'Calculating market insights...', progress: 80 },
      { name: 'Generating recommendations...', progress: 100 }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(stage.progress);
    }

    setIsAnalyzing(false);
    toast({
      title: "Analysis Complete",
      description: "Professional property analysis ready for review.",
    });
  }, [toast, setAnalysisProgress, setIsAnalyzing]);

  useEffect(() => {
    if (!isAnalyzing) {
      runProgressiveAnalysis();
    }
  }, [isAnalyzing, runProgressiveAnalysis]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderAnalysisHeader = () => (
    <div className="flex items-center justify-between mb-6" data-section="header">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Property Analysis</h1>
        <p className="text-gray-600 mt-2">
          {mockAnalysisData.address}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Badge variant="outline" className="flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span>{mockAnalysisData.confidence}% Confidence</span>
        </Badge>
        <Button onClick={() => navigate('/portfolio-v2')} variant="outline">
          ← Back to Portfolio
        </Button>
      </div>
    </div>
  );

  const renderBasicData = () => (
    <div data-section="basic-data">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-blue-600" />
        Property Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Current Assessment"
          value={`$${mockAnalysisData.currentAssessment.toLocaleString()}`}
          change="↑ 11.1% from last year"
          icon={<DollarSign className="h-6 w-6" />}
          variant="primary"
        />
        <MetricCard
          title="Market Value"
          value={`$${mockAnalysisData.marketValue.toLocaleString()}`}
          change="Based on comparable sales"
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        <MetricCard
          title="Potential Savings"
          value={`$${mockAnalysisData.potentialSavings.toLocaleString()}`}
          change="13.3% over-assessment"
          icon={<Target className="h-6 w-6" />}
          variant="warning"
        />
        <MetricCard
          title="Success Probability"
          value={`${mockAnalysisData.insights.successProbability}%`}
          change="Based on similar appeals"
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Property Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Property Type</p>
            <p className="font-medium">{mockAnalysisData.basicData.propertyType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Year Built</p>
            <p className="font-medium">{mockAnalysisData.basicData.yearBuilt}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Square Footage</p>
            <p className="font-medium">{mockAnalysisData.basicData.squareFootage.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Lot Size</p>
            <p className="font-medium">{mockAnalysisData.basicData.lotSize} acres</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderFinancials = () => (
    <div data-section="financials">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
        Financial Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Assessment History</h3>
          <div className="space-y-3">
            {mockAnalysisData.financials.assessmentHistory.map((item) => (
              <div key={item.year} className="flex items-center justify-between">
                <span className="text-gray-600">{item.year}</span>
                <div className="text-right">
                  <span className="font-medium">${item.assessment.toLocaleString()}</span>
                  <span className={cn(
                    "ml-2 text-sm",
                    item.percentChange > 0 ? "text-red-600" : "text-green-600"
                  )}>
                    {item.percentChange > 0 ? "↑" : "↓"} {Math.abs(item.percentChange)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tax Impact</h3>
          <div className="space-y-3">
            {mockAnalysisData.financials.taxHistory.map((item) => (
              <div key={item.year} className="flex items-center justify-between">
                <span className="text-gray-600">{item.year}</span>
                <div className="text-right">
                  <span className="font-medium">${item.taxes.toLocaleString()}</span>
                  <span className="ml-2 text-sm text-gray-500">({item.rate}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderMarketData = () => (
    <div data-section="market-data">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2 text-purple-600" />
        Market Intelligence
      </h2>

      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Comparable Sales Analysis</h3>
        <div className="space-y-4">
          {mockAnalysisData.marketData.comparableSales.map((comp) => (
            <ExpandableCard
              key={comp.id}
              title={comp.address}
              subtitle={`$${comp.salePrice.toLocaleString()} • ${comp.distance} miles`}
              icon={<MapPin className="w-4 h-4" />}
              preview={
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Price per sq ft:</span>
                    <span className="ml-2 font-medium">${comp.pricePerSqFt}</span>
                  </div>
                  <Badge variant="outline">{comp.confidence}% match</Badge>
                </div>
              }
              fullContent={
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Sale Date</p>
                    <p className="font-medium">{comp.saleDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Square Footage</p>
                    <p className="font-medium">{comp.squareFootage.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Adjustments</p>
                    <p className={cn(
                      "font-medium",
                      comp.adjustments > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {comp.adjustments > 0 ? "+" : ""}${comp.adjustments.toLocaleString()}
                    </p>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      </Card>
    </div>
  );

  const renderInsights = () => (
    <div data-section="insights">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Zap className="w-5 h-5 mr-2 text-yellow-600" />
        Professional Insights
      </h2>

      <div className="space-y-6">
        {/* Over-assessment Indicators */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Over-Assessment Indicators
          </h3>
          <div className="space-y-3">
            {mockAnalysisData.insights.overAssessmentIndicators.map((indicator, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{indicator}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Appeal Recommendations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Appeal Recommendations
          </h3>
          <div className="space-y-4">
            {mockAnalysisData.insights.appealRecommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{rec.successRate}% success rate</Badge>
                    <Badge variant={rec.effort === 'low' ? 'secondary' : rec.effort === 'medium' ? 'default' : 'destructive'}>
                      {rec.effort} effort
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-semibold">
                    Potential savings: ${rec.potentialSavings.toLocaleString()}
                  </span>
                  <span className="text-gray-500 text-sm">{rec.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Strategic Advice */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            Strategic Recommendations
          </h3>
          <div className="space-y-3">
            {mockAnalysisData.insights.strategicAdvice.map((advice, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{advice}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isAnalyzing) {
    return (
      <IntelligentCanvas mode="analysis" className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 max-w-md w-full text-center">
            <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-4">Analyzing Property</h2>
            <Progress value={analysisProgress} className="mb-4" />
            <p className="text-gray-600">
              {analysisProgress < 20 ? 'Loading property data...' :
               analysisProgress < 40 ? 'Analyzing assessment history...' :
               analysisProgress < 60 ? 'Gathering market comparables...' :
               analysisProgress < 80 ? 'Calculating market insights...' :
               'Generating recommendations...'}
            </p>
          </Card>
        </div>
      </IntelligentCanvas>
    );
  }

  return (
    <IntelligentCanvas mode="analysis" className="min-h-screen">
      {renderAnalysisHeader()}
      {renderBasicData()}
      {renderFinancials()}
      {renderMarketData()}
      {renderInsights()}
      
      {/* Action Panel */}
      <Card className="p-6 mt-8" data-section="insights">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ready to File Appeal?</h3>
            <p className="text-gray-600">Professional analysis complete. High probability of success.</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={() => navigate(`/appeals-v2/${propertyId}`)}>
              <Target className="w-4 h-4 mr-2" />
              File Appeal
            </Button>
          </div>
        </div>
      </Card>
    </IntelligentCanvas>
  );
}