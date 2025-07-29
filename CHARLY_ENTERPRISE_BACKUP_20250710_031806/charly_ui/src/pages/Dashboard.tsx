import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  LucideSparkles, 
  LucideClock, 
  LucideFolderOpen, 
  LucideCheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Eye,
  FileText,
  Calendar,
  Bell,
  Filter,
  Download
} from "lucide-react";

export function Dashboard() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
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

  useEffect(() => {
    fetchKPIs();
    fetchRecentActivity();
    fetchAnalytics();
    fetchAIInsights();
  }, [fetchKPIs, fetchRecentActivity, fetchAnalytics, fetchAIInsights]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      handleRefreshAll();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefreshAll = async () => {
    setLastRefresh(new Date());
    await Promise.all([
      fetchKPIs(true),
      fetchRecentActivity(),
      fetchAnalytics(),
      fetchAIInsights()
    ]);
    toast({
      title: "Dashboard Updated",
      description: "All data has been refreshed successfully",
    });
  };

  const handleKPIClick = (label: string, value: string | number) => {
    setSelectedKPI(label);
    toast({
      title: `${label} Details`,
      description: `Current value: ${value}. Click for detailed analysis.`,
    });
  };

  const handleActivityClick = (activity: any) => {
    toast({
      title: "Activity Details",
      description: `${activity.message} - Click to view full details`,
    });
  };

  const handleInsightAction = (action: string) => {
    toast({
      title: "Action Triggered",
      description: `Executing: ${action.replace(/_/g, ' ')}`,
    });
  };

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
            {autoRefresh && (
              <Badge variant="secondary" className="text-xs animate-pulse">
                Auto-refresh enabled
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 border-green-200" : ""}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card 
            key={i} 
            className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${
              selectedKPI === kpi.label ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => handleKPIClick(kpi.label, kpi.value)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${kpi.bgColor} transition-colors hover:opacity-80`}>
                  {kpi.icon}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">+12%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>
              <p className={`text-3xl font-bold ${kpi.textColor} transition-colors`}>{kpi.value}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">vs last month</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="briefing" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              AI Briefing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">📋 Portfolio Snapshot</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  You have <span className="font-semibold text-blue-700">{openAppeals}</span> active appeals, 
                  with <span className="font-semibold text-orange-700">{upcomingDeadlines}</span> deadlines approaching.
                </p>
              </div>
              
              {/* Interactive Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {recentActivity.slice(0, 3).map((activity, index) => (
                  <Card 
                    key={activity.id || index} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleActivityClick(activity)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          {activity.type === 'property_flagged' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                          {activity.type === 'appeal_filed' && <FileText className="w-4 h-4 text-blue-500" />}
                          {activity.type === 'deadline_approaching' && <Calendar className="w-4 h-4 text-red-500" />}
                          {activity.type === 'property_flagged' && 'Properties Flagged'}
                          {activity.type === 'appeal_filed' && 'Appeal Filed'}
                          {activity.type === 'deadline_approaching' && 'Deadline Alert'}
                        </h4>
                        <Badge 
                          variant={activity.severity === 'warning' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Fallback if no activity data */}
                {recentActivity.length === 0 && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Recent Activity</h4>
                      <p className="text-sm text-gray-600">Loading recent activity...</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">This Week</h4>
                      <p className="text-sm text-gray-600">2 appeals filed, 1 hearing scheduled</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Success Rate</h4>
                      <p className="text-sm text-gray-600">87% win rate on completed appeals</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">📈 Financial Metrics</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Savings by Category</h4>
                    <div className="space-y-2">
                      {analytics?.savings_by_category ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Commercial Properties</span>
                            <span className="font-semibold text-gray-900">
                              ${(analytics.savings_by_category.commercial / 1000000).toFixed(1)}M
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Residential Properties</span>
                            <span className="font-semibold text-gray-900">
                              ${(analytics.savings_by_category.residential / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Industrial Properties</span>
                            <span className="font-semibold text-gray-900">
                              ${(analytics.savings_by_category.industrial / 1000).toFixed(0)}K
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Loading analytics...</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Appeal Performance</h4>
                    <div className="space-y-2">
                      {analytics?.performance_metrics ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average Reduction</span>
                            <span className="font-semibold text-gray-900">
                              {analytics.performance_metrics.average_reduction}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Success Rate</span>
                            <span className="font-semibold text-gray-900">
                              {analytics.performance_metrics.success_rate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg. Time to Resolution</span>
                            <span className="font-semibold text-gray-900">
                              {analytics.performance_metrics.avg_resolution_days} days
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Loading performance data...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="briefing" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">🧠 AI Briefing</h3>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                <h4 className="font-medium text-gray-700 mb-3">Today's Insights</h4>
                {aiInsights?.insights ? (
                  <ul className="space-y-3 text-gray-600">
                    {aiInsights.insights.map((insight: any, index: number) => (
                      <li key={index} className="border border-purple-200 rounded-lg p-3 hover:bg-purple-25 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-purple-600">•</span>
                              <Badge variant="outline" className="text-xs">
                                {insight.type.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <span className="text-sm">{insight.message}</span>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-purple-500 bg-purple-100 px-2 py-1 rounded-full">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={() => handleInsightAction(insight.action)}
                              >
                                <Bell className="w-3 h-3 mr-1" />
                                Act on this
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">Loading AI insights...</div>
                )}
                
                {aiInsights?.recommendations && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-700">Quick Actions</h5>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        <Filter className="w-3 h-3 mr-1" />
                        Filter
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {aiInsights.recommendations.map((rec: string, index: number) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="justify-start h-8 px-3 text-xs hover:bg-blue-50"
                          onClick={() => toast({
                            title: "Recommendation Selected",
                            description: rec,
                          })}
                        >
                          <span className="text-blue-600 mr-2">→</span>
                          <span className="flex-1 text-left">{rec}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}