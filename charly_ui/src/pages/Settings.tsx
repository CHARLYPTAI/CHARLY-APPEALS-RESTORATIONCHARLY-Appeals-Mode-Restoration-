// 🍎 Settings Page - Apple Monetization Excellence
// "Simplicity is the ultimate sophistication" - Steve Jobs

import React, { useState } from 'react';
import { PricingTiers } from '../components/PricingTiers';
import { PayPerUse } from '../components/PayPerUse';
import { UsageTracking } from '../components/UsageTracking';
import { BillingHistory } from '../components/BillingHistory';
import BrandingSettings from '../components/BrandingSettings';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { id: 'billing', label: 'Billing & Plans', icon: 'creditcard' },
  { id: 'payperuse', label: 'Pay-Per-Use', icon: 'cart' },
  { id: 'usage', label: 'Usage', icon: 'chart' },
  { id: 'history', label: 'History', icon: 'list' },
  { id: 'branding', label: 'Branding', icon: 'palette' },
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('billing');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'billing':
        return <PricingTiers />;
      case 'payperuse':
        return <PayPerUse />;
      case 'usage':
        return <UsageTracking />;
      case 'history':
        return <BillingHistory />;
      case 'branding':
        return <BrandingSettings />;
      default:
        return <PricingTiers />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>
          Manage your subscription, usage, and billing preferences
        </p>
      </div>

      <div style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
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
              <TabIcon icon={tab.icon} isActive={isActive} />
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

const TabIcon: React.FC<{ icon: string; isActive: boolean }> = ({ icon, isActive }) => {
  const color = isActive ? APPLE_COLORS.BLUE : NEUTRAL_COLORS.GRAY_600;
  
  const iconPaths = {
    creditcard: "M2 3a1 1 0 011-1h18a1 1 0 011 1v4a1 1 0 01-1 1H3a1 1 0 01-1-1V3zM2 9a1 1 0 011-1h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V9z",
    cart: "M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    list: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    palette: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.55-.22-1.05-.59-1.41-.36-.36-.59-.86-.59-1.41 0-1.1.9-2 2-2h2.5c3.04 0 5.5-2.46 5.5-5.5C22 6.48 17.52 2 12 2zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8s1.5.67 1.5 1.5S7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5S18.33 11 17.5 11z"
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={styles.tabIcon}
    >
      <path d={iconPaths[icon as keyof typeof iconPaths]} />
    </svg>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `${SPACING.XL} ${SPACING.LG}`,
    minHeight: 'calc(100vh - 200px)',
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: SPACING.XXL,
  },

  title: {
    fontSize: '32px', // Reduced from 48px for invisibility
    fontWeight: 400,  // Reduced from 700 for lightness
    color: NEUTRAL_COLORS.GRAY_800, // Lighter than 900
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.SM,
    letterSpacing: '-0.5px', // Subtle letter spacing
  },

  subtitle: {
    fontSize: '16px', // Reduced from 18px
    color: NEUTRAL_COLORS.GRAY_500, // Lighter than 600
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    margin: 0,
    maxWidth: '500px', // Reduced from 600px
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.4,
    fontWeight: 300, // Light weight
  },

  tabBar: {
    display: 'flex',
    justifyContent: 'center',
    borderBottom: `1px solid ${NEUTRAL_COLORS.GRAY_100}`, // Lighter border
    marginBottom: SPACING.XXL,
    gap: SPACING.SM, // Increased gap for breathing room
  },

  tab: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.XS,
    padding: `${SPACING.MD} ${SPACING.LG}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px', // Reduced radius for subtlety
    cursor: 'pointer',
    transition: TRANSITIONS.STANDARD,
    fontSize: '15px', // Slightly smaller
    fontWeight: 400,  // Reduced from 500
    color: NEUTRAL_COLORS.GRAY_500, // Lighter
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    minHeight: '48px', // Reduced from 56px
  },

  tabActive: {
    color: APPLE_COLORS.BLUE,
    backgroundColor: 'transparent', // Remove background for invisibility
    fontWeight: 500, // Slightly heavier when active
  },

  tabIcon: {
    transition: TRANSITIONS.STANDARD,
  },

  tabLabel: {
    fontSize: '16px',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },

  activeIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '24px', // Small, centered indicator
    height: '2px', // Thinner
    backgroundColor: APPLE_COLORS.BLUE,
    borderRadius: '1px',
    opacity: 0.8, // Subtle transparency
  },

  content: {
    minHeight: '600px',
  },
} as const;

export default Settings;