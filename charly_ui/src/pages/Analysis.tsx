// 🍎 Analysis Page - Market Intelligence & Property Analytics Excellence
// "The desktop metaphor of today is the doorway to the information superhighway of tomorrow" - Steve Jobs

import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { LoadingDots } from '../components/LoadingDots';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';
import { authenticatedRequest } from '../lib/auth';

// Analysis Data Structures
interface MarketData {
  averageAssessment: number;
  medianAssessment: number;
  assessmentGrowth: number;
  appealSuccessRate: number;
  averageSavings: number;
  totalProperties: number;
}

interface PropertyComparison {
  id: string;
  address: string;
  assessment: number;
  marketValue: number;
  ratio: number;
  appealStatus: 'None' | 'Filed' | 'Won' | 'Lost';
  potentialSavings: number;
}

interface TrendData {
  year: number;
  assessments: number;
  appeals: number;
  successRate: number;
  avgSavings: number;
}

interface NeighborhoodAnalysis {
  name: string;
  avgAssessment: number;
  overAssessedPercent: number;
  appealSuccessRate: number;
  recommendedAction: 'Monitor' | 'Appeal' | 'Immediate Action';
}

const Analysis: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [comparisons, setComparisons] = useState<PropertyComparison[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparisons' | 'trends' | 'neighborhoods'>('overview');

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock market data
      setMarketData({
        averageAssessment: 425000,
        medianAssessment: 385000,
        assessmentGrowth: 8.5,
        appealSuccessRate: 73,
        averageSavings: 42000,
        totalProperties: 12847
      });

      // Mock property comparisons
      setComparisons([
        {
          id: '1',
          address: '123 Main St',
          assessment: 450000,
          marketValue: 420000,
          ratio: 1.07,
          appealStatus: 'None',
          potentialSavings: 30000
        },
        {
          id: '2', 
          address: '456 Oak Ave',
          assessment: 285000,
          marketValue: 265000,
          ratio: 1.08,
          appealStatus: 'Filed',
          potentialSavings: 20000
        },
        {
          id: '3',
          address: '789 Business Blvd',
          assessment: 1200000,
          marketValue: 950000,
          ratio: 1.26,
          appealStatus: 'Won',
          potentialSavings: 250000
        }
      ]);

      // Mock trend data
      setTrends([
        { year: 2020, assessments: 380000, appeals: 1250, successRate: 68, avgSavings: 35000 },
        { year: 2021, assessments: 405000, appeals: 1580, successRate: 71, avgSavings: 38000 },
        { year: 2022, assessments: 425000, appeals: 1820, successRate: 73, avgSavings: 42000 },
        { year: 2023, assessments: 462000, appeals: 2100, successRate: 75, avgSavings: 45000 },
        { year: 2024, assessments: 501000, appeals: 2350, successRate: 78, avgSavings: 48000 }
      ]);

      // Mock neighborhood data
      setNeighborhoods([
        {
          name: 'Downtown Austin',
          avgAssessment: 520000,
          overAssessedPercent: 34,
          appealSuccessRate: 82,
          recommendedAction: 'Appeal'
        },
        {
          name: 'South Austin',
          avgAssessment: 385000,
          overAssessedPercent: 28,
          appealSuccessRate: 76,
          recommendedAction: 'Monitor'
        },
        {
          name: 'East Austin',
          avgAssessment: 425000,
          overAssessedPercent: 45,
          appealSuccessRate: 89,
          recommendedAction: 'Immediate Action'
        }
      ]);

    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <LoadingDots size="lg" />
          <p style={styles.loadingText}>Analyzing market data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <MarketOverview data={marketData} />;
      case 'comparisons':
        return <PropertyComparisons comparisons={comparisons} />;
      case 'trends':
        return <MarketTrends trends={trends} />;
      case 'neighborhoods':
        return <NeighborhoodAnalysis neighborhoods={neighborhoods} />;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Market Overview', icon: '📊' },
    { id: 'comparisons' as const, label: 'Property Comparisons', icon: '🏘️' },
    { id: 'trends' as const, label: 'Market Trends', icon: '📈' },
    { id: 'neighborhoods' as const, label: 'Neighborhood Analysis', icon: '🗺️' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Market Analysis & Intelligence</h1>
        <p style={styles.subtitle}>
          Data-driven insights for property tax appeal strategy and market intelligence
        </p>
      </div>

      <div style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
              {isActive && <div style={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>

      <div style={styles.content}>
        {renderTabContent()}
      </div>
    </div>
  );
};

// Market Overview Component
interface MarketOverviewProps {
  data: MarketData | null;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ data }) => {
  if (!data) return null;

  const metrics = [
    {
      label: 'Average Assessment',
      value: `$${data.averageAssessment.toLocaleString()}`,
      change: `+${data.assessmentGrowth}%`,
      trend: 'up' as const,
      color: APPLE_COLORS.BLUE
    },
    {
      label: 'Appeal Success Rate',
      value: `${data.appealSuccessRate}%`,
      change: '+5%',
      trend: 'up' as const,
      color: APPLE_COLORS.GREEN
    },
    {
      label: 'Average Savings',
      value: `$${data.averageSavings.toLocaleString()}`,
      change: '+12%',
      trend: 'up' as const,
      color: APPLE_COLORS.GREEN
    },
    {
      label: 'Total Properties',
      value: data.totalProperties.toLocaleString(),
      change: '+3%',
      trend: 'up' as const,
      color: NEUTRAL_COLORS.GRAY_600
    }
  ];

  return (
    <div style={styles.tabContent}>
      <div style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <div key={index} style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>{metric.label}</span>
              <span style={{...styles.metricChange, color: metric.color}}>
                {metric.change}
              </span>
            </div>
            <div style={{...styles.metricValue, color: metric.color}}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.insightsSection}>
        <h3 style={styles.sectionTitle}>Market Insights</h3>
        <div style={styles.insightGrid}>
          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>🎯</div>
            <h4 style={styles.insightTitle}>High Appeal Success Rate</h4>
            <p style={styles.insightText}>
              Current appeal success rate of 73% is well above the national average of 60%. 
              This indicates favorable conditions for property tax appeals in your market.
            </p>
          </div>
          
          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>📊</div>
            <h4 style={styles.insightTitle}>Assessment Growth Trend</h4>
            <p style={styles.insightText}>
              Assessment growth of 8.5% exceeds typical market appreciation, suggesting 
              potential over-assessment opportunities for many properties.
            </p>
          </div>
          
          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>💰</div>
            <h4 style={styles.insightTitle}>Strong Savings Potential</h4>
            <p style={styles.insightText}>
              Average savings of $42,000 per successful appeal demonstrates significant 
              financial benefits for property owners who file appeals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Property Comparisons Component
interface PropertyComparisonsProps {
  comparisons: PropertyComparison[];
}

const PropertyComparisons: React.FC<PropertyComparisonsProps> = ({ comparisons }) => {
  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Property Assessment Comparisons</h3>
      <p style={styles.sectionDescription}>
        Compare property assessments to market values and identify appeal opportunities
      </p>
      
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableHeaderCell}>Property</th>
              <th style={styles.tableHeaderCell}>Assessment</th>
              <th style={styles.tableHeaderCell}>Market Value</th>
              <th style={styles.tableHeaderCell}>Ratio</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Potential Savings</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((property) => (
              <tr key={property.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{property.address}</td>
                <td style={styles.tableCell}>${property.assessment.toLocaleString()}</td>
                <td style={styles.tableCell}>${property.marketValue.toLocaleString()}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.ratioValue,
                    color: property.ratio > 1.1 ? APPLE_COLORS.RED : 
                           property.ratio > 1.05 ? APPLE_COLORS.ORANGE : APPLE_COLORS.GREEN
                  }}>
                    {property.ratio.toFixed(2)}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: property.appealStatus === 'Won' ? `${APPLE_COLORS.GREEN}20` :
                                   property.appealStatus === 'Filed' ? `${APPLE_COLORS.BLUE}20` :
                                   property.appealStatus === 'Lost' ? `${APPLE_COLORS.RED}20` : 
                                   `${NEUTRAL_COLORS.GRAY_200}`,
                    color: property.appealStatus === 'Won' ? APPLE_COLORS.GREEN :
                           property.appealStatus === 'Filed' ? APPLE_COLORS.BLUE :
                           property.appealStatus === 'Lost' ? APPLE_COLORS.RED :
                           NEUTRAL_COLORS.GRAY_600
                  }}>
                    {property.appealStatus}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <span style={{color: APPLE_COLORS.GREEN, fontWeight: 600}}>
                    ${property.potentialSavings.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Market Trends Component
interface MarketTrendsProps {
  trends: TrendData[];
}

const MarketTrends: React.FC<MarketTrendsProps> = ({ trends }) => {
  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>5-Year Market Trends</h3>
      <p style={styles.sectionDescription}>
        Historical analysis of assessments, appeals, and success rates
      </p>
      
      <div style={styles.trendsContainer}>
        <div style={styles.trendChart}>
          <h4 style={styles.chartTitle}>Average Assessment Trends</h4>
          <div style={styles.chartPlaceholder}>
            <div style={styles.chartIcon}>📈</div>
            <p style={styles.chartText}>Interactive chart showing assessment growth from $380K to $501K</p>
          </div>
        </div>
        
        <div style={styles.trendChart}>
          <h4 style={styles.chartTitle}>Appeal Success Rate</h4>
          <div style={styles.chartPlaceholder}>
            <div style={styles.chartIcon}>📊</div>
            <p style={styles.chartText}>Success rate trending upward from 68% to 78%</p>
          </div>
        </div>
      </div>

      <div style={styles.trendsTable}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableHeaderCell}>Year</th>
              <th style={styles.tableHeaderCell}>Avg Assessment</th>
              <th style={styles.tableHeaderCell}>Total Appeals</th>
              <th style={styles.tableHeaderCell}>Success Rate</th>
              <th style={styles.tableHeaderCell}>Avg Savings</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend) => (
              <tr key={trend.year} style={styles.tableRow}>
                <td style={styles.tableCell}>{trend.year}</td>
                <td style={styles.tableCell}>${trend.assessments.toLocaleString()}</td>
                <td style={styles.tableCell}>{trend.appeals.toLocaleString()}</td>
                <td style={styles.tableCell}>{trend.successRate}%</td>
                <td style={styles.tableCell}>${trend.avgSavings.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Neighborhood Analysis Component
interface NeighborhoodAnalysisProps {
  neighborhoods: NeighborhoodAnalysis[];
}

const NeighborhoodAnalysis: React.FC<NeighborhoodAnalysisProps> = ({ neighborhoods }) => {
  return (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>Neighborhood Market Analysis</h3>
      <p style={styles.sectionDescription}>
        Area-specific insights and recommended strategies by neighborhood
      </p>
      
      <div style={styles.neighborhoodGrid}>
        {neighborhoods.map((neighborhood, index) => (
          <div key={index} style={styles.neighborhoodCard}>
            <div style={styles.neighborhoodHeader}>
              <h4 style={styles.neighborhoodName}>{neighborhood.name}</h4>
              <span style={{
                ...styles.actionBadge,
                backgroundColor: neighborhood.recommendedAction === 'Immediate Action' ? `${APPLE_COLORS.RED}20` :
                               neighborhood.recommendedAction === 'Appeal' ? `${APPLE_COLORS.ORANGE}20` :
                               `${APPLE_COLORS.GREEN}20`,
                color: neighborhood.recommendedAction === 'Immediate Action' ? APPLE_COLORS.RED :
                       neighborhood.recommendedAction === 'Appeal' ? APPLE_COLORS.ORANGE :
                       APPLE_COLORS.GREEN
              }}>
                {neighborhood.recommendedAction}
              </span>
            </div>
            
            <div style={styles.neighborhoodMetrics}>
              <div style={styles.neighborhoodMetric}>
                <span style={styles.metricLabel}>Avg Assessment</span>
                <span style={styles.metricValue}>${neighborhood.avgAssessment.toLocaleString()}</span>
              </div>
              <div style={styles.neighborhoodMetric}>
                <span style={styles.metricLabel}>Over-Assessed</span>
                <span style={styles.metricValue}>{neighborhood.overAssessedPercent}%</span>
              </div>
              <div style={styles.neighborhoodMetric}>
                <span style={styles.metricLabel}>Success Rate</span>
                <span style={styles.metricValue}>{neighborhood.appealSuccessRate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: SPACING.LG,
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XXL,
  },

  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  subtitle: {
    fontSize: '18px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  tabBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING.SM,
    marginBottom: SPACING.XXL,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    paddingBottom: SPACING.SM,
  },

  tab: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.SM,
    padding: `${SPACING.MD} ${SPACING.LG}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,
    fontSize: '14px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  tabActive: {
    color: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}08`,
  },

  tabIcon: {
    fontSize: '18px',
  },

  tabLabel: {
    fontSize: '14px',
    fontWeight: 500,
  },

  activeIndicator: {
    position: 'absolute' as const,
    bottom: '-9px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '40px',
    height: '2px',
    backgroundColor: APPLE_COLORS.BLUE,
    borderRadius: '1px',
  },

  content: {
    minHeight: '600px',
  },

  tabContent: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.XXL,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: SPACING.LG,
  },

  loadingText: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACING.LG,
    marginBottom: SPACING.XXL,
  },

  metricCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },

  metricLabel: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontWeight: 500,
  },

  metricChange: {
    fontSize: '12px',
    fontWeight: 600,
  },

  metricValue: {
    fontSize: '28px',
    fontWeight: 700,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  sectionTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },

  sectionDescription: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    marginBottom: SPACING.XL,
    lineHeight: 1.5,
  },

  insightsSection: {
    marginTop: SPACING.XXL,
  },

  insightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: SPACING.LG,
  },

  insightCard: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    padding: SPACING.LG,
    textAlign: 'center' as const,
  },

  insightIcon: {
    fontSize: '32px',
    marginBottom: SPACING.MD,
  },

  insightTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.SM,
  },

  insightText: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    lineHeight: 1.5,
  },

  tableContainer: {
    overflowX: 'auto' as const,
    borderRadius: '12px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },

  tableHeader: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
  },

  tableHeaderCell: {
    padding: SPACING.MD,
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_700,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
  },

  tableRow: {
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
  },

  tableCell: {
    padding: SPACING.MD,
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_900,
  },

  ratioValue: {
    fontWeight: 600,
  },

  statusBadge: {
    padding: `${SPACING.XS} ${SPACING.SM}`,
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
  },

  trendsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: SPACING.XL,
    marginBottom: SPACING.XXL,
  },

  trendChart: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  chartTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
    marginBottom: SPACING.LG,
  },

  chartPlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    textAlign: 'center' as const,
  },

  chartIcon: {
    fontSize: '48px',
    marginBottom: SPACING.MD,
  },

  chartText: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },

  trendsTable: {
    marginTop: SPACING.XL,
  },

  neighborhoodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: SPACING.LG,
  },

  neighborhoodCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  neighborhoodHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },

  neighborhoodName: {
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
  },

  actionBadge: {
    padding: `${SPACING.XS} ${SPACING.SM}`,
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },

  neighborhoodMetrics: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.MD,
  },

  neighborhoodMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
} as const;

export default Analysis;