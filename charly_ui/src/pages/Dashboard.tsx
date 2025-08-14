// 🍎 Dashboard Page - Apple Data Excellence
// "Design is not just what it looks like - design is how it works" - Steve Jobs

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { LoadingDots } from '../components/LoadingDots';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { authenticatedRequest } from '../lib/auth';

interface KPIData {
  estimated_savings: number;
  open_appeals: number;
  upcoming_deadlines: number;
  appeals_won: number;
}

interface RecentActivity {
  id: string;
  message: string;
  timestamp: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
}

interface DashboardAnalytics {
  totalProperties: number;
  totalSavings: number;
  appealsWon: number;
  successRate: number;
  financialMetrics: Array<{
    category: string;
    value: number;
    trend: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    appeals: number;
    savings: number;
  }>;
}

interface PropertyOverview {
  id: string;
  address: string;
  city: string;
  state: string;
  status: string;
  current_assessment: number;
  potential_savings?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [properties, setProperties] = useState<PropertyOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Dashboard: Starting to load KPIs...');
      
      // Load multiple endpoints in parallel for comprehensive dashboard
      const [kpiResponse, activityResponse, insightsResponse, analyticsResponse, portfolioResponse] = await Promise.all([
        fetch('http://localhost:8001/api/kpis'),
        fetch('http://localhost:8001/api/dashboard/recent-activity'),
        fetch('http://localhost:8001/api/dashboard/ai-insights'), 
        fetch('http://localhost:8001/api/dashboard/analytics'),
        fetch('http://localhost:8001/api/portfolio/')
      ]);
      
      console.log('📊 Dashboard: API Responses:', {
        kpis: kpiResponse.status,
        activity: activityResponse.status,
        insights: insightsResponse.status,
        analytics: analyticsResponse.status,
        portfolio: portfolioResponse.status
      });
      
      if (!kpiResponse.ok) {
        console.error('❌ Dashboard: KPI Response failed:', kpiResponse.status, kpiResponse.statusText);
        throw new Error(`Failed to load KPIs: ${kpiResponse.status} ${kpiResponse.statusText}`);
      }
      
      const kpiData = await kpiResponse.json();
      console.log('✅ Dashboard: KPI Data loaded:', kpiData);
      setKpis(kpiData);
      
      // Load additional data for comprehensive dashboard
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
      
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setAiInsights(insightsData.keyFindings || []);
      }
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
      
      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setProperties(portfolioData.properties || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-property':
        navigate('/portfolio');
        break;
      case 'generate-appeal':
        navigate('/appeals');
        break;
      case 'market-analysis':
        navigate('/analysis');
        break;
      case 'deadlines':
        // TODO: Implement deadlines modal or specific view
        alert('Deadlines feature coming soon!');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Unable to Load Dashboard</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button 
            style={styles.retryButton}
            onClick={loadKPIs}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>
            Your property tax appeal performance at a glance
          </p>
        </div>
        
        {!loading && kpis && (
          <button 
            style={styles.refreshButton}
            onClick={loadKPIs}
            title="Refresh data"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23,4 23,10 17,10" />
              <polyline points="1,20 1,14 7,14" />
              <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15" />
            </svg>
          </button>
        )}
      </div>

      {/* KPI Grid */}
      <div style={styles.kpiGrid}>
        <StatCard
          label="Estimated Savings"
          value={kpis ? formatCurrency(kpis.estimated_savings) : '$0'}
          color="green"
          subtitle="Potential tax reductions identified"
          loading={loading}
        />
        
        <StatCard
          label="Appeals Won"
          value={kpis?.appeals_won || 0}
          color="green"
          subtitle="Successful appeal outcomes"
          loading={loading}
        />
        
        <StatCard
          label="Open Appeals"
          value={kpis?.open_appeals || 0}
          color="blue"
          subtitle="Active appeals in progress"
          loading={loading}
        />
        
        <StatCard
          label="Upcoming Deadlines"
          value={kpis?.upcoming_deadlines || 0}
          color="orange"
          subtitle="Appeals requiring attention"
          loading={loading}
        />
      </div>

      {/* Property Overview Section */}
      <div style={styles.propertyOverviewSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Property Overview</h2>
          <button 
            style={styles.viewAllButton}
            onClick={() => navigate('/portfolio')}
          >
            View All Properties
          </button>
        </div>
        {properties.length > 0 ? (
          <div style={styles.propertyGrid}>
            {properties.slice(0, 3).map((property) => (
              <div key={property.id} style={styles.propertyOverviewCard}>
                <div style={styles.propertyHeader}>
                  <div style={styles.propertyAddress}>
                    {property.address}
                  </div>
                  <div style={styles.propertyLocation}>
                    {property.city}, {property.state}
                  </div>
                </div>
                <div style={styles.propertyMetrics}>
                  <div style={styles.propertyMetric}>
                    <span style={styles.propertyMetricLabel}>Assessment</span>
                    <span style={styles.propertyMetricValue}>
                      {formatCurrency(property.current_assessment)}
                    </span>
                  </div>
                  {property.potential_savings && (
                    <div style={styles.propertyMetric}>
                      <span style={styles.propertyMetricLabel}>Potential Savings</span>
                      <span style={styles.propertyMetricValue}>
                        {formatCurrency(property.potential_savings)}
                      </span>
                    </div>
                  )}
                </div>
                <div style={styles.propertyStatus}>
                  <div style={styles.statusBadge(property.status)}>
                    {property.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyPropertyState}>
            <div style={styles.emptyPropertyIcon}>🏢</div>
            <h3 style={styles.emptyPropertyTitle}>No Properties Yet</h3>
            <p style={styles.emptyPropertyText}>
              Add your first property to start tracking appeals and savings
            </p>
            <button 
              style={styles.addPropertyButton}
              onClick={() => handleQuickAction('add-property')}
            >
              Add Your First Property
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div style={styles.activitySection}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div style={styles.activityList}>
            {recentActivity.map((activity) => (
              <div key={activity.id} style={styles.activityItem}>
                <div style={styles.activityIcon(activity.severity)}>
                  {activity.severity === 'success' ? '✓' : 
                   activity.severity === 'warning' ? '⚠' :
                   activity.severity === 'error' ? '✕' : 'ℹ'}
                </div>
                <div style={styles.activityContent}>
                  <p style={styles.activityMessage}>{activity.message}</p>
                  <p style={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={NEUTRAL_COLORS.GRAY_600} strokeWidth="1">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            <p style={styles.emptyStateText}>
              No recent activity
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div style={styles.quickActionsSection}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.quickActionsGrid}>
          <div 
            style={styles.quickActionCard} 
            onClick={() => handleQuickAction('add-property')}
          >
            <div style={styles.quickActionIcon('blue')}>+</div>
            <h3 style={styles.quickActionTitle}>Add Property</h3>
            <p style={styles.quickActionDescription}>Add a new property to your portfolio</p>
          </div>
          
          <div 
            style={styles.quickActionCard}
            onClick={() => handleQuickAction('generate-appeal')}
          >
            <div style={styles.quickActionIcon('green')}>⚡</div>
            <h3 style={styles.quickActionTitle}>Generate Appeal</h3>
            <p style={styles.quickActionDescription}>Create an appeal for over-assessed properties</p>
          </div>
          
          <div 
            style={styles.quickActionCard}
            onClick={() => handleQuickAction('market-analysis')}
          >
            <div style={styles.quickActionIcon('orange')}>📊</div>
            <h3 style={styles.quickActionTitle}>Market Analysis</h3>
            <p style={styles.quickActionDescription}>View detailed market trends and insights</p>
          </div>
          
          <div 
            style={styles.quickActionCard}
            onClick={() => handleQuickAction('deadlines')}
          >
            <div style={styles.quickActionIcon('red')}>⏰</div>
            <h3 style={styles.quickActionTitle}>Deadlines</h3>
            <p style={styles.quickActionDescription}>Check upcoming filing deadlines</p>
          </div>
        </div>
      </div>

      {/* Performance Overview Section */}
      {analytics && (
        <div style={styles.performanceSection}>
          <h2 style={styles.sectionTitle}>Performance Overview</h2>
          <div style={styles.performanceGrid}>
            {/* Financial Metrics */}
            <div style={styles.performanceCard}>
              <h3 style={styles.performanceTitle}>Financial Performance</h3>
              <div style={styles.metricsGrid}>
                {analytics.financialMetrics.map((metric, index) => (
                  <div key={index} style={styles.metricItem}>
                    <div style={styles.metricValue}>
                      {formatCurrency(metric.value)}
                    </div>
                    <div style={styles.metricLabel}>{metric.category}</div>
                    <div style={styles.metricTrend(metric.trend > 0)}>
                      {metric.trend > 0 ? '↗' : '↘'} {metric.trend}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trends */}
            <div style={styles.performanceCard}>
              <h3 style={styles.performanceTitle}>Monthly Trends</h3>
              <div style={styles.trendsContainer}>
                {analytics.monthlyTrends.map((month, index) => (
                  <div key={index} style={styles.trendItem}>
                    <div style={styles.trendMonth}>{month.month}</div>
                    <div style={styles.trendBar}>
                      <div 
                        style={{
                          ...styles.trendBarFill,
                          width: `${Math.min(100, (month.savings / 800000) * 100)}%`
                        }}
                      />
                    </div>
                    <div style={styles.trendValue}>
                      {formatCurrency(month.savings)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Rate Chart */}
            <div style={styles.performanceCard}>
              <h3 style={styles.performanceTitle}>Success Metrics</h3>
              <div style={styles.successMetrics}>
                <div style={styles.successCircle}>
                  <div style={styles.successPercentage}>
                    {analytics.successRate}%
                  </div>
                  <div style={styles.successLabel}>Success Rate</div>
                </div>
                <div style={styles.successStats}>
                  <div style={styles.successStat}>
                    <span style={styles.successStatValue}>{analytics.appealsWon}</span>
                    <span style={styles.successStatLabel}>Appeals Won</span>
                  </div>
                  <div style={styles.successStat}>
                    <span style={styles.successStatValue}>{analytics.totalProperties}</span>
                    <span style={styles.successStatLabel}>Total Properties</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Section */}
      {aiInsights.length > 0 && (
        <div style={styles.insightsSection}>
          <h2 style={styles.sectionTitle}>AI Insights</h2>
          <div style={styles.insightsGrid}>
            {aiInsights.map((insight) => (
              <div key={insight.id} style={styles.insightCard}>
                <div style={styles.insightHeader}>
                  <h3 style={styles.insightTitle}>{insight.title}</h3>
                  <div style={styles.confidenceBadge}>
                    {Math.round(insight.confidence * 100)}% confidence
                  </div>
                </div>
                <p style={styles.insightDescription}>{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: SPACING.LG,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.XXL,
  },

  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.XS,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  subtitle: {
    fontSize: '18px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    fontWeight: 400,
  },

  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.SM,
    backgroundColor: 'transparent',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '8px',
    color: NEUTRAL_COLORS.GRAY_600,
    cursor: 'pointer',
    transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    
    ':hover': {
      backgroundColor: NEUTRAL_COLORS.GRAY_50,
      transform: 'rotate(90deg)',
    },
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: SPACING.LG,
    marginBottom: SPACING.XXL,
  },

  // Section Header Styles
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },

  viewAllButton: {
    backgroundColor: 'transparent',
    color: APPLE_COLORS.BLUE,
    border: `1px solid ${APPLE_COLORS.BLUE}`,
    borderRadius: '6px',
    padding: `${SPACING.XS} ${SPACING.SM}`,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    
    ':hover': {
      backgroundColor: APPLE_COLORS.BLUE,
      color: NEUTRAL_COLORS.WHITE,
    },
  },

  // Property Overview Styles
  propertyOverviewSection: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    marginBottom: SPACING.XXL,
  },

  propertyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: SPACING.LG,
  },

  propertyOverviewCard: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '8px',
    padding: SPACING.LG,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    cursor: 'pointer',
    
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      backgroundColor: NEUTRAL_COLORS.WHITE,
    },
  },

  propertyHeader: {
    marginBottom: SPACING.SM,
  },

  propertyAddress: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    marginBottom: '4px',
  },

  propertyLocation: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
  },

  propertyMetrics: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.XS,
    marginBottom: SPACING.SM,
  },

  propertyMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  propertyMetricLabel: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_600,
  },

  propertyMetricValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
  },

  propertyStatus: {
    display: 'flex',
    justifyContent: 'flex-end',
  },

  statusBadge: (status: string) => ({
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: '12px',
    backgroundColor:
      status === 'Won' ? `${APPLE_COLORS.GREEN}15` :
      status === 'Appeal Filed' ? `${APPLE_COLORS.BLUE}15` :
      status === 'Under Review' ? `${APPLE_COLORS.ORANGE}15` :
      `${NEUTRAL_COLORS.GRAY_600}15`,
    color:
      status === 'Won' ? APPLE_COLORS.GREEN :
      status === 'Appeal Filed' ? APPLE_COLORS.BLUE :
      status === 'Under Review' ? APPLE_COLORS.ORANGE :
      NEUTRAL_COLORS.GRAY_600,
  }),

  // Empty Property State
  emptyPropertyState: {
    textAlign: 'center' as const,
    padding: SPACING.XXL,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.LG,
  },

  emptyPropertyIcon: {
    fontSize: '48px',
    marginBottom: SPACING.SM,
  },

  emptyPropertyTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
  },

  emptyPropertyText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    lineHeight: 1.5,
  },

  addPropertyButton: {
    backgroundColor: APPLE_COLORS.BLUE,
    color: NEUTRAL_COLORS.WHITE,
    border: 'none',
    borderRadius: '8px',
    padding: `${SPACING.SM} ${SPACING.LG}`,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    
    ':hover': {
      backgroundColor: APPLE_COLORS.BLUE,
      transform: 'translateY(-1px)',
    },
  },

  activitySection: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  sectionTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  emptyState: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.SM,
    padding: SPACING.XXL,
  },

  emptyStateText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  errorCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${APPLE_COLORS.RED}20`,
    textAlign: 'center' as const,
    maxWidth: '500px',
    margin: '0 auto',
  },

  errorTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: APPLE_COLORS.RED,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  errorMessage: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  retryButton: {
    backgroundColor: APPLE_COLORS.BLUE,
    color: NEUTRAL_COLORS.WHITE,
    border: 'none',
    borderRadius: '8px',
    padding: `${SPACING.SM} ${SPACING.LG}`,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  },

  // Activity Styles
  activityList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.SM,
  },

  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: SPACING.SM,
    padding: SPACING.SM,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '8px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  activityIcon: (severity: string) => ({
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
    backgroundColor: 
      severity === 'success' ? APPLE_COLORS.GREEN :
      severity === 'warning' ? APPLE_COLORS.ORANGE :
      severity === 'error' ? APPLE_COLORS.RED :
      APPLE_COLORS.BLUE,
    color: NEUTRAL_COLORS.WHITE,
  }),

  activityContent: {
    flex: 1,
  },

  activityMessage: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: '4px',
    fontWeight: 500,
  },

  activityTime: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  // Quick Actions Styles
  quickActionsSection: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    marginTop: SPACING.XXL,
  },

  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACING.LG,
  },

  quickActionCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    padding: SPACING.LG,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '8px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    cursor: 'pointer',
    transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      backgroundColor: NEUTRAL_COLORS.WHITE,
    },
  },

  quickActionIcon: (color: string) => ({
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: SPACING.SM,
    backgroundColor:
      color === 'blue' ? APPLE_COLORS.BLUE :
      color === 'green' ? APPLE_COLORS.GREEN :
      color === 'orange' ? APPLE_COLORS.ORANGE :
      color === 'red' ? APPLE_COLORS.RED :
      APPLE_COLORS.BLUE,
    color: NEUTRAL_COLORS.WHITE,
  }),

  quickActionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: '4px',
  },

  quickActionDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    lineHeight: 1.4,
  },

  // Insights Styles
  insightsSection: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    marginTop: SPACING.XXL,
  },

  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: SPACING.LG,
  },

  insightCard: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '8px',
    padding: SPACING.LG,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  insightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
    gap: SPACING.SM,
  },

  insightTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    flex: 1,
  },

  confidenceBadge: {
    fontSize: '12px',
    fontWeight: 500,
    color: APPLE_COLORS.GREEN,
    backgroundColor: `${APPLE_COLORS.GREEN}15`,
    padding: '4px 8px',
    borderRadius: '12px',
    flexShrink: 0,
  },

  insightDescription: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_700,
    margin: 0,
    lineHeight: 1.4,
  },

  // Performance Overview Styles
  performanceSection: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    marginTop: SPACING.XXL,
  },

  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: SPACING.LG,
  },

  performanceCard: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '8px',
    padding: SPACING.LG,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  performanceTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  // Financial Metrics Styles
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACING.SM,
  },

  metricItem: {
    textAlign: 'center' as const,
    padding: SPACING.SM,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '6px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  metricValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: APPLE_COLORS.GREEN,
    marginBottom: '4px',
  },

  metricLabel: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_600,
    marginBottom: '4px',
  },

  metricTrend: (positive: boolean) => ({
    fontSize: '12px',
    fontWeight: 600,
    color: positive ? APPLE_COLORS.GREEN : APPLE_COLORS.RED,
  }),

  // Monthly Trends Styles
  trendsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.SM,
  },

  trendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
  },

  trendMonth: {
    fontSize: '14px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_900,
    minWidth: '40px',
  },

  trendBar: {
    flex: 1,
    height: '8px',
    backgroundColor: NEUTRAL_COLORS.GRAY_100,
    borderRadius: '4px',
    overflow: 'hidden',
  },

  trendBarFill: {
    height: '100%',
    backgroundColor: APPLE_COLORS.BLUE,
    borderRadius: '4px',
    transition: 'width 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  },

  trendValue: {
    fontSize: '12px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_700,
    minWidth: '80px',
    textAlign: 'right' as const,
  },

  // Success Metrics Styles
  successMetrics: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.LG,
  },

  successCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: `${APPLE_COLORS.GREEN}20`,
    border: `4px solid ${APPLE_COLORS.GREEN}`,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  successPercentage: {
    fontSize: '28px',
    fontWeight: 700,
    color: APPLE_COLORS.GREEN,
    lineHeight: 1,
  },

  successLabel: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_600,
    marginTop: '4px',
  },

  successStats: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.SM,
    flex: 1,
  },

  successStat: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: SPACING.SM,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '6px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  successStatValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: NEUTRAL_COLORS.GRAY_900,
    lineHeight: 1,
  },

  successStatLabel: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_600,
    marginTop: '4px',
  },
} as const;

export default Dashboard;