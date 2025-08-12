/**
 * 🍎 CHARLY 2.0 - MARKET INTELLIGENCE REVOLUTION
 * 
 * Task 10: Collaborative data visualization and community insights platform
 * that transforms market analysis into intelligent, community-driven insights.
 */

import { useState, useMemo } from "react";
// Navigation for future use
// import { useNavigate } from "react-router-dom";
import { 
  Button
} from "@/components/v2";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  Share2, 
  Shield,
  Brain,
  Eye,
  Activity,
  Target,
  Clock,
  Award,
  RefreshCw,
  Download
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { CommunityContribution } from "@/types/property";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MarketTrendData {
  jurisdiction: string;
  averageAssessment: number;
  averageMarketValue: number;
  assessmentVariance: number;
  propertiesAnalyzed: number;
  successRate: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface CommunityInsight {
  id: string;
  type: 'comparable_sale' | 'assessment_variance' | 'market_trend' | 'jurisdiction_pattern';
  jurisdiction: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
  value: number;
  contributorCount: number;
  lastVerified: Date;
  anonymousHash: string;
}

interface MarketIntelligenceState {
  selectedJurisdiction: string;
  selectedTimeframe: string;
  communityDataEnabled: boolean;
  realTimeUpdates: boolean;
  shareLevel: 'private' | 'community' | 'public';
  analysisMode: 'overview' | 'trends' | 'opportunities' | 'community';
}

// ============================================================================
// MOCK DATA (Real implementation would fetch from API)
// ============================================================================

const mockMarketTrends: MarketTrendData[] = [
  {
    jurisdiction: "Los Angeles County",
    averageAssessment: 850000,
    averageMarketValue: 1200000,
    assessmentVariance: 29.2,
    propertiesAnalyzed: 1247,
    successRate: 78.3,
    trend: 'up',
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    jurisdiction: "Orange County",
    averageAssessment: 720000,
    averageMarketValue: 950000,
    assessmentVariance: 24.2,
    propertiesAnalyzed: 892,
    successRate: 71.8,
    trend: 'stable',
    lastUpdated: new Date(Date.now() - 8 * 60 * 1000)
  },
  {
    jurisdiction: "San Francisco",
    averageAssessment: 1100000,
    averageMarketValue: 1450000,
    assessmentVariance: 31.8,
    propertiesAnalyzed: 654,
    successRate: 82.1,
    trend: 'up',
    lastUpdated: new Date(Date.now() - 3 * 60 * 1000)
  }
];

const mockCommunityInsights: CommunityInsight[] = [
  {
    id: "insight-1",
    type: "assessment_variance",
    jurisdiction: "Los Angeles County",
    confidence: 0.92,
    impact: "high",
    description: "Commercial properties in downtown LA showing 35% over-assessment pattern",
    value: 350000,
    contributorCount: 23,
    lastVerified: new Date(Date.now() - 2 * 60 * 60 * 1000),
    anonymousHash: "abc123"
  },
  {
    id: "insight-2",
    type: "market_trend",
    jurisdiction: "Orange County",
    confidence: 0.87,
    impact: "medium",
    description: "Residential properties near schools showing assessment lag",
    value: 125000,
    contributorCount: 18,
    lastVerified: new Date(Date.now() - 4 * 60 * 60 * 1000),
    anonymousHash: "def456"
  },
  {
    id: "insight-3",
    type: "jurisdiction_pattern",
    jurisdiction: "San Francisco",
    confidence: 0.94,
    impact: "high",
    description: "Consistent over-assessment in SOMA district residential properties",
    value: 280000,
    contributorCount: 31,
    lastVerified: new Date(Date.now() - 1 * 60 * 60 * 1000),
    anonymousHash: "ghi789"
  }
];

const mockCommunityContribution: CommunityContribution = {
  userId: "user_123",
  propertiesShared: 14,
  dataQualityScore: 0.91,
  communityTrustScore: 0.87,
  successfulAppeals: 8,
  lastContribution: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  reputationLevel: "gold"
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MarketIntelligenceV2() {
  const { toast } = useToast();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [state, setState] = useState<MarketIntelligenceState>({
    selectedJurisdiction: "Los Angeles County",
    selectedTimeframe: "30d",
    communityDataEnabled: true,
    realTimeUpdates: true,
    shareLevel: "community",
    analysisMode: "overview"
  });

  const [marketTrends] = useState<MarketTrendData[]>(mockMarketTrends);
  const [communityInsights] = useState<CommunityInsight[]>(mockCommunityInsights);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLastUpdated] = useState<Date>(new Date()); // Last updated for future use

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedTrendData = useMemo(() => {
    return marketTrends.find(trend => trend.jurisdiction === state.selectedJurisdiction);
  }, [marketTrends, state.selectedJurisdiction]);

  const relevantInsights = useMemo(() => {
    return communityInsights.filter(insight => 
      insight.jurisdiction === state.selectedJurisdiction
    );
  }, [communityInsights, state.selectedJurisdiction]);

  const marketSummary = useMemo(() => {
    const totalProperties = marketTrends.reduce((sum, trend) => sum + trend.propertiesAnalyzed, 0);
    const avgSuccessRate = marketTrends.reduce((sum, trend) => sum + trend.successRate, 0) / marketTrends.length;
    const avgVariance = marketTrends.reduce((sum, trend) => sum + trend.assessmentVariance, 0) / marketTrends.length;
    
    return {
      totalProperties,
      avgSuccessRate,
      avgVariance,
      totalInsights: communityInsights.length,
      totalContributors: new Set(communityInsights.map(insight => insight.anonymousHash)).size
    };
  }, [marketTrends, communityInsights]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleJurisdictionChange = (jurisdiction: string) => {
    setState(prev => ({ ...prev, selectedJurisdiction: jurisdiction }));
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastUpdated(new Date());
      toast({
        title: "Market data refreshed",
        description: "Latest community insights and trends have been updated.",
      });
    } catch {
      toast({
        title: "Refresh failed",
        description: "Unable to update market data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareInsight = () => {
    toast({
      title: "Insight shared",
      description: "Your market insight has been shared with the community.",
    });
  };

  const handleAnalysisModeChange = (mode: MarketIntelligenceState['analysisMode']) => {
    setState(prev => ({ ...prev, analysisMode: mode }));
  };

  // ============================================================================
  // MARKET OVERVIEW SECTION
  // ============================================================================

  const MarketOverviewSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Market Overview</h2>
          <p className="text-gray-600 mt-1">
            Real-time market intelligence from {marketSummary.totalContributors} anonymous contributors
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-green-50 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Live Data
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">Properties Analyzed</span>
            </div>
            <span className="text-xs text-green-600 font-medium">+12%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{marketSummary.totalProperties.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Across all jurisdictions</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-900">Success Rate</span>
            </div>
            <span className="text-xs text-green-600 font-medium">+5.2%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{marketSummary.avgSuccessRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Community-wide appeals</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-900">Assessment Variance</span>
            </div>
            <span className="text-xs text-red-600 font-medium">-2.1%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{marketSummary.avgVariance.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Average over-assessment</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-900">Community Insights</span>
            </div>
            <span className="text-xs text-green-600 font-medium">+8</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{marketSummary.totalInsights}</p>
          <p className="text-sm text-gray-600">Active data points</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Jurisdiction Performance</h3>
            <select
              value={state.selectedJurisdiction}
              onChange={(e) => handleJurisdictionChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              aria-label="Select jurisdiction for analysis"
            >
              {marketTrends.map(trend => (
                <option key={trend.jurisdiction} value={trend.jurisdiction}>
                  {trend.jurisdiction}
                </option>
              ))}
            </select>
          </div>

          {selectedTrendData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{selectedTrendData.successRate}%</span>
                  {selectedTrendData.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : selectedTrendData.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Activity className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
              <Progress value={selectedTrendData.successRate} className="h-2" />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Properties Analyzed</p>
                  <p className="text-lg font-semibold">{selectedTrendData.propertiesAnalyzed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assessment Variance</p>
                  <p className="text-lg font-semibold">{selectedTrendData.assessmentVariance}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Community Contribution</h3>
            <Badge variant="outline" className="bg-yellow-50 border-yellow-200">
              <Award className="w-3 h-3 mr-1" />
              {mockCommunityContribution.reputationLevel}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Quality Score</span>
              <span className="text-sm font-semibold">{(mockCommunityContribution.dataQualityScore * 100).toFixed(0)}%</span>
            </div>
            <Progress value={mockCommunityContribution.dataQualityScore * 100} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">Properties Shared</p>
                <p className="text-lg font-semibold">{mockCommunityContribution.propertiesShared}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Successful Appeals</p>
                <p className="text-lg font-semibold">{mockCommunityContribution.successfulAppeals}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // COMMUNITY INSIGHTS SECTION
  // ============================================================================

  const CommunityInsightsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Insights</h2>
          <p className="text-gray-600 mt-1">
            Anonymous market intelligence from verified contributors
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast({ title: "Export functionality coming soon" })}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {relevantInsights.map((insight) => (
          <div key={insight.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      insight.impact === 'high' && "bg-red-50 border-red-200 text-red-700",
                      insight.impact === 'medium' && "bg-yellow-50 border-yellow-200 text-yellow-700",
                      insight.impact === 'low' && "bg-green-50 border-green-200 text-green-700"
                    )}
                  >
                    {insight.impact} impact
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    {insight.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {insight.contributorCount} contributors
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {insight.description}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Confidence Score</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={insight.confidence * 100} className="h-2 flex-1" />
                      <span className="text-sm font-semibold">{(insight.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Potential Impact</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${insight.value.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Last verified {insight.lastVerified.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Anonymous contributor</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareInsight(insight.id)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast({ title: "Detailed view coming soon" })}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Analyze
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // COLLABORATION OPPORTUNITIES SECTION
  // ============================================================================

  const CollaborationOpportunitiesSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Collaboration Opportunities</h2>
        <p className="text-gray-600 mt-1">
          Share data anonymously and benefit from community insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Anonymous Data Sharing</h3>
              <p className="text-gray-600 mb-4">
                Contribute your property data anonymously to help the community while maintaining privacy
              </p>
              <Button onClick={() => toast({ title: "Data sharing preferences updated" })}>
                Configure Sharing
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Brain className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Intelligence Feed</h3>
              <p className="text-gray-600 mb-4">
                Get real-time insights from community-driven market analysis and trend identification
              </p>
              <Button onClick={() => toast({ title: "Subscribed to intelligence feed" })}>
                Subscribe to Feed
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborative Analysis</h3>
              <p className="text-gray-600 mb-4">
                Join forces with other professionals to analyze market patterns and assessment discrepancies
              </p>
              <Button onClick={() => toast({ title: "Joined collaborative analysis group" })}>
                Join Analysis Group
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Award className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Recognition</h3>
              <p className="text-gray-600 mb-4">
                Build your reputation through quality contributions and successful appeal outcomes
              </p>
              <Button onClick={() => toast({ title: "Reputation details coming soon" })}>
                View Reputation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Market Intelligence 2.0</h1>
          <p className="text-gray-600 mt-2">Community-driven market intelligence platform</p>
        </div>

        {/* Test Content */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8" role="region" aria-label="Market Intelligence Overview">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Test</h2>
          <p className="text-gray-600 mb-4">If you can see this, the component is working.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Properties Analyzed</h3>
              <p className="text-2xl font-bold text-blue-600">2,793</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Success Rate</h3>
              <p className="text-2xl font-bold text-green-600">77.1%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Community Insights</h3>
              <p className="text-2xl font-bold text-purple-600">23</p>
            </div>
          </div>
        </div>

        {/* Tabs Test */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Tabs value={state.analysisMode} onValueChange={handleAnalysisModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <MarketOverviewSection />
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <CommunityInsightsSection />
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-6">
              <CollaborationOpportunitiesSection />
            </TabsContent>

            <TabsContent value="community" className="space-y-6">
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Features</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Advanced community collaboration features and social intelligence tools coming soon.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}