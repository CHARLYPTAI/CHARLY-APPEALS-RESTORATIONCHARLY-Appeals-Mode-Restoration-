/**
 * Usage Tracking Hook - Apple CTO Emergency Payment Sprint Week 3-4
 * Real-time usage monitoring for appeals and AI credits
 */

import { useState, useCallback } from 'react';
import { usePayment } from './useStripeHooks';
import type { PlanTier } from '../types/payment';
import { SUBSCRIPTION_PLANS } from '../types/payment';

export interface UsageMetrics {
  aiCreditsUsed: number;
  aiCreditsRemaining: number;
  appealsGenerated: number;
  appealsRemaining: number;
  reportsCreated: number;
  reportsRemaining: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  percentageUsed: {
    aiCredits: number;
    appeals: number;
    reports: number;
  };
  isNearLimit: {
    aiCredits: boolean;
    appeals: boolean;
    reports: boolean;
  };
  isOverLimit: {
    aiCredits: boolean;
    appeals: boolean;
    reports: boolean;
  };
}

export interface UsageTrackingActions {
  trackAiCredit: (amount: number) => Promise<void>;
  trackAppealGenerated: () => Promise<void>;
  trackReportCreated: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  canUseAiCredits: (amount: number) => boolean;
  canGenerateAppeal: () => boolean;
  canCreateReport: () => boolean;
}

const WARNING_THRESHOLD = 0.8; // 80% usage warning
const API_ENDPOINT = '/api/usage';

export function useUsageTracking(): {
  metrics: UsageMetrics | null;
  actions: UsageTrackingActions;
  isLoading: boolean;
  error: string | null;
} {
  const { customer, subscription, usage, refreshData } = usePayment();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current plan configuration
  const getCurrentPlan = useCallback((): PlanTier => {
    if (!subscription || subscription.status !== 'active') {
      return 'Free';
    }
    
    // Match subscription to plan tier
    for (const plan of SUBSCRIPTION_PLANS) {
      if (plan.stripePriceId === subscription.planId) {
        return plan.name;
      }
    }
    
    return 'Free';
  }, [subscription]);

  // Calculate usage metrics
  const calculateMetrics = useCallback((): UsageMetrics | null => {
    if (!usage || !customer) return null;

    const planTier = getCurrentPlan();
    const planConfig = SUBSCRIPTION_PLANS.find(p => p.name === planTier);

    const aiCreditsRemaining = Math.max(0, 
      planConfig.limits.aiCredits - usage.aiCreditsUsed
    );
    
    const appealsRemaining = planConfig.limits.appealLimit === -1 
      ? Number.MAX_SAFE_INTEGER 
      : Math.max(0, planConfig.limits.appealLimit - usage.appealsGenerated);
    
    const reportsRemaining = planConfig.limits.reportLimit === -1 
      ? Number.MAX_SAFE_INTEGER 
      : Math.max(0, planConfig.limits.reportLimit - usage.reportsCreated);

    // Calculate percentage usage
    const aiCreditsPercent = planConfig.limits.aiCredits === -1 
      ? 0 
      : (usage.aiCreditsUsed / planConfig.limits.aiCredits) * 100;
    
    const appealsPercent = planConfig.limits.appealLimit === -1 
      ? 0 
      : (usage.appealsGenerated / planConfig.limits.appealLimit) * 100;
    
    const reportsPercent = planConfig.limits.reportLimit === -1 
      ? 0 
      : (usage.reportsCreated / planConfig.limits.reportLimit) * 100;

    return {
      aiCreditsUsed: usage.aiCreditsUsed,
      aiCreditsRemaining,
      appealsGenerated: usage.appealsGenerated,
      appealsRemaining,
      reportsCreated: usage.reportsCreated,
      reportsRemaining,
      billingPeriodStart: new Date(usage.billingPeriodStart * 1000),
      billingPeriodEnd: new Date(usage.billingPeriodEnd * 1000),
      percentageUsed: {
        aiCredits: Math.min(100, aiCreditsPercent),
        appeals: Math.min(100, appealsPercent),
        reports: Math.min(100, reportsPercent),
      },
      isNearLimit: {
        aiCredits: aiCreditsPercent >= WARNING_THRESHOLD * 100,
        appeals: appealsPercent >= WARNING_THRESHOLD * 100,
        reports: reportsPercent >= WARNING_THRESHOLD * 100,
      },
      isOverLimit: {
        aiCredits: aiCreditsRemaining <= 0,
        appeals: appealsRemaining <= 0,
        reports: reportsRemaining <= 0,
      },
    };
  }, [usage, customer, getCurrentPlan]);

  // API helper for usage tracking
  const apiRequest = useCallback(async (
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<void> => {
    const response = await fetch(`${API_ENDPOINT}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: customer?.id,
        ...data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to track usage');
    }
  }, [customer?.id]);

  // Usage tracking actions
  const trackAiCredit = useCallback(async (amount: number): Promise<void> => {
    if (!customer) throw new Error('No customer found');
    
    setError(null);
    setIsLoading(true);

    try {
      await apiRequest('/track-ai-credit', {
        amount,
        timestamp: Date.now(),
      });
      
      // Refresh usage data immediately
      await refreshData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to track AI credit';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [customer, apiRequest, refreshData]);

  const trackAppealGenerated = useCallback(async (): Promise<void> => {
    if (!customer) throw new Error('No customer found');
    
    setError(null);
    setIsLoading(true);

    try {
      await apiRequest('/track-appeal', {
        timestamp: Date.now(),
      });
      
      await refreshData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to track appeal';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [customer, apiRequest, refreshData]);

  const trackReportCreated = useCallback(async (): Promise<void> => {
    if (!customer) throw new Error('No customer found');
    
    setError(null);
    setIsLoading(true);

    try {
      await apiRequest('/track-report', {
        timestamp: Date.now(),
      });
      
      await refreshData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to track report';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [customer, apiRequest, refreshData]);

  const refreshUsage = useCallback(async (): Promise<void> => {
    setError(null);
    await refreshData();
  }, [refreshData]);

  // Permission checks
  const canUseAiCredits = useCallback((amount: number): boolean => {
    const metrics = calculateMetrics();
    if (!metrics) return false;
    
    return metrics.aiCreditsRemaining >= amount;
  }, [calculateMetrics]);

  const canGenerateAppeal = useCallback((): boolean => {
    const metrics = calculateMetrics();
    if (!metrics) return false;
    
    return metrics.appealsRemaining > 0;
  }, [calculateMetrics]);

  const canCreateReport = useCallback((): boolean => {
    const metrics = calculateMetrics();
    if (!metrics) return false;
    
    return metrics.reportsRemaining > 0;
  }, [calculateMetrics]);

  const actions: UsageTrackingActions = {
    trackAiCredit,
    trackAppealGenerated,
    trackReportCreated,
    refreshUsage,
    canUseAiCredits,
    canGenerateAppeal,
    canCreateReport,
  };

  return {
    metrics: calculateMetrics(),
    actions,
    isLoading,
    error,
  };
}

// Convenience hook for quick limit checks
export function useUsageLimits() {
  const { metrics, actions } = useUsageTracking();
  
  return {
    canUseAiCredits: actions.canUseAiCredits,
    canGenerateAppeal: actions.canGenerateAppeal,
    canCreateReport: actions.canCreateReport,
    isNearAnyLimit: metrics ? (
      metrics.isNearLimit.aiCredits || 
      metrics.isNearLimit.appeals || 
      metrics.isNearLimit.reports
    ) : false,
    isOverAnyLimit: metrics ? (
      metrics.isOverLimit.aiCredits || 
      metrics.isOverLimit.appeals || 
      metrics.isOverLimit.reports
    ) : false,
  };
}