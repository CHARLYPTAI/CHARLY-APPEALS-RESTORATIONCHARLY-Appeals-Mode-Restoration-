// 🍎 Navigation Component - Apple Tab Bar Excellence  
// Clean, simple, functional - exactly as Steve would want

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';
import { useIsMobile } from '../hooks/useMediaQuery';

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
  { path: '/settings', label: 'Settings' },
];

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const currentPath = location.pathname;

  return (
    <nav style={isMobile ? {...styles.nav, ...styles.navMobile} : styles.nav}>
      <div style={isMobile ? {...styles.navContent, ...styles.navContentMobile} : styles.navContent}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path || 
                          (currentPath === '/' && item.path === '/dashboard');
          
          return (
            <button
              key={item.path}
              style={{
                ...styles.navItem,
                ...(isMobile ? styles.navItemMobile : {}),
                ...(isActive ? (isMobile ? {...styles.navItemActive, ...styles.navItemActiveMobile} : styles.navItemActive) : {}),
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) => {
                if (!isActive && !isMobile) {
                  e.currentTarget.style.backgroundColor = NEUTRAL_COLORS.GRAY_50;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isMobile) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={isMobile ? {...styles.navItemText, ...styles.navItemTextMobile} : styles.navItemText}>
                {item.label}
              </span>
              {isActive && <div style={isMobile ? {...styles.activeIndicator, ...styles.activeIndicatorMobile} : styles.activeIndicator} />}
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

  navMobile: {
    top: '56px', // Below mobile header
    overflowX: 'auto' as const,
  },

  navContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${SPACING.LG}`,
  },

  navContentMobile: {
    flexDirection: 'row' as const,
    padding: `0 ${SPACING.MD}`,
    gap: SPACING.XS,
    overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const, // Firefox
    msOverflowStyle: 'none' as const, // IE/Edge
    WebkitScrollbar: { display: 'none' }, // Webkit
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
    whiteSpace: 'nowrap' as const,
  },

  navItemMobile: {
    padding: `${SPACING.SM} ${SPACING.MD}`,
    minWidth: '80px', // Minimum width for touch targets
    justifyContent: 'center',
    flexShrink: 0, // Prevent shrinking
  },

  navItemActive: {
    color: APPLE_COLORS.BLUE,
    backgroundColor: `${APPLE_COLORS.BLUE}08`, // 3% opacity
    fontWeight: 600,
  },

  navItemActiveMobile: {
    backgroundColor: `${APPLE_COLORS.BLUE}12`, // More visible on mobile
  },

  navItemText: {
    fontSize: '16px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  navItemTextMobile: {
    fontSize: '14px', // Smaller on mobile
  },

  activeIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: SPACING.LG,
    right: SPACING.LG,
    height: '3px',
    backgroundColor: APPLE_COLORS.BLUE,
    borderRadius: '2px 2px 0 0',
  },

  activeIndicatorMobile: {
    left: SPACING.MD,
    right: SPACING.MD,
    height: '2px', // Thinner on mobile
  },
} as const;