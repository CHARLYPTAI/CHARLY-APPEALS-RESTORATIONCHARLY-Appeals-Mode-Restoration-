// ============================================================================
// CHARLY PLATFORM - ENTERPRISE MONITORING DASHBOARD
// Apple CTO Phase 3D - Business Intelligence & Analytics
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { usePerformanceMonitoring } from '../services/performanceMonitoringService';

interface DashboardData {
  timestamp: number;
  performance: {
    avg_api_response_time: number;
    error_rate: number;
    total_requests: number;
    web_vitals: {
      lcp?: number;
      fid?: number;
      cls?: number;
    };
  };
  user_activity: {
    total_interactions: number;
    top_components: Array<{component: string; count: number}>;
    top_actions: Array<{action: string; count: number}>;
  };
  security: {
    total_events: number;
    critical_events: number;
    event_types: Array<{type: string; count: number}>;
  };
  system_health: {
    status: string;
    uptime: string;
    alerts_active: number;
  };
}

interface MonitoringDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = ""
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { trackInteraction } = usePerformanceMonitoring('MonitoringDashboard');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      trackInteraction('dashboard_refresh');
      
      const response = await fetch('/api/metrics/dashboard');
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [trackInteraction]);

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  if (loading && !dashboardData) {
    return (
      <div className={`monitoring-dashboard ${className}`}>
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading monitoring data...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`monitoring-dashboard ${className}`}>
        <Card className="p-6 border-red-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              ⚠️ Monitoring Dashboard Error
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} variant="outline">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // const getWebVitalsStatus = (vitals: DashboardData['performance']['web_vitals']) => {
  //   if (!vitals.lcp && !vitals.fid && !vitals.cls) return 'no-data';
  //   
  //   const lcpBad = vitals.lcp && vitals.lcp > 2500;
  //   const fidBad = vitals.fid && vitals.fid > 100;
  //   const clsBad = vitals.cls && vitals.cls > 0.1;
  //   
  //   if (lcpBad || fidBad || clsBad) return 'needs-improvement';
  //   return 'good';
  // };

  return (
    <div className={`monitoring-dashboard space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🍎 Enterprise Monitoring Dashboard
          </h2>
          <p className="text-gray-600">
            Apple CTO Phase 3D - Real-time Platform Monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={fetchDashboardData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Status</p>
              <Badge className={getStatusColor(dashboardData.system_health.status)}>
                {dashboardData.system_health.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-2xl">
              {dashboardData.system_health.status === 'healthy' ? '✅' : '⚠️'}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-semibold">{dashboardData.system_health.uptime}</p>
            </div>
            <div className="text-2xl">⏱️</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-lg font-semibold">{dashboardData.system_health.alerts_active}</p>
            </div>
            <div className="text-2xl">
              {dashboardData.system_health.alerts_active > 0 ? '🚨' : '✅'}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-lg font-semibold">{dashboardData.performance.total_requests}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">🚀 Performance Metrics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Response Time</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">
                  {dashboardData.performance.avg_api_response_time.toFixed(2)}ms
                </span>
                <Badge className={
                  dashboardData.performance.avg_api_response_time > 2000 ? 'bg-red-100 text-red-800' :
                  dashboardData.performance.avg_api_response_time > 1000 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }>
                  {dashboardData.performance.avg_api_response_time <= 1000 ? 'GOOD' : 
                   dashboardData.performance.avg_api_response_time <= 2000 ? 'OK' : 'SLOW'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Error Rate</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">
                  {dashboardData.performance.error_rate.toFixed(2)}%
                </span>
                <Badge className={
                  dashboardData.performance.error_rate > 5 ? 'bg-red-100 text-red-800' :
                  dashboardData.performance.error_rate > 1 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }>
                  {dashboardData.performance.error_rate <= 1 ? 'EXCELLENT' : 
                   dashboardData.performance.error_rate <= 5 ? 'ACCEPTABLE' : 'HIGH'}
                </Badge>
              </div>
            </div>

            {/* Apple CTO Standards Compliance */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Apple CTO Standards</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Response Time (&lt; 2000ms)</span>
                  <span className={dashboardData.performance.avg_api_response_time <= 2000 ? 'text-green-600' : 'text-red-600'}>
                    {dashboardData.performance.avg_api_response_time <= 2000 ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate (&lt; 1%)</span>
                  <span className={dashboardData.performance.error_rate <= 1 ? 'text-green-600' : 'text-red-600'}>
                    {dashboardData.performance.error_rate <= 1 ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Core Web Vitals</h3>
          
          <div className="space-y-4">
            {dashboardData.performance.web_vitals.lcp && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Largest Contentful Paint</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">
                    {dashboardData.performance.web_vitals.lcp.toFixed(2)}ms
                  </span>
                  <Badge className={
                    dashboardData.performance.web_vitals.lcp <= 2500 ? 'bg-green-100 text-green-800' :
                    dashboardData.performance.web_vitals.lcp <= 4000 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {dashboardData.performance.web_vitals.lcp <= 2500 ? 'GOOD' : 
                     dashboardData.performance.web_vitals.lcp <= 4000 ? 'NEEDS IMPROVEMENT' : 'POOR'}
                  </Badge>
                </div>
              </div>
            )}

            {dashboardData.performance.web_vitals.fid && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">First Input Delay</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">
                    {dashboardData.performance.web_vitals.fid.toFixed(2)}ms
                  </span>
                  <Badge className={
                    dashboardData.performance.web_vitals.fid <= 100 ? 'bg-green-100 text-green-800' :
                    dashboardData.performance.web_vitals.fid <= 300 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {dashboardData.performance.web_vitals.fid <= 100 ? 'GOOD' : 
                     dashboardData.performance.web_vitals.fid <= 300 ? 'NEEDS IMPROVEMENT' : 'POOR'}
                  </Badge>
                </div>
              </div>
            )}

            {dashboardData.performance.web_vitals.cls && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cumulative Layout Shift</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">
                    {dashboardData.performance.web_vitals.cls.toFixed(3)}
                  </span>
                  <Badge className={
                    dashboardData.performance.web_vitals.cls <= 0.1 ? 'bg-green-100 text-green-800' :
                    dashboardData.performance.web_vitals.cls <= 0.25 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {dashboardData.performance.web_vitals.cls <= 0.1 ? 'GOOD' : 
                     dashboardData.performance.web_vitals.cls <= 0.25 ? 'NEEDS IMPROVEMENT' : 'POOR'}
                  </Badge>
                </div>
              </div>
            )}

            {!dashboardData.performance.web_vitals.lcp && 
             !dashboardData.performance.web_vitals.fid && 
             !dashboardData.performance.web_vitals.cls && (
              <p className="text-gray-500 text-center py-4">
                No Web Vitals data available yet
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* User Activity & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">👥 User Activity</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Interactions</span>
              <span className="font-semibold">{dashboardData.user_activity.total_interactions}</span>
            </div>

            {dashboardData.user_activity.top_components.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Most Active Components</h4>
                <div className="space-y-1">
                  {dashboardData.user_activity.top_components.slice(0, 3).map((comp, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{comp.component}</span>
                      <span className="font-medium">{comp.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardData.user_activity.top_actions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Actions</h4>
                <div className="space-y-1">
                  {dashboardData.user_activity.top_actions.slice(0, 3).map((action, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{action.action}</span>
                      <span className="font-medium">{action.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">🔒 Security Overview</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Security Events</span>
              <span className="font-semibold">{dashboardData.security.total_events}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Critical Events</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{dashboardData.security.critical_events}</span>
                {dashboardData.security.critical_events > 0 && (
                  <Badge className="bg-red-100 text-red-800">⚠️ ALERT</Badge>
                )}
              </div>
            </div>

            {dashboardData.security.event_types.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Event Types</h4>
                <div className="space-y-1">
                  {dashboardData.security.event_types.map((eventType, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{eventType.type}</span>
                      <span className="font-medium">{eventType.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Apple CTO Phase 3D Enterprise Monitoring • Last refresh: {lastUpdate?.toLocaleString()}
      </div>
    </div>
  );
};

export default MonitoringDashboard;