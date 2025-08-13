/**
 * Usage Display Component - Apple CTO Emergency Payment Sprint Week 3-4
 * Real-time usage visualization with Apple design principles
 */

import { useUsageTracking } from '../../hooks/useUsageTracking';
import { SUBSCRIPTION_PLANS } from '../../types/payment';
import { usePayment } from '../../hooks/useStripeHooks';

interface UsageDisplayProps {
  compact?: boolean;
  showUpgradePrompt?: boolean;
}

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  color: 'blue' | 'green' | 'orange' | 'red';
  isUnlimited?: boolean;
}

function ProgressBar({ value, max, label, color, isUnlimited }: ProgressBarProps) {
  const percentage = isUnlimited ? 0 : Math.min(100, (value / max) * 100);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  const bgColorClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100', 
    red: 'bg-red-100',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-sm text-gray-600">
          {isUnlimited ? `${value} / Unlimited` : `${value} / ${max}`}
        </span>
      </div>
      
      <div className={`w-full h-2 rounded-full ${bgColorClasses[color]}`}>
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {!isUnlimited && percentage >= 80 && (
        <div className="text-xs text-orange-600 font-medium">
          ⚠️ Approaching limit
        </div>
      )}
      
      {!isUnlimited && percentage >= 100 && (
        <div className="text-xs text-red-600 font-medium">
          🚫 Limit reached
        </div>
      )}
    </div>
  );
}

export function UsageDisplay({ compact = false, showUpgradePrompt = true }: UsageDisplayProps) {
  const { metrics, isLoading, error } = useUsageTracking();
  const { customer, subscription } = usePayment();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${compact ? 'p-3' : 'p-6'}`}>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-3' : 'p-6'} text-center`}>
        <div className="text-red-600 text-sm">
          ⚠️ Failed to load usage data
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {error}
        </div>
      </div>
    );
  }

  if (!metrics || !customer) {
    return (
      <div className={`${compact ? 'p-3' : 'p-6'} text-center text-gray-500 text-sm`}>
        No usage data available
      </div>
    );
  }

  // Determine current plan
  const planTier = subscription?.status === 'active' 
    ? SUBSCRIPTION_PLANS.find(plan => 
        plan.stripePriceId === subscription.planId
      )?.name || 'Free'
    : 'Free';

  const planConfig = SUBSCRIPTION_PLANS.find(p => p.name === planTier);

  // Determine colors based on usage
  const getUsageColor = (percentage: number, isOverLimit: boolean): 'blue' | 'green' | 'orange' | 'red' => {
    if (isOverLimit) return 'red';
    if (percentage >= 80) return 'orange';
    if (percentage >= 60) return 'blue';
    return 'green';
  };

  const showUpgrade = showUpgradePrompt && planTier === 'Free' && (
    metrics.isNearLimit.aiCredits || 
    metrics.isNearLimit.appeals || 
    metrics.isNearLimit.reports ||
    metrics.isOverLimit.aiCredits ||
    metrics.isOverLimit.appeals ||
    metrics.isOverLimit.reports
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-3' : 'p-6'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
          Usage Overview
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            planTier === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
            planTier === 'Pro' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {planTier} Plan
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* AI Credits */}
        <ProgressBar
          value={metrics.aiCreditsUsed}
          max={planConfig.features.aiCredits}
          label="AI Credits"
          color={getUsageColor(metrics.percentageUsed.aiCredits, metrics.isOverLimit.aiCredits)}
          isUnlimited={planConfig.features.aiCredits === -1}
        />

        {/* Appeals */}
        <ProgressBar
          value={metrics.appealsGenerated}
          max={planConfig.features.appealLimit}
          label="Appeals Generated"
          color={getUsageColor(metrics.percentageUsed.appeals, metrics.isOverLimit.appeals)}
          isUnlimited={planConfig.features.appealLimit === -1}
        />

        {/* Reports */}
        <ProgressBar
          value={metrics.reportsCreated}
          max={planConfig.features.reportLimit}
          label="Reports Created"
          color={getUsageColor(metrics.percentageUsed.reports, metrics.isOverLimit.reports)}
          isUnlimited={planConfig.features.reportLimit === -1}
        />
      </div>

      {/* Billing Period */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Billing period: {metrics.billingPeriodStart.toLocaleDateString()} - {metrics.billingPeriodEnd.toLocaleDateString()}
        </div>
      </div>

      {/* Upgrade Prompt */}
      {showUpgrade && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-blue-500 text-lg">🚀</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900 mb-1">
                Upgrade for More Resources
              </div>
              <div className="text-xs text-blue-700 mb-2">
                You're approaching your limits. Upgrade to Pro for 200 AI credits and 50 appeals, or Enterprise for unlimited access.
              </div>
              <button 
                onClick={() => window.location.href = '/billing'}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for header/navigation
export function CompactUsageDisplay() {
  return <UsageDisplay compact={true} showUpgradePrompt={false} />;
}

// Warning badge component for navigation
export function UsageWarningBadge() {
  const { metrics } = useUsageTracking();

  if (!metrics) return null;

  const hasWarning = metrics.isNearLimit.aiCredits || 
                    metrics.isNearLimit.appeals || 
                    metrics.isNearLimit.reports ||
                    metrics.isOverLimit.aiCredits ||
                    metrics.isOverLimit.appeals ||
                    metrics.isOverLimit.reports;

  if (!hasWarning) return null;

  const isOverLimit = metrics.isOverLimit.aiCredits ||
                     metrics.isOverLimit.appeals ||
                     metrics.isOverLimit.reports;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isOverLimit 
        ? 'bg-red-100 text-red-700' 
        : 'bg-orange-100 text-orange-700'
    }`}>
      {isOverLimit ? '🚫' : '⚠️'} 
      <span className="ml-1">
        {isOverLimit ? 'Limit Reached' : 'Near Limit'}
      </span>
    </div>
  );
}