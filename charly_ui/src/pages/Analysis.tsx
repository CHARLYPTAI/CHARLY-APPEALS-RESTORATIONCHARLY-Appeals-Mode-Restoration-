// 🍎 Analysis Page - Coming Soon
// Property analysis excellence

import React from 'react';
import { NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';

const Analysis: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Analysis</h1>
        <p style={styles.subtitle}>Property analysis and market trends</p>
        <div style={styles.placeholder}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={NEUTRAL_COLORS.GRAY_600} strokeWidth="1">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
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

export default Analysis;