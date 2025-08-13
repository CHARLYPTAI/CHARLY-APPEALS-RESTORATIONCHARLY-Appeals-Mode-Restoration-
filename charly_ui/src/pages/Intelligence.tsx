// 🍎 Intelligence Page - Coming Soon  
// AI insights and predictions

import React from 'react';
import { NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';

const Intelligence: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Intelligence</h1>
        <p style={styles.subtitle}>AI insights and predictive analytics</p>
        <div style={styles.placeholder}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={NEUTRAL_COLORS.GRAY_600} strokeWidth="1">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5l-4.24 4.24M7.76 7.76L3.52 3.52m0 16.96l4.24-4.24m8.48 8.48l4.24-4.24" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  content: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.LG,
  },
  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: NEUTRAL_COLORS.GRAY_900,
    margin: 0,
  },
  subtitle: {
    fontSize: '18px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
  },
  placeholder: {
    marginTop: SPACING.XL,
  },
};

export default Intelligence;