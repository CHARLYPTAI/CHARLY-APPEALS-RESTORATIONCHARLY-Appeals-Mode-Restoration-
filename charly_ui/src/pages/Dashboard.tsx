// 🍎 Dashboard Page - Apple Data Excellence
// "Design is not just what it looks like - design is how it works" - Steve Jobs

import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { LoadingDots } from '../components/LoadingDots';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { authenticatedRequest } from '../lib/auth';

interface KPIData {
  total_properties: number;
  appeals_filed: number;
  success_rate: number;
  total_savings: number;
}

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedRequest('/api/kpis');
      if (!response.ok) {
        throw new Error('Failed to load KPIs');
      }
      
      const data = await response.json();
      setKpis(data);
    } catch (err) {
      console.error('Error loading KPIs:', err);
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
          label="Total Properties"
          value={kpis?.total_properties || 0}
          color="blue"
          subtitle="Properties in your portfolio"
          loading={loading}
        />
        
        <StatCard
          label="Appeals Filed"
          value={kpis?.appeals_filed || 0}
          color="orange"
          subtitle="Active and completed appeals"
          loading={loading}
        />
        
        <StatCard
          label="Success Rate"
          value={kpis ? formatPercentage(kpis.success_rate) : '0%'}
          color="green"
          subtitle="Appeals that reduced taxes"
          loading={loading}
        />
        
        <StatCard
          label="Total Savings"
          value={kpis ? formatCurrency(kpis.total_savings) : '$0'}
          color="green"
          subtitle="Tax reductions achieved"
          loading={loading}
        />
      </div>

      {/* Recent Activity Section (Placeholder for future) */}
      <div style={styles.activitySection}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <div style={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={NEUTRAL_COLORS.GRAY_600} strokeWidth="1">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <p style={styles.emptyStateText}>
            Activity tracking coming soon
          </p>
        </div>
      </div>
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
} as const;

export default Dashboard;