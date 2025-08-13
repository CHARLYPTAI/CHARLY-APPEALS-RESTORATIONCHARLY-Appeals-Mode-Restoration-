import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "@/store/dashboard";
import { authenticatedRequest, authService, tokenManager } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { FinancialMetricsChart } from "@/components/charts/FinancialMetricsChart";
import { AIBriefingDashboard } from "@/components/charts/AIBriefingDashboard";
import { BusinessIntelligenceDashboard } from "@/components/BusinessIntelligenceDashboard";
import { 
  LucideSparkles, 
  LucideClock, 
  LucideFolderOpen, 
  LucideCheckCircle2,
  AlertTriangle,
  X
} from "lucide-react";

// Import modular dashboard components
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";

export function Dashboard() {
  const navigate = useNavigate();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [filterOptions, setFilterOptions] = useState({
    dateRange: 'last30days',
    propertyType: 'all',
    status: 'all'
  });
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: string}>>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [isRunningFlaggingAnalysis, setIsRunningFlaggingAnalysis] = useState(false);
  const [showFlaggingResults, setShowFlaggingResults] = useState(false);
  const [authError, setAuthErrorState] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Guarded setAuthError that suppresses recovery banners
  const setAuthError = (msg: string | null) => {
    if (!msg) return setAuthErrorState(null);
    const hasTokens = !!(tokenManager.getAccessToken() || tokenManager.getRefreshToken());
    // Never surface noisy recovery/invalid-token banners when logged out or tokenless
    if (
      !hasTokens ||
      /^⚠️?\s*Authentication recovery failed$/i.test(msg) ||
      /Authentication failed.*no valid token available/i.test(msg)
    ) {
      console.info("Dashboard: suppressing auth banner; treating as logged-out.", msg);
      return setAuthErrorState(null);
    }
    setAuthErrorState(msg);
  };

  const [flaggingResults, setFlaggingResults] = useState<{
    total_properties_analyzed: number;
    flagged_properties: number;
    over_assessment_rate: number;
    potential_savings: number;
    analysis_date: string;
    breakdown: {
      by_property_type: Record<string, { analyzed: number; flagged: number; avg_over_assessment: number }>;
      by_jurisdiction: Record<string, { analyzed: number; flagged: number; potential_savings: number }>;
      top_opportunities: Array<{ property: string; current_assessment: number; suggested_value: number; potential_savings: number }>;
    };
  } | null>(null);

  const { toast } = useToast();
  
  const {
    taxSavings,
    openAppeals,
    upcomingDeadlines,
    appealsWon,
    loading,
    error,
    recentActivity,
    analytics,
    aiInsights,
    fetchKPIs,
    fetchRecentActivity,
    fetchAnalytics,
    fetchAIInsights,
  } = useDashboardStore();

  const [kpiOrder, setKpiOrder] = useState([0, 1, 2, 3]);

  const kpis = [
    {
      label: "Estimated Tax Savings",
      value: loading ? "Loading..." : taxSavings,
      icon: <LucideSparkles className="w-6 h-6 text-green-600" />,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      label: "Open Appeals",
      value: loading ? "…" : openAppeals.toString(),
      icon: <LucideFolderOpen className="w-6 h-6 text-blue-600" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: "Upcoming Deadlines",
      value: loading ? "…" : upcomingDeadlines.toString(),
      icon: <LucideClock className="w-6 h-6 text-orange-600" />,
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
    },
    {
      label: "Appeals Won",
      value: loading ? "…" : appealsWon.toString(),
      icon: <LucideCheckCircle2 className="w-6 h-6 text-purple-600" />,
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
  ];

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    setLastRefresh(new Date());
    try {
      await Promise.all([
        fetchKPIs(true),
        fetchRecentActivity(true),
        fetchAnalytics(true),
        fetchAIInsights(true),
      ]);
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchKPIs, fetchRecentActivity, fetchAnalytics, fetchAIInsights, toast]);

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    toast({
      title: autoRefresh ? "Auto-refresh Disabled" : "Auto-refresh Enabled",
      description: autoRefresh 
        ? "Dashboard will no longer refresh automatically" 
        : "Dashboard will refresh every 30 seconds",
    });
  };

  const handleKPIClick = (label: string, value: string) => {
    setSelectedKPI(label);
    toast({
      title: "KPI Selected",
      description: `Viewing details for ${label}: ${value}`,
    });
  };

  const handleShowKPIDetails = () => {
    setSelectedKPI('kpi-details');
    toast({
      title: "KPI Details",
      description: "Showing detailed metrics breakdown",
    });
  };

  const handleGenerateReport = async (type: string) => {
    toast({
      title: "Generating Report",
      description: `Creating ${type} report...`,
    });
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Report Generated",
      description: `${type} report has been created successfully.`,
    });
  };

  const handleRunFlaggingAnalysis = async () => {
    setIsRunningFlaggingAnalysis(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock flagging results
      const mockResults = {
        total_properties_analyzed: 156,
        flagged_properties: 23,
        over_assessment_rate: 14.7,
        potential_savings: 2400000,
        analysis_date: new Date().toISOString(),
        breakdown: {
          by_property_type: {
            commercial: { analyzed: 45, flagged: 12, avg_over_assessment: 18.5 },
            residential: { analyzed: 98, flagged: 8, avg_over_assessment: 12.3 },
            industrial: { analyzed: 13, flagged: 3, avg_over_assessment: 22.1 }
          },
          by_jurisdiction: {
            'Travis County': { analyzed: 67, flagged: 11, potential_savings: 980000 },
            'Harris County': { analyzed: 52, flagged: 8, potential_savings: 750000 },
            'Dallas County': { analyzed: 37, flagged: 4, potential_savings: 670000 }
          },
          top_opportunities: [
            { property: '123 Commerce St, Austin', current_assessment: 2500000, suggested_value: 1950000, potential_savings: 550000 },
            { property: '456 Main St, Houston', current_assessment: 1800000, suggested_value: 1450000, potential_savings: 350000 },
            { property: '789 Industrial Blvd, Dallas', current_assessment: 1200000, suggested_value: 980000, potential_savings: 220000 }
          ]
        }
      };
      
      setFlaggingResults(mockResults);
      setShowFlaggingResults(true);
      
      toast({
        title: "Analysis Complete",
        description: `Found ${mockResults.flagged_properties} flagged properties with $${mockResults.potential_savings.toLocaleString()} potential savings.`,
      });
      
    } catch (error) {
      console.error('Flagging analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to complete flagging analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRunningFlaggingAnalysis(false);
    }
  };

  const handleViewActivity = (activity: any) => {
    toast({
      title: "Activity Details",
      description: `Viewing details for: ${activity.message}`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting Data",
      description: `Exporting dashboard data as ${exportFormat.toUpperCase()}...`,
    });
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await authService.ensureReady();
        
        // If not authenticated after ensureReady, auto-login for demo
        if (!authService.isAuthenticated()) {
          console.log('Dashboard: Not authenticated, attempting auto-login for demo...');
          try {
            await authService.login({
              email: 'admin@charly.com',
              password: 'CharlyCTO2025!'
            });
            console.log('Dashboard: Auto-login successful');
          } catch (loginError) {
            console.error('Dashboard: Auto-login failed:', loginError);
            setAuthError('Please refresh the page to log in');
            return;
          }
        }
        
        await handleRefreshAll();
        
        // Add sample notifications
        setNotifications([
          { id: '1', message: 'New appeal filed for 123 Main St', type: 'info' },
          { id: '2', message: 'Deadline approaching for Harris County appeals', type: 'warning' }
        ]);
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        if (error instanceof Error) {
          setAuthError(error.message);
        }
      }
    };

    initializeDashboard();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(handleRefreshAll, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, handleRefreshAll]);

  // Transform analytics data with fallback
  const transformedAnalytics = analytics ? analytics : {
    savings_by_category: {
      commercial: 1800000,
      residential: 650000,
      industrial: 50000,
    },
    performance_metrics: {
      average_reduction: 23.5,
      success_rate: 87,
      avg_resolution_days: 45,
    },
    market_trends: {
      austin_commercial_overassessment: 15,
      houston_residential_variance: 8,
      dallas_industrial_compliance: 92,
    },
  };

  // Transform AI insights with fallback data
  const transformedAIInsights = aiInsights ? {
    insights: aiInsights.keyFindings?.map(finding => ({
      type: finding.impact,
      message: finding.description,
      confidence: finding.confidence,
      action: finding.title,
    })) || [],
    recommendations: aiInsights.recommendations?.map(rec => rec.action) || [],
  } : {
    insights: [
      {
        type: "opportunity",
        message: "3 properties in Austin show potential for 20%+ reduction based on comparable sales",
        confidence: 0.87,
        action: "review_comparables"
      },
      {
        type: "market_analysis", 
        message: "Market data suggests commercial assessments are running 15% above fair value",
        confidence: 0.92,
        action: "bulk_appeal_analysis"
      },
      {
        type: "deadline_alert",
        message: "Upcoming deadline: Harris County, TX appeals must be filed by March 31st",
        confidence: 1.0,
        action: "calendar_reminder"
      }
    ],
    recommendations: [
      "Focus on commercial properties for highest ROI",
      "Review Austin market comparables this week",
      "Prepare Harris County, TX filings immediately"
    ]
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your CHARLY property tax appeal dashboard</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="text-xs">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Badge>
            {wsConnected && (
              <div className="flex items-center text-xs text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
                Live updates active
              </div>
            )}
          </div>
        </div>
        
        <DashboardFilters
          lastRefresh={lastRefresh}
          autoRefresh={autoRefresh}
          filterOptions={filterOptions}
          exportFormat={exportFormat}
          onRefresh={handleRefreshAll}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          onFilterChange={setFilterOptions}
          onExportFormatChange={setExportFormat}
          onExport={handleExport}
          refreshing={refreshing}
        />
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Authentication Error:</span>
              <span>{authError}</span>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <NotificationsPanel
        notifications={notifications}
        onClearAll={handleClearNotifications}
        onDismiss={handleDismissNotification}
      />

      <DashboardStats
        kpis={kpis}
        kpiOrder={kpiOrder}
        selectedKPI={selectedKPI}
        onKpiOrderChange={setKpiOrder}
        onKPIClick={handleKPIClick}
        onShowDetails={handleShowKPIDetails}
      />

      <QuickActions
        loading={loading}
        onGenerateReport={handleGenerateReport}
        onRunFlaggingAnalysis={handleRunFlaggingAnalysis}
        isRunningFlaggingAnalysis={isRunningFlaggingAnalysis}
      />

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-lg mb-6">
          <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
          <TabsTrigger value="ai-insights">🤖 AI Insights</TabsTrigger>
          <TabsTrigger value="activity">📋 Recent Activity</TabsTrigger>
          <TabsTrigger value="business-intelligence">💼 Business Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <FinancialMetricsChart analytics={transformedAnalytics} />
        </TabsContent>

        <TabsContent value="ai-insights">
          <AIBriefingDashboard insights={transformedAIInsights} />
        </TabsContent>

        <TabsContent value="activity">
          <RecentActivity
            activities={recentActivity}
            loading={loading}
            onViewActivity={handleViewActivity}
          />
        </TabsContent>

        <TabsContent value="business-intelligence">
          <BusinessIntelligenceDashboard />
        </TabsContent>
      </Tabs>

      {/* Flagging Results Modal */}
      <Dialog open={showFlaggingResults} onOpenChange={setShowFlaggingResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Flagging Analysis Results
            </DialogTitle>
          </DialogHeader>
          
          {flaggingResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {flaggingResults.total_properties_analyzed}
                  </div>
                  <div className="text-sm text-gray-600">Properties Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-900">
                    {flaggingResults.flagged_properties}
                  </div>
                  <div className="text-sm text-gray-600">Flagged Opportunities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-900">
                    {flaggingResults.over_assessment_rate}%
                  </div>
                  <div className="text-sm text-gray-600">Over-assessment Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">
                    ${flaggingResults.potential_savings.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Potential Savings</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;