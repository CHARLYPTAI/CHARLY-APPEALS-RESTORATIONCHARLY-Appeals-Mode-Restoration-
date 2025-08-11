import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  DollarSign, 
  Target, 
  Download,
  RefreshCw,
  CheckCircle,
  Activity,
  MapPin
} from 'lucide-react';

export const BusinessIntelligenceDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for safe demonstration
  const mockKPIs = [
    {
      name: 'Total Savings Generated',
      current_value: 2547000,
      previous_value: 2245000,
      change_percentage: 13.4,
      trend: 'up' as const,
      period: 'This Month'
    },
    {
      name: 'Active Appeals',
      current_value: 156,
      previous_value: 142,
      change_percentage: 9.9,
      trend: 'up' as const,
      period: 'Current'
    },
    {
      name: 'Success Rate',
      current_value: 87.5,
      previous_value: 84.2,
      change_percentage: 3.9,
      trend: 'up' as const,
      period: 'YTD Average'
    },
    {
      name: 'Avg. Processing Time',
      current_value: 14.2,
      previous_value: 16.8,
      change_percentage: -15.5,
      trend: 'down' as const,
      period: 'Days'
    }
  ];

  const mockJurisdictionPerformance = [
    { name: 'Harris County', success_rate: 92, total_appeals: 45, savings: 987000 },
    { name: 'Dallas County', success_rate: 86, total_appeals: 38, savings: 756000 },
    { name: 'Travis County', success_rate: 89, total_appeals: 42, savings: 623000 },
    { name: 'Tarrant County', success_rate: 83, total_appeals: 31, savings: 445000 }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleExport = () => {
    // Generate mock report
    const reportData = {
      generated: new Date().toISOString(),
      period: selectedPeriod,
      kpis: mockKPIs,
      jurisdictions: mockJurisdictionPerformance
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-intelligence-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Intelligence</h2>
          <p className="text-gray-600">Comprehensive analytics and performance metrics</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockKPIs.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.change_percentage > 0 ? '+' : ''}{kpi.change_percentage}%
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600">{kpi.name}</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {kpi.name.includes('Savings') || kpi.name.includes('Revenue') 
                      ? `$${(kpi.current_value / 1000).toFixed(0)}K`
                      : kpi.name.includes('Rate') || kpi.name.includes('Time')
                      ? `${kpi.current_value}${kpi.name.includes('Rate') ? '%' : ''}`
                      : kpi.current_value.toLocaleString()
                    }
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{kpi.period}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="jurisdiction" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="jurisdiction">Jurisdiction Performance</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
              <TabsTrigger value="operational">Operational Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="jurisdiction" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Performance by Jurisdiction</h3>
                <Badge variant="outline" className="text-blue-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  {mockJurisdictionPerformance.length} Active Jurisdictions
                </Badge>
              </div>

              <div className="space-y-4">
                {mockJurisdictionPerformance.map((jurisdiction, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">{jurisdiction.name}</h4>
                          <p className="text-sm text-gray-600">{jurisdiction.total_appeals} appeals</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Success Rate</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={jurisdiction.success_rate} className="flex-1" />
                            <span className="text-sm font-medium">{jurisdiction.success_rate}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Total Savings</p>
                          <p className="text-lg font-semibold text-green-600">
                            ${(jurisdiction.savings / 1000).toFixed(0)}K
                          </p>
                        </div>
                        
                        <div>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Revenue Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Appeal Fees</span>
                        <span className="font-semibold">$89,450</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Success Bonuses</span>
                        <span className="font-semibold">$67,200</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subscription Revenue</span>
                        <span className="font-semibold">$45,890</span>
                      </div>
                      <hr />
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-semibold">Total Revenue</span>
                        <span className="font-bold text-green-600">$202,540</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Monthly Targets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Revenue Target</span>
                          <span>$202K / $250K</span>
                        </div>
                        <Progress value={81} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Appeals Filed</span>
                          <span>156 / 200</span>
                        </div>
                        <Progress value={78} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Success Rate</span>
                          <span>87.5% / 85%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="operational" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-orange-500" />
                      Processing Efficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Avg. Processing Time</span>
                        <span className="font-medium">14.2 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Appeals per Day</span>
                        <span className="font-medium">8.3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Automation Rate</span>
                        <span className="font-medium">73%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      Client Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Clients</span>
                        <span className="font-medium">47</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">New This Month</span>
                        <span className="font-medium">6</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Retention Rate</span>
                        <span className="font-medium">94%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Quality Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Accuracy Rate</span>
                        <span className="font-medium">96.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Client Satisfaction</span>
                        <span className="font-medium">4.8/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className="font-medium">1.4%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Enhanced Analytics</h4>
              <p className="text-blue-700 text-sm">
                This dashboard provides demonstration of advanced business intelligence capabilities. 
                In production, data would be sourced from real-time county systems and client databases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};