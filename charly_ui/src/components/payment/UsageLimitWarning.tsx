/**
 * Usage Limit Warning Component - Apple CTO Emergency Payment Sprint Week 3-4
 * Smart warning system with upgrade prompts and enforcement
 */

import { useState, useEffect } from 'react';
// import { useUsageTracking } from '../../hooks/useUsageTracking';
import { useFeatureGating, type FeatureGateResult } from '../../hooks/useFeatureGating';
// import { useCustomer } from '../../providers/StripeProvider';
import { SUBSCRIPTION_PLANS, type PlanTier } from '../../types/payment';

interface UsageLimitWarningProps {
  feature: 'ai_generation' | 'appeal_generation' | 'report_creation';
  creditsRequired?: number;
  onUpgrade?: () => void;
  onPurchaseCredits?: () => void;
  children: React.ReactNode;
}

interface UpgradePromptProps {
  currentPlan: PlanTier;
  suggestedPlan: PlanTier;
  reason: string;
  onUpgrade: () => void;
  onDismiss: () => void;
}

interface CreditPurchasePromptProps {
  creditsNeeded: number;
  onPurchase: () => void;
  onDismiss: () => void;
}

function UpgradePrompt({ currentPlan, suggestedPlan, reason, onUpgrade, onDismiss }: UpgradePromptProps) {
  const suggestedConfig = PLAN_CONFIGS[suggestedPlan];
  const currentConfig = PLAN_CONFIGS[currentPlan];

  const benefits = [];
  
  if (suggestedConfig.features.aiCredits > currentConfig.features.aiCredits) {
    benefits.push(`${suggestedConfig.features.aiCredits} AI credits (vs ${currentConfig.features.aiCredits})`);
  }
  
  if (suggestedConfig.features.appealLimit > currentConfig.features.appealLimit) {
    const appealText = suggestedConfig.features.appealLimit === -1 ? 'Unlimited' : suggestedConfig.features.appealLimit;
    benefits.push(`${appealText} appeals (vs ${currentConfig.features.appealLimit})`);
  }
  
  if (suggestedConfig.features.reportLimit > currentConfig.features.reportLimit) {
    const reportText = suggestedConfig.features.reportLimit === -1 ? 'Unlimited' : suggestedConfig.features.reportLimit;
    benefits.push(`${reportText} reports (vs ${currentConfig.features.reportLimit})`);
  }
  
  if (suggestedConfig.features.prioritySupport && !currentConfig.features.prioritySupport) {
    benefits.push('Priority support');
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              🚀
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Upgrade to {suggestedPlan}
              </h3>
              <p className="text-sm text-gray-600">
                Unlock more features and resources
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-3">
              {reason}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {suggestedPlan} Plan Benefits:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">
                Monthly Price:
              </span>
              <span className="text-lg font-bold text-blue-600">
                ${suggestedConfig.monthlyPrice}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Save 17% with annual billing (${suggestedConfig.yearlyPrice}/year)
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onUpgrade}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Upgrade Now
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditPurchasePrompt({ creditsNeeded, onPurchase, onDismiss }: CreditPurchasePromptProps) {
  const creditPackages = [
    { credits: 50, price: 5, savings: 0 },
    { credits: 100, price: 9, savings: 10 },
    { credits: 250, price: 20, savings: 25 },
    { credits: 500, price: 35, savings: 30 },
  ];

  const recommendedPackage = creditPackages.find(pkg => pkg.credits >= creditsNeeded) || creditPackages[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl">
              💳
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Purchase AI Credits
              </h3>
              <p className="text-sm text-gray-600">
                You need {creditsNeeded} more credits
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {creditPackages.map((pkg, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  pkg === recommendedPackage 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onPurchase()}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {pkg.credits} Credits
                    </div>
                    {pkg.savings > 0 && (
                      <div className="text-xs text-green-600">
                        Save {pkg.savings}%
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${pkg.price}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${(pkg.price / pkg.credits).toFixed(2)}/credit
                    </div>
                  </div>
                </div>
                {pkg === recommendedPackage && (
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    ⭐ Recommended
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onPurchase}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Purchase Credits
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UsageLimitWarning({
  feature,
  creditsRequired = 0,
  onUpgrade,
  onPurchaseCredits,
  children
}: UsageLimitWarningProps) {
  // const { metrics } = useUsageTracking();
  const { 
    checkAiGeneration, 
    checkAppealGeneration, 
    checkReportCreation 
  } = useFeatureGating();
  // const { customer, subscription } = useCustomer();
  
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showCreditPrompt, setShowCreditPrompt] = useState(false);
  const [gateResult, setGateResult] = useState<FeatureGateResult | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Check feature gate on mount and dependency changes
  useEffect(() => {
    let result: FeatureGateResult;
    
    switch (feature) {
      case 'ai_generation':
        result = checkAiGeneration(creditsRequired);
        break;
      case 'appeal_generation':
        result = checkAppealGeneration();
        break;
      case 'report_creation':
        result = checkReportCreation();
        break;
      default:
        result = { allowed: true };
    }
    
    setGateResult(result);
    setDismissed(false); // Reset dismissal when dependencies change
  }, [feature, creditsRequired, checkAiGeneration, checkAppealGeneration, checkReportCreation]);

  // Get current plan
  const getCurrentPlan = (): PlanTier => {
    if (!subscription || subscription.status !== 'active') {
      return 'Free';
    }
    
    for (const [tier, config] of Object.entries(PLAN_CONFIGS)) {
      if (config.stripePriceId === subscription.planId) {
        return tier as PlanTier;
      }
    }
    
    return 'Free';
  };

  const handleUpgrade = () => {
    setShowUpgradePrompt(false);
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = '/billing';
    }
  };

  const handlePurchaseCredits = () => {
    setShowCreditPrompt(false);
    if (onPurchaseCredits) {
      onPurchaseCredits();
    } else {
      window.location.href = '/billing?tab=credits';
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowUpgradePrompt(false);
    setShowCreditPrompt(false);
  };

  // Show warning if not allowed and not dismissed
  const shouldShowWarning = gateResult && !gateResult.allowed && !dismissed;

  // Handle click on restricted feature
  const handleFeatureClick = (e: React.MouseEvent) => {
    if (shouldShowWarning) {
      e.preventDefault();
      e.stopPropagation();
      
      if (gateResult!.action === 'upgrade') {
        setShowUpgradePrompt(true);
      } else if (gateResult!.action === 'purchase_credits') {
        setShowCreditPrompt(true);
      }
    }
  };

  return (
    <>
      <div 
        className={shouldShowWarning ? 'relative cursor-not-allowed' : ''}
        onClick={handleFeatureClick}
      >
        {/* Overlay for blocked features */}
        {shouldShowWarning && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg flex items-center justify-center z-10">
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs text-center">
              <div className="text-orange-500 text-2xl mb-2">🔒</div>
              <div className="text-sm font-medium text-gray-900 mb-2">
                Feature Restricted
              </div>
              <div className="text-xs text-gray-600 mb-3">
                {gateResult!.reason}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (gateResult!.action === 'upgrade') {
                    setShowUpgradePrompt(true);
                  } else {
                    setShowCreditPrompt(true);
                  }
                }}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
              >
                {gateResult!.action === 'upgrade' ? 'Upgrade Plan' : 'Buy Credits'}
              </button>
            </div>
          </div>
        )}
        
        {/* Original content */}
        <div className={shouldShowWarning ? 'pointer-events-none opacity-50' : ''}>
          {children}
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && gateResult && gateResult.upgradeRequired && (
        <UpgradePrompt
          currentPlan={getCurrentPlan()}
          suggestedPlan={gateResult.upgradeRequired}
          reason={gateResult.reason || 'Upgrade required'}
          onUpgrade={handleUpgrade}
          onDismiss={handleDismiss}
        />
      )}

      {/* Credit Purchase Prompt Modal */}
      {showCreditPrompt && feature === 'ai_generation' && (
        <CreditPurchasePrompt
          creditsNeeded={creditsRequired}
          onPurchase={handlePurchaseCredits}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}

// Inline warning component for smaller UI elements
export function InlineUsageWarning({ feature, creditsRequired = 0 }: {
  feature: 'ai_generation' | 'appeal_generation' | 'report_creation';
  creditsRequired?: number;
}) {
  const { checkAiGeneration, checkAppealGeneration, checkReportCreation } = useFeatureGating();
  
  let gateResult: FeatureGateResult;
  
  switch (feature) {
    case 'ai_generation':
      gateResult = checkAiGeneration(creditsRequired);
      break;
    case 'appeal_generation':
      gateResult = checkAppealGeneration();
      break;
    case 'report_creation':
      gateResult = checkReportCreation();
      break;
    default:
      gateResult = { allowed: true };
  }

  if (gateResult.allowed) return null;

  return (
    <div className="text-xs text-orange-600 flex items-center space-x-1 mt-1">
      <span>⚠️</span>
      <span>{gateResult.reason}</span>
      <button 
        onClick={() => window.location.href = '/billing'}
        className="text-blue-600 hover:text-blue-700 underline"
      >
        Upgrade
      </button>
    </div>
  );
}