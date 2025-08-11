import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  Target,
  Award,
  BarChart3,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Flag,
  FileText,
  Zap
} from 'lucide-react';

interface AIInsight {
  type: string;
  message: string;
  confidence: number;
  action: string;
}

interface AIInsights {
  insights?: AIInsight[];
  recommendations?: string[];
}

interface AnalysisResults {
  jurisdiction: string;
  analysis_type: string;
  findings: string[];
  success_probability: number;
  estimated_savings: string;
  recommendation: string;
  detailed_metrics: {
    market_variance: string;
    comparable_properties: number;
    appeal_history: string;
    risk_factors: string[];
    timeline: string;
  };
}

interface AIBriefingDashboardProps {
  aiInsights: AIInsights | null;
}

export function AIBriefingDashboard({ aiInsights }: AIBriefingDashboardProps) {
  const { toast } = useToast();
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  const handleActionClick = async (action: string, description: string) => {
    setIsAnalyzing(true);
    setShowDetailedResults(false);
    
    // Show initial processing toast
    toast({
      title: "AI Analysis Initiated",
      description: `${description} - Processing action: ${action}`,
    });

    try {
      if (action === 'market_analysis') {
        // Extract jurisdiction from description (e.g., "Analyze Dallas County Commercial Overassessment")
        const jurisdictionMatch = description.match(/Analyze\s+([^"]+?)\s+(?:Commercial|Residential)/i);
        const jurisdiction = jurisdictionMatch ? jurisdictionMatch[1].trim() : 'Dallas County';
        
        // Simulate AI analysis with realistic delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate comprehensive analysis results
        const detailedResults: AnalysisResults = {
          jurisdiction: jurisdiction,
          analysis_type: 'Commercial Overassessment Analysis',
          findings: [
            'Assessment ratio variance of 15% above market average detected',
            'Comparable sales analysis supports 12% reduction in current valuation',
            '3 similar properties filed successful appeals in last 12 months',
            'Market conditions favor commercial property appeal strategy',
            'Property characteristics align with successful appeal patterns'
          ],
          success_probability: 0.78,
          estimated_savings: '$32,400',
          recommendation: 'PROCEED - High success probability with strong market evidence',
          detailed_metrics: {
            market_variance: '15% above fair market value',
            comparable_properties: 8,
            appeal_history: '87% success rate in similar cases',
            risk_factors: ['Limited recent sales data', 'Seasonal market fluctuation'],
            timeline: '45-60 days to resolution'
          }
        };
        
        // Set the detailed results to display
        setAnalysisResults(detailedResults);
        setShowDetailedResults(true);
        
        // Show completion toast with results
        toast({
          title: "✅ AI Analysis Complete",
          description: `${jurisdiction} analysis completed. ${detailedResults.success_probability * 100}% success probability. Est. savings: ${detailedResults.estimated_savings}`,
        });
        
      } else {
        // For other actions, show generic completion
        setTimeout(() => {
          toast({
            title: "✅ Analysis Complete",
            description: `${description} analysis completed successfully.`,
          });
        }, 2000);
      }
      
    } catch (error) {
      console.error('AI Action failed:', error);
      toast({
        title: "❌ Analysis Failed",
        description: "Unable to complete AI analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInsightDrilldown = (insight: AIInsight) => {
    toast({
      title: "Deep Analysis",
      description: `Analyzing ${insight.type} with ${Math.round(insight.confidence * 100)}% confidence`,
    });
  };

  if (!aiInsights) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Generate opportunity metrics based on insights
  const opportunityMetrics = [
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Revenue Potential",
      value: "$2.5M",
      subtitle: "Identified this quarter",
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+23%"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "High-Probability Cases",
      value: "24",
      subtitle: "85%+ success rate",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+15%"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Urgent Deadlines",
      value: "8",
      subtitle: "Next 30 days",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "Critical"
    }
  ];

  // Advanced market intelligence
  const marketIntelligence = [
    {
      jurisdiction: "Dallas County",
      opportunity: "Commercial Overassessment",
      confidence: 92,
      value: "$1.8M",
      timeline: "45 days",
      priority: "High",
      properties: 12
    },
    {
      jurisdiction: "Harris County", 
      opportunity: "Industrial Reclassification",
      confidence: 87,
      value: "$450K",
      timeline: "60 days", 
      priority: "Medium",
      properties: 6
    },
    {
      jurisdiction: "Travis County",
      opportunity: "Residential Equity Appeals", 
      confidence: 78,
      value: "$320K",
      timeline: "30 days",
      priority: "High",
      properties: 18
    }
  ];

  return (
    <div className="space-y-6">
      {/* AI Intelligence Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {opportunityMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <div className={metric.color}>{metric.icon}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 flex items-center">
                    {metric.trend.startsWith('+') ? (
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-orange-500 mr-1" />
                    )}
                    {metric.trend}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm font-medium text-gray-700">{metric.title}</div>
                <div className="text-xs text-gray-500">{metric.subtitle}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights with Enhanced Functionality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>🧠 AI Intelligence Briefing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Insights */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                Priority Insights
              </h4>
              {aiInsights.insights?.slice(0, 3).map((insight: AIInsight, index: number) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleInsightDrilldown(insight)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {insight.type === 'opportunity' && <DollarSign className="w-4 h-4 text-green-500" />}
                      {insight.type === 'market_analysis' && <BarChart3 className="w-4 h-4 text-blue-500" />}
                      {insight.type === 'deadline_alert' && <Calendar className="w-4 h-4 text-red-500" />}
                      <Badge variant="outline" className="text-xs">
                        {insight.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{insight.message}</p>
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(insight.action, insight.message);
                      }}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Execute Action
                    </Button>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Flag className="w-4 h-4 mr-2 text-red-500" />
                Recommended Actions
              </h4>
              {aiInsights.recommendations?.map((rec: string, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Action #{index + 1}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rec}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => handleActionClick(`action_${index}`, rec)}
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    Execute Recommendation
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Intelligence Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>📍 Market Intelligence Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {marketIntelligence.map((intel, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-900">{intel.jurisdiction}</h5>
                    <Badge 
                      variant={intel.priority === 'High' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {intel.priority}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Opportunity:</span>
                      <p className="text-gray-600">{intel.opportunity}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Value:</span>
                        <p className="font-semibold text-green-600">{intel.value}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Timeline:</span>
                        <p className="font-semibold text-gray-700">{intel.timeline}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Confidence:</span>
                        <p className="font-semibold text-purple-600">{intel.confidence}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Properties:</span>
                        <p className="font-semibold text-blue-600">{intel.properties}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-3 h-8 text-xs"
                    onClick={() => handleActionClick('market_analysis', `Analyze ${intel.jurisdiction} ${intel.opportunity}`)}
                  >
                    <Target className="w-3 h-3 mr-2" />
                    Analyze Opportunity
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <span>🏆 AI Performance Predictions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { metric: "Q4 Revenue Projection", value: "$3.2M", confidence: 89, trend: "+18%" },
              { metric: "Success Rate Forecast", value: "91%", confidence: 92, trend: "+4%" },
              { metric: "New Opportunities", value: "47", confidence: 85, trend: "+12%" },
              { metric: "Avg Case Value", value: "$67K", confidence: 87, trend: "+7%" }
            ].map((prediction, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-1">{prediction.value}</div>
                <div className="text-sm font-medium text-gray-700 mb-2">{prediction.metric}</div>
                <div className="flex items-center justify-center space-x-2 text-xs">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {prediction.confidence}% confidence
                  </span>
                  <span className="text-green-600 font-medium">{prediction.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Results */}
      {showDetailedResults && analysisResults && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <span className="text-blue-900">🎯 AI Opportunity Analysis Results</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDetailedResults(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-700 mb-1">
                    {Math.round(analysisResults.success_probability * 100)}%
                  </div>
                  <div className="text-sm font-medium text-green-600">Success Probability</div>
                  <Progress 
                    value={analysisResults.success_probability * 100} 
                    className="mt-2 h-2" 
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-1">
                    {analysisResults.estimated_savings}
                  </div>
                  <div className="text-sm font-medium text-blue-600">Estimated Savings</div>
                  <div className="text-xs text-blue-500 mt-1">
                    {analysisResults.detailed_metrics.timeline}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {analysisResults.detailed_metrics.comparable_properties}
                  </div>
                  <div className="text-sm font-medium text-purple-600">Comparable Properties</div>
                  <div className="text-xs text-purple-500 mt-1">
                    {analysisResults.detailed_metrics.appeal_history}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Findings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span>Key Findings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysisResults.findings.map((finding, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Market Intelligence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                    <span>Market Intelligence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Market Variance</div>
                    <div className="text-lg font-semibold text-red-600">
                      {analysisResults.detailed_metrics.market_variance}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Risk Factors</div>
                    {analysisResults.detailed_metrics.risk_factors.map((risk, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-sm text-gray-600">{risk}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Expected Timeline</div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-600">
                        {analysisResults.detailed_metrics.timeline}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendation */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">AI Recommendation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-green-800 mb-2">
                  {analysisResults.recommendation}
                </div>
                <div className="text-sm text-green-700">
                  Based on comprehensive analysis of {analysisResults.jurisdiction} market conditions, 
                  comparable sales data, and historical appeal success rates.
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Proceed with Appeal
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Progress Indicator */}
      {isAnalyzing && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
              <div>
                <div className="text-lg font-semibold text-blue-800">AI Analysis in Progress</div>
                <div className="text-sm text-blue-600">Processing market data and comparable sales...</div>
              </div>
            </div>
            <Progress value={65} className="mt-4" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}