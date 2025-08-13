// 🍎 Navigation Component - Apple Tab Bar Excellence  
// Clean, simple, functional - exactly as Steve would want

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface NavItem {
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/portfolio', label: 'Portfolio' },
  { path: '/appeals', label: 'Appeals' },
  { path: '/analysis', label: 'Analysis' },
  { path: '/intelligence', label: 'Intelligence' },
];

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;

  return (
    <nav style={styles.nav}>
      <div style={styles.navContent}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path || 
                          (currentPath === '/' && item.path === '/dashboard');
          
          return (
            <button
              key={item.path}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = NEUTRAL_COLORS.GRAY_50;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={styles.navItemText}>
                {item.label}
              </span>
              {isActive && <div style={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    position: 'sticky' as const,
    top: '64px', // Below header
    zIndex: 90,
  },

  navContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${SPACING.LG}`,
    
    // Mobile: Stack vertically
    '@media (max-width: 768px)': {
      flexDirection: 'column' as const,
      padding: `0 ${SPACING.MD}`,
    },
  },

  navItem: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    padding: `${SPACING.SM} ${SPACING.LG}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,
    fontSize: '16px',
    fontWeight: 500,
    color: NEUTRAL_COLORS.GRAY_600,
    textDecoration: 'none',
    minHeight: '48px', // Touch target size
    
    // Mobile: Full width
    '@media (max-width: 768px)': {
      width: '100%',
      justifyContent: 'center',
      padding: `${SPACING.SM} ${SPACING.MD}`,
    },
  },

  navItemActive: {
    color: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}08`, // 3% opacity
    fontWeight: 600,
  },

  navItemText: {
    fontSize: '16px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  activeIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: SPACING.LG,
    right: SPACING.LG,
    height: '3px',
    backgroundColor: APPLE_COLORS.BLUE,
    borderRadius: '2px 2px 0 0',
    
    // Mobile: Show as left border instead
    '@media (max-width: 768px)': {
      left: 0,
      right: 'auto',
      top: SPACING.XS,
      bottom: SPACING.XS,
      width: '3px',
      height: 'auto',
      borderRadius: '0 2px 2px 0',
    },
  },
} as const;