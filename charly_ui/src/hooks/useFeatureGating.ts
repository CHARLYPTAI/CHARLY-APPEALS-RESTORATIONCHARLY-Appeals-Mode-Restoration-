/**
 * Feature Gating Hook - Apple CTO Emergency Payment Sprint Week 3-4
 * Subscription-based feature access control
 */

import { useCallback } from 'react';
import { useUsageTracking, useUsageLimits } from './useUsageTracking';
import { useCustomer } from './useStripeHooks';
import { SUBSCRIPTION_PLANS, type PlanTier } from '../types/payment';

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: PlanTier;
  action?: 'upgrade' | 'wait' | 'purchase_credits';
}

export interface FeatureGatingActions {
  checkAiGeneration: (creditsRequired: number) => FeatureGateResult;
  checkAppealGeneration: () => FeatureGateResult;
  checkReportCreation: () => FeatureGateResult;
  checkPrioritySupport: () => FeatureGateResult;
  checkBulkOperations: () => FeatureGateResult;
  checkAdvancedAnalytics: () => FeatureGateResult;
  checkApiAccess: () => FeatureGateResult;
  executeWithGating: <T>(
    feature: string, 
    action: () => Promise<T>,
    creditsRequired?: number
  ) => Promise<T>;
}

export function useFeatureGating(): FeatureGatingActions {
  const { customer, subscription } = useCustomer();
  const { metrics, actions: usageActions } = useUsageTracking();
  const { 
    canUseAiCredits, 
    canGenerateAppeal, 
    canCreateReport 
  } = useUsageLimits();

  // Get current plan tier
  const getCurrentPlan = useCallback((): PlanTier => {
    if (!subscription || subscription.status !== 'active') {
      return 'Free';
    }
    
    for (const [tier, config] of Object.entries(PLAN_CONFIGS)) {
      if (config.stripePriceId === subscription.planId) {
        return tier as PlanTier;
      }
    }
    
    return 'Free';
  }, [subscription]);

  // AI Generation Check
  const checkAiGeneration = useCallback((creditsRequired: number): FeatureGateResult => {
    if (!customer) {
      return {
        allowed: false,
        reason: 'Please log in to use AI features',
        action: 'upgrade'
      };
    }

    const planTier = getCurrentPlan();

    // Check if user has enough credits
    if (!canUseAiCredits(creditsRequired)) {
      // If on Free plan and over limit, suggest upgrade
      if (planTier === 'Free') {
        return {
          allowed: false,
          reason: `Insufficient AI credits. You need ${creditsRequired} credits but have ${metrics?.aiCreditsRemaining || 0} remaining.`,
          upgradeRequired: 'Pro',
          action: 'upgrade'
        };
      }

      // If on paid plan, suggest credit purchase
      return {
        allowed: false,
        reason: `Insufficient AI credits. You need ${creditsRequired} credits but have ${metrics?.aiCreditsRemaining || 0} remaining.`,
        action: 'purchase_credits'
      };
    }

    return { allowed: true };
  }, [customer, getCurrentPlan, canUseAiCredits, metrics]);

  // Appeal Generation Check
  const checkAppealGeneration = useCallback((): FeatureGateResult => {
    if (!customer) {
      return {
        allowed: false,
        reason: 'Please log in to generate appeals',
        action: 'upgrade'
      };
    }

    const planTier = getCurrentPlan();

    if (!canGenerateAppeal()) {
      if (planTier === 'Free') {
        return {
          allowed: false,
          reason: `You've reached your appeal limit of ${PLAN_CONFIGS.Free.features.appealLimit} appeals.`,
          upgradeRequired: 'Pro',
          action: 'upgrade'
        };
      }

      return {
        allowed: false,
        reason: `You've reached your appeal limit of ${PLAN_CONFIGS[planTier].features.appealLimit} appeals.`,
        upgradeRequired: 'Enterprise',
        action: 'upgrade'
      };
    }

    return { allowed: true };
  }, [customer, getCurrentPlan, canGenerateAppeal]);

  // Report Creation Check
  const checkReportCreation = useCallback((): FeatureGateResult => {
    if (!customer) {
      return {
        allowed: false,
        reason: 'Please log in to create reports',
        action: 'upgrade'
      };
    }

    const planTier = getCurrentPlan();

    if (!canCreateReport()) {
      if (planTier === 'Free') {
        return {
          allowed: false,
          reason: `You've reached your report limit of ${PLAN_CONFIGS.Free.features.reportLimit} reports.`,
          upgradeRequired: 'Pro',
          action: 'upgrade'
        };
      }

      return {
        allowed: false,
        reason: `You've reached your report limit of ${PLAN_CONFIGS[planTier].features.reportLimit} reports.`,
        upgradeRequired: 'Enterprise',
        action: 'upgrade'
      };
    }

    return { allowed: true };
  }, [customer, getCurrentPlan, canCreateReport]);

  // Priority Support Check
  const checkPrioritySupport = useCallback((): FeatureGateResult => {
    const planTier = getCurrentPlan();
    const hasSupport = PLAN_CONFIGS[planTier].features.prioritySupport;

    if (!hasSupport) {
      return {
        allowed: false,
        reason: 'Priority support is available for Pro and Enterprise plans',
        upgradeRequired: 'Pro',
        action: 'upgrade'
      };
    }

    return { allowed: true };
  }, [getCurrentPlan]);

  // Bulk Operations Check (Pro+ feature)
  const checkBulkOperations = useCallback((): FeatureGateResult => {
    const planTier = getCurrentPlan();

    if (planTier === 'Free') {
      return {
        allowed: false,
        reason: 'Bulk operations are available for Pro and Enterprise plans',
        upgradeRequired: 'Pro',
        action: 'upgrade'
      };
    }

    return { allowed: true };
  }, [getCurrentPlan]);

  // Advanced Analytics Check (Enterprise feature)
  const checkAdvancedAnalytics = useCallback((): FeatureGateResult => {
    const planTier = getCurrentPlan();

    if (planTier !== 'Enterprise') {
      return {
        allowed: false,
        reason: 'Advanced analytics are available for Enterprise plans',
        upgradeRequired: 'Enterprise',
        action: 'upgrade'
      };
    }

    return { allowed: true };
  }, [getCurrentPlan]);

  // API Access Check (Pro+ feature)
  const checkApiAccess = useCallback((): FeatureGateResult => {
    const planTier = getCurrentPlan();

    if (planTier === 'Free') {
      return {
        allowed: false,
        reason: 'API access is available for Pro and Enterprise plans',
        upgradeRequired: 'Pro',
        action: 'upgrade'
      };
    }

    return { allowed: true };
  }, [getCurrentPlan]);

  // Execute action with automatic gating
  const executeWithGating = useCallback(async <T>(
    feature: string,
    action: () => Promise<T>,
    creditsRequired: number = 0
  ): Promise<T> => {
    let gateResult: FeatureGateResult;

    // Determine which gate to check based on feature
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
      case 'bulk_operations':
        gateResult = checkBulkOperations();
        break;
      case 'advanced_analytics':
        gateResult = checkAdvancedAnalytics();
        break;
      case 'api_access':
        gateResult = checkApiAccess();
        break;
      default:
        gateResult = { allowed: true };
    }

    if (!gateResult.allowed) {
      throw new FeatureGateError(gateResult.reason || 'Feature not available', gateResult);
    }

    // Execute the action
    const result = await action();

    // Track usage after successful execution
    try {
      switch (feature) {
        case 'ai_generation':
          if (creditsRequired > 0) {
            await usageActions.trackAiCredit(creditsRequired);
          }
          break;
        case 'appeal_generation':
          await usageActions.trackAppealGenerated();
          break;
        case 'report_creation':
          await usageActions.trackReportCreated();
          break;
      }
    } catch (trackingError) {
      console.warn('Failed to track usage:', trackingError);
      // Don't fail the original action due to tracking issues
    }

    return result;
  }, [
    checkAiGeneration,
    checkAppealGeneration, 
    checkReportCreation,
    checkBulkOperations,
    checkAdvancedAnalytics,
    checkApiAccess,
    usageActions
  ]);

  return {
    checkAiGeneration,
    checkAppealGeneration,
    checkReportCreation,
    checkPrioritySupport,
    checkBulkOperations,
    checkAdvancedAnalytics,
    checkApiAccess,
    executeWithGating,
  };
}

// Custom error for feature gating
export class FeatureGateError extends Error {
  constructor(
    message: string,
    public gateResult: FeatureGateResult
  ) {
    super(message);
    this.name = 'FeatureGateError';
  }
}

// Convenience hook for specific features
export function useAiFeatureGate() {
  const { checkAiGeneration, executeWithGating } = useFeatureGating();
  
  return {
    canUseAi: (credits: number) => checkAiGeneration(credits).allowed,
    executeAiAction: <T>(action: () => Promise<T>, credits: number) => 
      executeWithGating('ai_generation', action, credits),
  };
}

export function useAppealFeatureGate() {
  const { checkAppealGeneration, executeWithGating } = useFeatureGating();
  
  return {
    canGenerateAppeal: () => checkAppealGeneration().allowed,
    executeAppealGeneration: <T>(action: () => Promise<T>) => 
      executeWithGating('appeal_generation', action),
  };
}

export function useReportFeatureGate() {
  const { checkReportCreation, executeWithGating } = useFeatureGating();
  
  return {
    canCreateReport: () => checkReportCreation().allowed,
    executeReportCreation: <T>(action: () => Promise<T>) => 
      executeWithGating('report_creation', action),
  };
}