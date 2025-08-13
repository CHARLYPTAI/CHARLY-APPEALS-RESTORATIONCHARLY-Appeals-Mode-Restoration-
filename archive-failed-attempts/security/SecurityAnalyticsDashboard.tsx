/**
 * CHARLY 2.0 - Security Analytics Dashboard
 * Real-time security monitoring, threat detection, and compliance analytics
 * Apple CTO Enterprise Security Standards
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from '../../hooks/useFramerMotionLite';
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, Lock,
  Users, Activity, Globe, Database, Clock,
  TrendingUp, TrendingDown, Download,
  RefreshCw, CheckCircle, MapPin, Key
} from 'lucide-react';

// Import security managers
import { SecurityMonitor } from '../../security/SecurityMonitor';
// import { AuthenticationManager } from '../../security/AuthenticationManager';
// import { MFAManager } from '../../security/MFAManager';
import { RBACManager } from '../../security/RBACManager';
import { APISecurityManager } from '../../security/APISecurityManager';
// import { DataProtectionManager } from '../../security/DataProtection';

interface SecurityMetric {
  id: string;
  title: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  icon: React.ElementType;
  color: string;
  target?: number;
  unit?: string;
}

interface ThreatEvent {
  id: string;
  type: 'brute_force' | 'sql_injection' | 'xss_attempt' | 'malware' | 'ddos' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  source: string;
  target: string;
  status: 'active' | 'mitigated' | 'investigating' | 'resolved';
  description: string;
  riskScore: number;
  location?: {
    country: string;
    city: string;
  };
}

interface ComplianceMetric {
  framework: string;
  score: number;
  lastAudit: Date;
  issues: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  requirements: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
  };
}

interface UserSecurityAnalytics {
  activeUsers: number;
  suspiciousActivity: number;
  failedLogins: number;
  mfaAdoption: number;
  privilegedUsers: number;
  sessionSecurity: number;
}

interface GeolocationThreat {
  country: string;
  threatCount: number;
  threatTypes: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const SecurityAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'threats' | 'compliance' | 'users'>('overview');
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Initialize security managers
  const securityMonitor = useMemo(() => new SecurityMonitor(), []);
  // const authManager = useMemo(() => new AuthenticationManager(), []);
  // const mfaManager = useMemo(() => new MFAManager(), []);
  const rbacManager = useMemo(() => new RBACManager(), []);
  const apiSecurity = useMemo(() => new APISecurityManager(), []);
  // const dataProtection = useMemo(() => new DataProtectionManager(), []);

  // Security metrics state
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetric[]>([
    {
      id: 'threat-detection',
      title: 'Threats Detected',
      value: 23,
      change: -15.2,
      trend: 'down',
      status: 'good',
      icon: ShieldAlert,
      color: 'text-red-600',
      unit: 'events'
    },
    {
      id: 'security-score',
      title: 'Security Score',
      value: '94.7%',
      change: 2.1,
      trend: 'up',
      status: 'good',
      icon: Shield,
      color: 'text-green-600',
      target: 95
    },
    {
      id: 'active-sessions',
      title: 'Active Sessions',
      value: 847,
      change: 8.3,
      trend: 'up',
      status: 'good',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 'failed-logins',
      title: 'Failed Logins',
      value: 156,
      change: -22.4,
      trend: 'down',
      status: 'good',
      icon: Lock,
      color: 'text-orange-600'
    },
    {
      id: 'api-security',
      title: 'API Security',
      value: '99.1%',
      change: 0.3,
      trend: 'up',
      status: 'good',
      icon: Database,
      color: 'text-purple-600',
      target: 99
    },
    {
      id: 'compliance-score',
      title: 'Compliance Score',
      value: '96.8%',
      change: 1.2,
      trend: 'up',
      status: 'good',
      icon: CheckCircle,
      color: 'text-emerald-600',
      target: 95
    }
  ]);

  // Threat events state
  const [threatEvents] = useState<ThreatEvent[]>([
    {
      id: 'threat-001',
      type: 'brute_force',
      severity: 'high',
      timestamp: new Date(Date.now() - 300000),
      source: '192.168.1.100',
      target: '/api/auth/login',
      status: 'mitigated',
      description: 'Multiple failed login attempts detected',
      riskScore: 85,
      location: { country: 'Unknown', city: 'Unknown' }
    },
    {
      id: 'threat-002',
      type: 'sql_injection',
      severity: 'critical',
      timestamp: new Date(Date.now() - 600000),
      source: '203.45.12.78',
      target: '/api/properties/search',
      status: 'investigating',
      description: 'SQL injection attempt in search parameters',
      riskScore: 95,
      location: { country: 'Russia', city: 'Moscow' }
    },
    {
      id: 'threat-003',
      type: 'unauthorized_access',
      severity: 'medium',
      timestamp: new Date(Date.now() - 900000),
      source: '10.0.0.45',
      target: '/api/admin/users',
      status: 'resolved',
      description: 'Unauthorized access attempt to admin endpoint',
      riskScore: 65,
      location: { country: 'USA', city: 'San Francisco' }
    }
  ]);

  // Compliance metrics state
  const [complianceMetrics] = useState<ComplianceMetric[]>([
    {
      framework: 'SOC 2 Type II',
      score: 96.8,
      lastAudit: new Date(Date.now() - 2592000000), // 30 days ago
      issues: 3,
      status: 'compliant',
      requirements: { total: 150, passed: 145, failed: 3, pending: 2 }
    },
    {
      framework: 'GDPR',
      score: 94.2,
      lastAudit: new Date(Date.now() - 1728000000), // 20 days ago
      issues: 5,
      status: 'compliant',
      requirements: { total: 99, passed: 93, failed: 4, pending: 2 }
    },
    {
      framework: 'ISO 27001',
      score: 91.5,
      lastAudit: new Date(Date.now() - 5184000000), // 60 days ago
      issues: 8,
      status: 'partial',
      requirements: { total: 114, passed: 104, failed: 6, pending: 4 }
    }
  ]);

  // User security analytics
  const [userAnalytics, setUserAnalytics] = useState<UserSecurityAnalytics>({
    activeUsers: 847,
    suspiciousActivity: 12,
    failedLogins: 156,
    mfaAdoption: 89.4,
    privilegedUsers: 23,
    sessionSecurity: 96.2
  });

  // Geographic threat data
  const [geoThreats] = useState<GeolocationThreat[]>([
    { country: 'Russia', threatCount: 45, threatTypes: ['brute_force', 'sql_injection'], riskLevel: 'high' },
    { country: 'China', threatCount: 32, threatTypes: ['ddos', 'malware'], riskLevel: 'high' },
    { country: 'Unknown', threatCount: 28, threatTypes: ['brute_force', 'unauthorized_access'], riskLevel: 'medium' },
    { country: 'USA', threatCount: 15, threatTypes: ['xss_attempt'], riskLevel: 'low' }
  ]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time security metric updates
      setSecurityMetrics(prev => prev.map(metric => ({
        ...metric,
        value: typeof metric.value === 'number' 
          ? Math.max(0, metric.value + Math.floor((Math.random() - 0.5) * 10))
          : metric.value,
        change: metric.change + (Math.random() - 0.5) * 2
      })));

      // Update user analytics
      setUserAnalytics(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor((Math.random() - 0.5) * 20),
        suspiciousActivity: Math.max(0, prev.suspiciousActivity + Math.floor((Math.random() - 0.6) * 3)),
        failedLogins: Math.max(0, prev.failedLogins + Math.floor((Math.random() - 0.7) * 5))
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Refresh security data from managers
      await Promise.all([
        securityMonitor.getRecentEvents(100),
        apiSecurity.getSecurityMetrics(),
        rbacManager.getAuditLog('security_event', 50)
      ]);
      
      // Simulate data refresh delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Failed to refresh security data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'json') => {
    console.log(`Exporting security analytics as ${format}`);
    // Implementation for export functionality
  };

  const getThreatColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const SecurityMetricCard: React.FC<{ metric: SecurityMetric }> = ({ metric }) => (
    <motion.div
      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
      whileHover="scaleIn"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gray-50 ${metric.color}`}>
          <metric.icon size={24} />
        </div>
        <div className={`flex items-center text-sm font-medium ${getStatusColor(metric.status)}`}>
          {metric.trend === 'up' ? <TrendingUp size={16} /> : metric.trend === 'down' ? <TrendingDown size={16} /> : null}
          {Math.abs(metric.change).toFixed(1)}%
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
        <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
        {metric.target && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Target: {metric.target}{metric.unit || '%'}</span>
              <span>{typeof metric.value === 'string' ? metric.value : `${((metric.value / metric.target) * 100).toFixed(1)}%`}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  metric.status === 'good' ? 'bg-green-500' :
                  metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min(100, typeof metric.value === 'number' ? (metric.value / metric.target) * 100 : 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const ThreatEventCard: React.FC<{ threat: ThreatEvent }> = ({ threat }) => (
    <motion.div
      className={`p-4 rounded-lg border ${getThreatColor(threat.severity)} transition-all duration-200`}
      initial="slideOutDown"
      animate="slideInUp"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert size={16} />
          <span className="font-medium capitalize">{threat.type.replace('_', ' ')}</span>
          <span className={`px-2 py-1 text-xs rounded ${getThreatColor(threat.severity)}`}>
            {threat.severity.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Clock size={12} />
          {threat.timestamp.toLocaleTimeString()}
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-2">{threat.description}</p>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span>Source: {threat.source}</span>
          <span>Risk: {threat.riskScore}/100</span>
          {threat.location && (
            <span className="flex items-center space-x-1">
              <MapPin size={10} />
              <span>{threat.location.country}</span>
            </span>
          )}
        </div>
        <span className={`px-2 py-1 rounded ${
          threat.status === 'resolved' ? 'bg-green-100 text-green-700' :
          threat.status === 'mitigated' ? 'bg-blue-100 text-blue-700' :
          threat.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {threat.status.toUpperCase()}
        </span>
      </div>
    </motion.div>
  );

  const ComplianceCard: React.FC<{ compliance: ComplianceMetric }> = ({ compliance }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{compliance.framework}</h4>
        <span className={`px-2 py-1 text-xs rounded ${
          compliance.status === 'compliant' ? 'bg-green-100 text-green-700' :
          compliance.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {compliance.status.toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Score</span>
          <span className="font-semibold text-lg">{compliance.score.toFixed(1)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              compliance.score >= 95 ? 'bg-green-500' :
              compliance.score >= 85 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${compliance.score}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Passed</span>
            <p className="font-semibold text-green-600">{compliance.requirements.passed}</p>
          </div>
          <div>
            <span className="text-gray-500">Failed</span>
            <p className="font-semibold text-red-600">{compliance.requirements.failed}</p>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Last audit: {compliance.lastAudit.toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  const filteredThreats = threatEvents.filter(threat => 
    alertFilter === 'all' || threat.severity === alertFilter
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Shield className="text-blue-600" size={32} />
              <span>Security Analytics Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">Real-time security monitoring, threat detection, and compliance analytics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportReport('pdf')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Export Security Report"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg p-1 border border-gray-200">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Security Overview', icon: Shield },
              { id: 'threats', label: 'Threat Detection', icon: ShieldAlert },
              { id: 'compliance', label: 'Compliance', icon: CheckCircle },
              { id: 'users', label: 'User Security', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as 'overview' | 'threats' | 'compliance' | 'users')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedView === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <>
            {/* Security Metrics Grid */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Metrics Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {securityMetrics.map(metric => (
                  <SecurityMetricCard key={metric.id} metric={metric} />
                ))}
              </div>
            </div>

            {/* Real-time Security Status */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Security Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <ShieldCheck size={48} className="text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Secure</h3>
                  <p className="text-sm text-gray-600">All systems operational</p>
                </div>
                <div className="text-center">
                  <Activity size={48} className="text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Monitoring</h3>
                  <p className="text-sm text-gray-600">{userAnalytics.activeUsers} active sessions</p>
                </div>
                <div className="text-center">
                  <Globe size={48} className="text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Global Protection</h3>
                  <p className="text-sm text-gray-600">24/7 threat monitoring</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Threats Tab */}
        {selectedView === 'threats' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Threat Detection & Response</h2>
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as 'all' | 'critical' | 'high' | 'medium' | 'low')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Threats</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredThreats.map(threat => (
                <ThreatEventCard key={threat.id} threat={threat} />
              ))}
            </div>

            {/* Geographic Threat Map */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Threat Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {geoThreats.map((geo, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{geo.country}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        geo.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                        geo.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                        geo.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {geo.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{geo.threatCount} threats</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {geo.threatTypes.map((type, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Compliance Tab */}
        {selectedView === 'compliance' && (
          <>
            <h2 className="text-xl font-semibold text-gray-900">Compliance & Audit Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complianceMetrics.map((compliance, index) => (
                <ComplianceCard key={index} compliance={compliance} />
              ))}
            </div>
          </>
        )}

        {/* Users Tab */}
        {selectedView === 'users' && (
          <>
            <h2 className="text-xl font-semibold text-gray-900">User Security Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="text-blue-600" size={24} />
                  <h3 className="font-semibold text-gray-900">Active Users</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{userAnalytics.activeUsers}</p>
                <p className="text-sm text-gray-600">Currently online</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Key className="text-green-600" size={24} />
                  <h3 className="font-semibold text-gray-900">MFA Adoption</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{userAnalytics.mfaAdoption.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${userAnalytics.mfaAdoption}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="text-yellow-600" size={24} />
                  <h3 className="font-semibold text-gray-900">Suspicious Activity</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{userAnalytics.suspiciousActivity}</p>
                <p className="text-sm text-gray-600">Events detected</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityAnalyticsDashboard;