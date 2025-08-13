import { useState, useEffect } from 'react';
import { useStripe } from './useStripeHooks';
import type { SubscriptionPlan, BillingPeriod } from '../types/payment';

interface BillingCycleInfo {
  currentPeriod: BillingPeriod;
  nextBillingDate: Date;
  daysRemaining: number;
  percentageComplete: number;
  isTrialPeriod: boolean;
  trialEndsAt?: Date;
}

interface ProrationPreview {
  immediateCharge: number;
  nextBillingAmount: number;
  creditsApplied: number;
  description: string;
}

export const useBillingCycle = () => {
  const { subscription, loading } = useStripe();
  const [billingCycle, setBillingCycle] = useState<BillingCycleInfo | null>(null);

  useEffect(() => {
    if (!subscription || loading) return;

    const calculateBillingCycle = () => {
      const now = new Date();
      const currentPeriodStart = new Date(subscription.current_period_start * 1000);
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      
      const totalDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysElapsed);
      const percentageComplete = Math.min(100, (daysElapsed / totalDays) * 100);

      const isTrialPeriod = subscription.status === 'trialing';
      const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined;

      setBillingCycle({
        currentPeriod: {
          start: currentPeriodStart,
          end: currentPeriodEnd,
        },
        nextBillingDate: currentPeriodEnd,
        daysRemaining,
        percentageComplete,
        isTrialPeriod,
        trialEndsAt,
      });
    };

    calculateBillingCycle();
    
    // Update every hour
    const interval = setInterval(calculateBillingCycle, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [subscription, loading]);

  const calculateProration = async (
    fromPlan: SubscriptionPlan,
    toPlan: SubscriptionPlan
  ): Promise<ProrationPreview> => {
    if (!subscription) {
      throw new Error('No active subscription');
    }

    try {
      const response = await fetch('/api/payments/preview-plan-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscription.id,
          new_price_id: toPlan.stripePriceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate proration');
      }

      const data = await response.json();
      
      return {
        immediateCharge: data.proration.immediate_charge,
        nextBillingAmount: data.proration.next_billing_amount,
        creditsApplied: data.proration.credit_amount,
        description: data.description,
      };
    } catch (error) {
      console.error('Error calculating proration:', error);
      
      // Fallback to client-side calculation
      if (!billingCycle) {
        throw new Error('Billing cycle information not available');
      }

      const daysInCycle = Math.ceil(
        (billingCycle.currentPeriod.end.getTime() - billingCycle.currentPeriod.start.getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      const daysUsed = daysInCycle - billingCycle.daysRemaining;
      const percentageUsed = daysUsed / daysInCycle;

      // Calculate unused portion of current plan
      const unusedCredit = fromPlan.price * (1 - percentageUsed);
      
      // Calculate prorated cost of new plan
      const proratedNewPlanCost = toPlan.price * (1 - percentageUsed);
      
      // Immediate charge/credit
      const immediateCharge = Math.max(0, proratedNewPlanCost - unusedCredit);
      
      // Next billing amount
      const nextBillingAmount = toPlan.price;

      let description = '';
      if (fromPlan.price < toPlan.price) {
        // Upgrade
        description = `Upgrading from ${fromPlan.name} to ${toPlan.name}. `;
        if (immediateCharge > 0) {
          description += `You'll be charged $${immediateCharge.toFixed(2)} today for the remaining ${billingCycle.daysRemaining} days of your billing cycle. `;
        }
        description += `Starting ${billingCycle.nextBillingDate.toLocaleDateString()}, you'll be charged $${nextBillingAmount.toFixed(2)}/month.`;
      } else {
        // Downgrade
        description = `Downgrading from ${fromPlan.name} to ${toPlan.name}. `;
        const credit = unusedCredit - proratedNewPlanCost;
        if (credit > 0) {
          description += `You'll receive a $${credit.toFixed(2)} credit applied to your next bill. `;
        }
        description += `Starting ${billingCycle.nextBillingDate.toLocaleDateString()}, you'll be charged $${nextBillingAmount.toFixed(2)}/month.`;
      }

      return {
        immediateCharge,
        nextBillingAmount,
        creditsApplied: Math.max(0, unusedCredit - proratedNewPlanCost),
        description,
      };
    }
  };

  const getRenewalInfo = () => {
    if (!billingCycle) return null;

    return {
      nextBillingDate: billingCycle.nextBillingDate,
      daysUntilRenewal: billingCycle.daysRemaining,
      willAutoRenew: subscription?.cancel_at_period_end === false,
      cancellationDate: subscription?.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    };
  };

  const formatBillingPeriod = (period?: BillingPeriod) => {
    if (!period) return '';
    
    const start = period.start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const end = period.end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${start} - ${end}`;
  };

  return {
    billingCycle,
    calculateProration,
    getRenewalInfo,
    formatBillingPeriod,
    loading,
  };
};