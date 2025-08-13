// 🍎 Portfolio Page - Coming Soon
// Apple placeholder excellence

import React from 'react';
import { NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';

const Portfolio: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Portfolio</h1>
        <p style={styles.subtitle}>Property CRUD operations coming next</p>
        <div style={styles.placeholder}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={NEUTRAL_COLORS.GRAY_600} strokeWidth="1">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
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

export default Portfolio;