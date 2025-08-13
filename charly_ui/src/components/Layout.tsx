// 🍎 Layout Component - Apple Navigation Excellence
// Steve Jobs: "Design is not just what it looks like - design is how it works"

import React, { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <h1 style={styles.logoText}>CHARLY</h1>
          </div>
          
          <button style={styles.logoutButton} onClick={handleLogout}>
            <span style={styles.logoutText}>Logout</span>
            <svg 
              style={styles.logoutIcon} 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
};

const handleLogout = () => {
  // Clear auth state and redirect
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: NEUTRAL_COLORS.WHITE,
    display: 'flex',
    flexDirection: 'column' as const,
  },

  header: {
    height: '64px',
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    display: 'flex',
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.04)',
  },

  headerContent: {
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: `0 ${SPACING.LG}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
  },

  logoText: {
    fontSize: '24px',
    fontWeight: 700,
    color: APPLE_COLORS.BLUE,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    letterSpacing: '-0.5px',
  },

  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.XS,
    padding: `${SPACING.XS} ${SPACING.SM}`,
    backgroundColor: 'transparent',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    borderRadius: '8px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontSize: '14px',
    fontWeight: 500,
    transition: TRANSITIONS.STANDARD,
    cursor: 'pointer',
    
    ':hover': {
      backgroundColor: NEUTRAL_COLORS.GRAY_50,
      color: NEUTRAL_COLORS.GRAY_900,
      transform: 'rotate(90deg)', // Icon rotation on hover
    },
  },

  logoutText: {
    fontSize: '14px',
  },

  logoutIcon: {
    transition: TRANSITIONS.STANDARD,
    color: 'inherit',
  },

  main: {
    flex: 1,
    width: '100%',
  },

  content: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: SPACING.LG,
    paddingTop: SPACING.XL,
    
    // Mobile responsive
    '@media (max-width: 768px)': {
      padding: SPACING.MD,
      paddingTop: SPACING.LG,
    },
  },
} as const;