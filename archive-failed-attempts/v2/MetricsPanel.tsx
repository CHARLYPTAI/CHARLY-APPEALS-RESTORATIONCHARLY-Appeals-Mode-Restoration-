// charly_ui/src/components/v2/MetricsPanel.tsx

import React from 'react';
import ExpandableCard from './ExpandableCard';

/**
 * 📊 MetricsPanel
 * 
 * Displays core appeal metrics with optional expansion for diagnostics.
 * Wrapped in ExpandableCard for Apple-style progressive layout.
 */

export const MetricsPanel: React.FC = () => {
  return (
    <ExpandableCard
      title="Portfolio Metrics"
      subtitle="Performance overview of appeal activity"
      icon={<span className="text-xl">📈</span>}
      preview={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-900">156</div>
            <div className="text-sm text-neutral-600">Total Properties</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-900">23</div>
            <div className="text-sm text-neutral-600">Flagged Opportunities</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-900">87%</div>
            <div className="text-sm text-neutral-600">Success Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-900">$2.4M</div>
            <div className="text-sm text-neutral-600">Projected Tax Savings</div>
          </div>
        </div>
      }
      fullContent={
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-neutral-900 mb-1">📌 KPI Breakdown</h4>
            <p className="text-sm text-neutral-700">
              These metrics are calculated based on finalized appeals and reflect current portfolio performance across all active jurisdictions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-neutral-700">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <div className="font-semibold text-neutral-900 mb-1">Jurisdictions Covered</div>
              <div>12 counties</div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <div className="font-semibold text-neutral-900 mb-1">Avg Appeal Length</div>
              <div>38 days</div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <div className="font-semibold text-neutral-900 mb-1">Flags Resolved</div>
              <div>92%</div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <div className="font-semibold text-neutral-900 mb-1">Appeals in Progress</div>
              <div>14 cases</div>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default MetricsPanel;
