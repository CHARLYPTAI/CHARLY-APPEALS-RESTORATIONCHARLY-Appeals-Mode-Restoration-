import React from 'react';
import { IntelligentCanvas } from '@/components/v2/IntelligentCanvas';
import PortfolioMode from '@/components/v2/modes/PortfolioMode';

/**
 * 🍎 CHARLY 2.0 - Revolutionary Interface Entry Point
 * 
 * Integrates the true Intelligent Canvas system with Apple design philosophy:
 * - Dynamic mode switching
 * - Progressive disclosure
 * - Contextual interactions
 */

export function DashboardV3Working() {
  return (
    <IntelligentCanvas mode="portfolio">
      <PortfolioMode />
    </IntelligentCanvas>
  );
}

export default DashboardV3Working;