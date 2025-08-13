// 🍎 Appeals Page - Coming Soon
// The crown jewel workflow

import React from 'react';
import { NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';

const Appeals: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Appeals</h1>
        <p style={styles.subtitle}>Complete appeal workflow coming soon</p>
        <div style={styles.placeholder}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={NEUTRAL_COLORS.GRAY_600} strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
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

export default Appeals;