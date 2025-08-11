/**
 * 🍎 CHARLY 2.0 - DASHBOARD REVOLUTION
 * 
 * Task 11: Executive Command Center - Transform dashboard into intelligent
 * oversight center with Apple-quality data visualization and predictive insights.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button
} from "@/components/v2";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Brain,
  Users,
  FileText,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
// Portfolio metrics type for future use
// import type { PortfolioMetrics } from "@/types/property";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ExecutiveDashboardState {
  selectedTimeframe: string;
  selectedView: 'overview' | 'performance' | 'opportunities' | 'alerts';
  refreshInterval: number;
  darkMode: boolean;
  compactMode: boolean;
}

interface ExecutiveKPI {
  id: string;
  title: string;
  value: string;
  change: string;
  changeDirection: 'up' | 'down' | 'neutral';
  trend: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  subtitle: string;
  critical?: boolean;
}

interface PredictiveInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  actionable: boolean;
  priority: number;
}

interface IntelligentAlert {
  id: string;
  type: 'deadline' | 'opportunity' | 'anomaly' | 'success' | 'warning';
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  actionRequired: boolean;
  actionUrl?: string;
}

// ============================================================================
// PERFORMANCE ANALYTICS DATA
// ============================================================================

// Performance metric interface for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _PerformanceMetric {
  period: string;
  successRate: number;
  avgTimeline: number;
  savingsRealized: number;
  appealsProcessed: number;
}

// Jurisdiction performance interface for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _JurisdictionPerformance {
  jurisdiction: string;
  totalAppeals: number;
  successRate: number;
  avgSavings: number;
  avgTimeline: number;
  trend: 'up' | 'down' | 'stable';
}

// Financial impact interface for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _FinancialImpact {
  month: string;
  targetSavings: number;
  actualSavings: number;
  efficiency: number;
}

// Simplified mock data for core dashboard functionality
// Mock performance data for future use
/* const mockPerformanceData: PerformanceMetric[] = [
  { period: "Q4 2024", successRate: 86.5, avgTimeline: 45, savingsRealized: 920000, appealsProcessed: 108 },
]; */

// Mock jurisdiction data for future use
/* const mockJurisdictionData: JurisdictionPerformance[] = [
  { jurisdiction: "Los Angeles County", totalAppeals: 347, successRate: 86.2, avgSavings: 125000, avgTimeline: 44, trend: 'up' },
  { jurisdiction: "Orange County", totalAppeals: 289, successRate: 83.1, avgSavings: 98000, avgTimeline: 48, trend: 'stable' },
]; */

// ============================================================================
// MOCK DATA (Real implementation would fetch from API)
// ============================================================================

const mockExecutiveKPIs: ExecutiveKPI[] = [
  {
    id: "total-value",
    title: "Total Portfolio Value",
    value: "$45.2M",
    change: "+12.5%",
    changeDirection: "up",
    trend: "positive",
    icon: <DollarSign className="w-5 h-5" />,
    subtitle: "Across 1,847 properties"
  },
  {
    id: "savings-realized",
    title: "Savings Realized",
    value: "$2.8M",
    change: "+18.3%",
    changeDirection: "up",
    trend: "positive",
    icon: <TrendingUp className="w-5 h-5" />,
    subtitle: "YTD performance"
  },
  {
    id: "success-rate",
    title: "Appeal Success Rate",
    value: "84.2%",
    change: "+5.7%",
    changeDirection: "up",
    trend: "positive",
    icon: <Target className="w-5 h-5" />,
    subtitle: "Above industry average"
  },
  {
    id: "active-appeals",
    title: "Active Appeals",
    value: "142",
    change: "+23",
    changeDirection: "up",
    trend: "neutral",
    icon: <FileText className="w-5 h-5" />,
    subtitle: "In progress"
  },
  {
    id: "avg-timeline",
    title: "Avg Resolution Time",
    value: "47 days",
    change: "-8 days",
    changeDirection: "down",
    trend: "positive",
    icon: <Clock className="w-5 h-5" />,
    subtitle: "Faster than Q3"
  },
  {
    id: "community-insights",
    title: "Community Intelligence",
    value: "1,234",
    change: "+156",
    changeDirection: "up",
    trend: "positive",
    icon: <Brain className="w-5 h-5" />,
    subtitle: "Active data points"
  }
];

const mockPredictiveInsights: PredictiveInsight[] = [
  {
    id: "insight-1",
    type: "opportunity",
    title: "Q1 2024 Appeal Surge Predicted",
    description: "Market analysis suggests 35% increase in viable appeals for commercial properties in Los Angeles County",
    confidence: 0.89,
    impact: "high",
    timeframe: "Next 90 days",
    actionable: true,
    priority: 1
  },
  {
    id: "insight-2",
    type: "risk",
    title: "Jurisdiction Processing Delays",
    description: "Orange County showing 23% longer processing times, consider priority filing",
    confidence: 0.76,
    impact: "medium",
    timeframe: "Next 60 days",
    actionable: true,
    priority: 2
  },
  {
    id: "insight-3",
    type: "trend",
    title: "Residential Assessment Variance",
    description: "Residential properties showing consistent 15% over-assessment pattern",
    confidence: 0.92,
    impact: "high",
    timeframe: "Ongoing",
    actionable: true,
    priority: 3
  }
];

const mockIntelligentAlerts: IntelligentAlert[] = [
  {
    id: "alert-1",
    type: "deadline",
    title: "Critical Deadline Approaching",
    message: "15 appeals due for filing in the next 7 days",
    severity: "critical",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    actionRequired: true,
    actionUrl: "/appeals"
  },
  {
    id: "alert-2",
    type: "opportunity",
    title: "High-Value Opportunity Detected",
    message: "New property flagged with $180K potential savings",
    severity: "high",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    actionRequired: true,
    actionUrl: "/portfolio"
  },
  {
    id: "alert-3",
    type: "success",
    title: "Appeal Decision Received",
    message: "Successful appeal saved client $95K in annual taxes",
    severity: "low",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    actionRequired: false
  }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardV2() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [state, setState] = useState<ExecutiveDashboardState>({
    selectedTimeframe: "30d",
    selectedView: "overview",
    refreshInterval: 30000,
    darkMode: false,
    compactMode: false
  });

  const [kpis] = useState<ExecutiveKPI[]>(mockExecutiveKPIs);
  const [insights] = useState<PredictiveInsight[]>(mockPredictiveInsights);
  const [alerts] = useState<IntelligentAlert[]>(mockIntelligentAlerts);
  // Performance data for future use
  // const [performanceData] = useState<PerformanceMetric[]>(mockPerformanceData);
  // Jurisdiction data for future use
  // const [jurisdictionData] = useState<JurisdictionPerformance[]>(mockJurisdictionData);
  // Financial impact data for future use
  // const [financialImpact] = useState<FinancialImpact[]>(mockFinancialImpact);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated] = useState<Date>(new Date());

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const criticalAlerts = useMemo(() => {
    return alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high');
  }, [alerts]);

  const portfolioHealth = useMemo(() => {
    const successRate = parseFloat(kpis.find(kpi => kpi.id === 'success-rate')?.value.replace('%', '') || '0');
    const avgTimeline = parseInt(kpis.find(kpi => kpi.id === 'avg-timeline')?.value.replace(' days', '') || '0');
    
    let health = 'excellent';
    if (successRate < 70 || avgTimeline > 60) health = 'needs-attention';
    else if (successRate < 80 || avgTimeline > 45) health = 'good';
    
    return health;
  }, [kpis]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Dashboard Updated",
        description: "All executive metrics have been refreshed.",
      });
    } catch {
      toast({
        title: "Refresh Failed",
        description: "Unable to update dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTimeframeChange = (timeframe: string) => {
    setState(prev => ({ ...prev, selectedTimeframe: timeframe }));
  };

  const handleViewChange = (view: ExecutiveDashboardState['selectedView']) => {
    setState(prev => ({ ...prev, selectedView: view }));
  };

  const handleAlertAction = (alertId: string, actionUrl?: string) => {
    if (actionUrl) {
      navigate(actionUrl);
    } else {
      toast({
        title: "Alert acknowledged",
        description: "Alert has been marked as reviewed.",
      });
    }
  };

  // ============================================================================
  // EXECUTIVE OVERVIEW SECTION
  // ============================================================================

  const ExecutiveOverviewSection = () => (
    <div className="space-y-6">
      {/* Portfolio Health Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              portfolioHealth === 'excellent' && "bg-green-500",
              portfolioHealth === 'good' && "bg-yellow-500",
              portfolioHealth === 'needs-attention' && "bg-red-500"
            )}></div>
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Health Status</h3>
          </div>
          <Badge variant="outline" className={cn(
            "font-medium",
            portfolioHealth === 'excellent' && "bg-green-50 text-green-700 border-green-200",
            portfolioHealth === 'good' && "bg-yellow-50 text-yellow-700 border-yellow-200",
            portfolioHealth === 'needs-attention' && "bg-red-50 text-red-700 border-red-200"
          )}>
            {portfolioHealth === 'excellent' ? 'Excellent' : 
             portfolioHealth === 'good' ? 'Good' : 'Needs Attention'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">84.2%</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg Timeline</p>
            <p className="text-2xl font-bold text-blue-600">47 days</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Active Appeals</p>
            <p className="text-2xl font-bold text-purple-600">142</p>
          </div>
        </div>
      </div>

      {/* Executive KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  kpi.trend === 'positive' && "bg-green-100 text-green-600",
                  kpi.trend === 'negative' && "bg-red-100 text-red-600",
                  kpi.trend === 'neutral' && "bg-gray-100 text-gray-600"
                )}>
                  {kpi.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{kpi.title}</h4>
                  <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <div className="flex items-center space-x-1">
                  {kpi.changeDirection === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : kpi.changeDirection === 'down' ? (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  ) : (
                    <Activity className="w-3 h-3 text-gray-500" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    kpi.changeDirection === 'up' && "text-green-600",
                    kpi.changeDirection === 'down' && "text-red-600",
                    kpi.changeDirection === 'neutral' && "text-gray-600"
                  )}>
                    {kpi.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // PREDICTIVE ANALYTICS SECTION
  // ============================================================================

  const PredictiveAnalyticsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Predictive Intelligence</h2>
          <p className="text-gray-600 mt-1">
            AI-powered insights and forecasting for strategic decision making
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast({ title: "Analysis running in background" })}
        >
          <Brain className="w-4 h-4 mr-2" />
          Run Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      insight.type === 'opportunity' && "bg-green-50 border-green-200 text-green-700",
                      insight.type === 'risk' && "bg-red-50 border-red-200 text-red-700",
                      insight.type === 'trend' && "bg-blue-50 border-blue-200 text-blue-700",
                      insight.type === 'recommendation' && "bg-purple-50 border-purple-200 text-purple-700"
                    )}
                  >
                    {insight.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      insight.impact === 'high' && "bg-orange-50 border-orange-200 text-orange-700",
                      insight.impact === 'medium' && "bg-yellow-50 border-yellow-200 text-yellow-700",
                      insight.impact === 'low' && "bg-gray-50 border-gray-200 text-gray-700"
                    )}
                  >
                    {insight.impact} impact
                  </Badge>
                  <span className="text-xs text-gray-500">{insight.timeframe}</span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {insight.title}
                </h3>
                <p className="text-gray-600 mb-4">{insight.description}</p>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={insight.confidence * 100} className="h-2 w-20" />
                      <span className="text-sm font-medium">{(insight.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Priority {insight.priority}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {insight.actionable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast({ title: "Action initiated" })}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Take Action
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast({ title: "Detailed analysis coming soon" })}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // PERFORMANCE ANALYTICS SECTION
  // ============================================================================

  // Performance Analytics placeholder - minimal implementation
  const PerformanceAnalyticsSection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Analytics</h2>
      <p className="text-gray-600">Performance analytics will be implemented in adaptive architecture phase.</p>
    </div>
  );

  // ============================================================================
  // INTELLIGENT ALERTS SECTION
  // ============================================================================

  const IntelligentAlertsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Intelligent Alerts</h2>
          <p className="text-gray-600 mt-1">
            Real-time notifications and actionable insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
            {criticalAlerts.length} Critical
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast({ title: "All alerts marked as read" })}
          >
            Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={cn(
            "bg-white rounded-xl shadow-sm border p-6",
            alert.severity === 'critical' && "border-red-200 bg-red-50",
            alert.severity === 'high' && "border-orange-200 bg-orange-50",
            alert.severity === 'medium' && "border-yellow-200 bg-yellow-50",
            alert.severity === 'low' && "border-gray-200"
          )}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  alert.type === 'deadline' && "bg-red-100 text-red-600",
                  alert.type === 'opportunity' && "bg-green-100 text-green-600",
                  alert.type === 'success' && "bg-blue-100 text-blue-600",
                  alert.type === 'warning' && "bg-yellow-100 text-yellow-600",
                  alert.type === 'anomaly' && "bg-purple-100 text-purple-600"
                )}>
                  {alert.type === 'deadline' && <Calendar className="w-5 h-5" />}
                  {alert.type === 'opportunity' && <TrendingUp className="w-5 h-5" />}
                  {alert.type === 'success' && <CheckCircle className="w-5 h-5" />}
                  {alert.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                  {alert.type === 'anomaly' && <Activity className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {alert.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{alert.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{alert.timestamp.toLocaleString()}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {alert.actionRequired && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlertAction(alert.id, alert.actionUrl)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Action Required
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAlertAction(alert.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Executive Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Executive Command Center</h1>
              <p className="text-gray-600 mt-1">
                Real-time portfolio oversight and predictive intelligence
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Data</span>
              </div>
              <select
                value={state.selectedTimeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                aria-label="Select timeframe"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={state.selectedView} onValueChange={handleViewChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ExecutiveOverviewSection />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceAnalyticsSection />
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <PredictiveAnalyticsSection />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <IntelligentAlertsSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>1,847 Properties</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>142 Active Appeals</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
              System Healthy
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}