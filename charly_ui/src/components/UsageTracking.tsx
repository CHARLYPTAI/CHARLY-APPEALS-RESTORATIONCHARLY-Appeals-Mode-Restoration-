// 🍎 UsageTracking Component - Invisible Usage Intelligence
// "The best metrics are the ones you don't notice" - Seamless awareness

import React, { useState, useEffect } from 'react';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface UsageData {
  current_plan: string;
  billing_period: {
    start: string;
    end: string;
    days_remaining: number;
  };
  usage: {
    appeal_packets: { used: number; limit: number; overage: number };
    ai_predictions: { used: number; limit: number; overage: number };
    property_analyses: { used: number; limit: number; overage: number };
    api_calls: { used: number; limit: number; overage: number };
  };
  overage_costs: {
    packets: number;
    predictions: number;
    analyses: number;
    total: number;
  };
  usage_history: Array<{
    date: string;
    type: string;
    description: string;
    cost: number;
  }>;
}

export const UsageTracking: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');

  useEffect(() => {
    // Simulate API call for usage data
    const mockData: UsageData = {
      current_plan: 'Professional',
      billing_period: {
        start: '2024-08-01',
        end: '2024-08-31',
        days_remaining: 18,
      },
      usage: {
        appeal_packets: { used: 18, limit: 25, overage: 0 },
        ai_predictions: { used: 42, limit: 50, overage: 0 },
        property_analyses: { used: 23, limit: 25, overage: 0 },
        api_calls: { used: 750, limit: 1000, overage: 0 },
      },
      overage_costs: {
        packets: 0,
        predictions: 0,
        analyses: 0,
        total: 0,
      },
      usage_history: [
        {
          date: '2024-08-13',
          type: 'appeal_packet',
          description: 'Professional Appeal Packet - 123 Main St',
          cost: 0,
        },
        {
          date: '2024-08-12',
          type: 'ai_prediction',
          description: 'Success Prediction - Commercial Property',
          cost: 0,
        },
        {
          date: '2024-08-11',
          type: 'property_analysis',
          description: 'Property Analysis - Downtown Office Building',
          cost: 0,
        },
      ],
    };
    setUsageData(mockData);
  }, []);

  if (!usageData) {
    return <div style={styles.loading}>Loading usage data...</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return APPLE_COLORS.RED;
    if (percentage >= 75) return APPLE_COLORS.ORANGE;
    return APPLE_COLORS.BLUE;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Usage Overview</h2>
        <div style={styles.planInfo}>
          <span style={styles.planName}>{usageData.current_plan} Plan</span>
          <span style={styles.billingPeriod}>
            {formatDate(usageData.billing_period.start)} - {formatDate(usageData.billing_period.end)}
          </span>
          <span style={styles.daysRemaining}>
            {usageData.billing_period.days_remaining} days remaining
          </span>
        </div>
      </div>

      <div style={styles.usageGrid}>
        {Object.entries(usageData.usage).map(([key, usage]) => {
          const percentage = getUsagePercentage(usage.used, usage.limit);
          const color = getUsageColor(percentage);
          const isUnlimited = usage.limit === -1;
          
          return (
            <div key={key} style={styles.usageCard}>
              <div style={styles.usageHeader}>
                <h3 style={styles.usageTitle}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <div style={styles.usageNumbers}>
                  <span style={styles.usageUsed}>{usage.used.toLocaleString()}</span>
                  <span style={styles.usageLimit}>
                    / {isUnlimited ? '∞' : usage.limit.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {!isUnlimited && (
                <>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <div style={styles.progressLabel}>
                    <span style={{ color }}>{percentage.toFixed(0)}% used</span>
                    {usage.overage > 0 && (
                      <span style={styles.overageLabel}>
                        +{usage.overage} overage
                      </span>
                    )}
                  </div>
                </>
              )}
              
              {isUnlimited && (
                <div style={styles.unlimitedLabel}>Unlimited usage</div>
              )}
            </div>
          );
        })}
      </div>

      {usageData.overage_costs.total > 0 && (
        <div style={styles.overageSection}>
          <h3 style={styles.overageTitle}>Overage Charges This Period</h3>
          <div style={styles.overageGrid}>
            {Object.entries(usageData.overage_costs)
              .filter(([key, cost]) => key !== 'total' && cost > 0)
              .map(([key, cost]) => (
                <div key={key} style={styles.overageItem}>
                  <span style={styles.overageType}>
                    {key.replace(/s$/, '').replace(/_/g, ' ')}
                  </span>
                  <span style={styles.overageCost}>${cost.toFixed(2)}</span>
                </div>
              ))}
          </div>
          <div style={styles.overageTotal}>
            <strong>Total Overage: ${usageData.overage_costs.total.toFixed(2)}</strong>
          </div>
        </div>
      )}

      <div style={styles.historySection}>
        <div style={styles.historyHeader}>
          <h3 style={styles.historyTitle}>Usage History</h3>
          <select
            style={styles.periodSelect}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="current">Current Period</option>
            <option value="last">Last Period</option>
            <option value="3months">Last 3 Months</option>
          </select>
        </div>
        
        <div style={styles.historyList}>
          {usageData.usage_history.map((item, index) => (
            <div key={index} style={styles.historyItem}>
              <div style={styles.historyIcon}>
                <HistoryIcon type={item.type} />
              </div>
              <div style={styles.historyContent}>
                <div style={styles.historyDescription}>{item.description}</div>
                <div style={styles.historyDate}>{formatDate(item.date)}</div>
              </div>
              <div style={styles.historyCost}>
                {item.cost > 0 ? `$${item.cost.toFixed(2)}` : 'Included'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.insights}>
        <h3 style={styles.insightsTitle}>Usage Insights</h3>
        <div style={styles.insightsGrid}>
          <div style={styles.insight}>
            <span style={styles.insightLabel}>Most Used Service</span>
            <span style={styles.insightValue}>AI Predictions</span>
          </div>
          <div style={styles.insight}>
            <span style={styles.insightLabel}>Projected Usage</span>
            <span style={styles.insightValue}>
              {Math.round((Object.values(usageData.usage)[0].used / 13) * 31)} packets/month
            </span>
          </div>
          <div style={styles.insight}>
            <span style={styles.insightLabel}>Efficiency Score</span>
            <span style={styles.insightValue}>92%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconColor = NEUTRAL_COLORS.GRAY_400;
  
  const icons = {
    appeal_packet: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
    ),
    ai_prediction: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
      </svg>
    ),
    property_analysis: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <rect x="7" y="7" width="3" height="9" />
        <rect x="14" y="7" width="3" height="5" />
      </svg>
    ),
  };

  return icons[type as keyof typeof icons] || icons.appeal_packet;
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },

  loading: {
    textAlign: 'center' as const,
    padding: SPACING.XXL,
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XL,
  },

  title: {
    fontSize: '24px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.SM,
    letterSpacing: '-0.3px',
  },

  planInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING.LG,
    flexWrap: 'wrap' as const,
  },

  planName: {
    fontSize: '16px',
    fontWeight: 500,
    color: APPLE_COLORS.BLUE,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  billingPeriod: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  daysRemaining: {
    fontSize: '14px',
    color: APPLE_COLORS.ORANGE,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    fontWeight: 500,
  },

  usageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACING.LG,
    marginBottom: SPACING.XXL,
  },

  usageCard: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  usageHeader: {
    marginBottom: SPACING.MD,
  },

  usageTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.XS,
  },

  usageNumbers: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
  },

  usageUsed: {
    fontSize: '24px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    letterSpacing: '-0.5px',
  },

  usageLimit: {
    fontSize: '16px',
    fontWeight: 400,
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: NEUTRAL_COLORS.GRAY_100,
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: SPACING.XS,
  },

  progressFill: {
    height: '100%',
    transition: TRANSITIONS.STANDARD,
    borderRadius: '2px',
  },

  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  overageLabel: {
    color: APPLE_COLORS.RED,
    fontWeight: 500,
  },

  unlimitedLabel: {
    fontSize: '14px',
    color: APPLE_COLORS.GREEN,
    fontWeight: 500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    textAlign: 'center' as const,
    padding: SPACING.SM,
    backgroundColor: `${APPLE_COLORS.GREEN}10`,
    borderRadius: '6px',
  },

  overageSection: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    padding: SPACING.LG,
    marginBottom: SPACING.XL,
  },

  overageTitle: {
    fontSize: '18px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.MD,
  },

  overageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.MD,
    marginBottom: SPACING.MD,
  },

  overageItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.SM,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '8px',
  },

  overageType: {
    fontSize: '14px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    textTransform: 'capitalize' as const,
  },

  overageCost: {
    fontSize: '14px',
    fontWeight: 500,
    color: APPLE_COLORS.RED,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  overageTotal: {
    textAlign: 'center' as const,
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    padding: SPACING.SM,
    borderTop: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
  },

  historySection: {
    marginBottom: SPACING.XXL,
  },

  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },

  historyTitle: {
    fontSize: '18px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
  },

  periodSelect: {
    padding: `${SPACING.XS} ${SPACING.SM}`,
    borderRadius: '6px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    fontSize: '14px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    color: NEUTRAL_COLORS.GRAY_700,
  },

  historyList: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '12px',
    overflow: 'hidden',
  },

  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.MD,
    padding: SPACING.MD,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_50}`,
    ':last-child': {
      borderBottom: 'none',
    },
  },

  historyIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '8px',
    flexShrink: 0,
  },

  historyContent: {
    flex: 1,
  },

  historyDescription: {
    fontSize: '14px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    marginBottom: '2px',
  },

  historyDate: {
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  historyCost: {
    fontSize: '14px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  insights: {
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '12px',
    padding: SPACING.LG,
  },

  insightsTitle: {
    fontSize: '18px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.LG,
    textAlign: 'center' as const,
  },

  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.LG,
  },

  insight: {
    textAlign: 'center' as const,
  },

  insightLabel: {
    display: 'block',
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_500,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    marginBottom: SPACING.XS,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  insightValue: {
    display: 'block',
    fontSize: '18px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_800,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  },
} as const;