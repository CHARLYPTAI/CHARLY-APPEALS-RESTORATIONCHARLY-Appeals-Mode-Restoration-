import React, { useState } from 'react';
import { useStripe } from '../../hooks/useStripeHooks';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '../../types/payment';
import { PlanUpgradeModal } from './PlanUpgradeModal';
import { Check, Sparkles, Loader2 } from 'lucide-react';

export const SubscriptionManager: React.FC = () => {
  const { subscription, loading, cancelSubscription } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const currentPlan = subscription?.items?.[0]?.price?.product?.name?.toLowerCase() || 'free';
  const currentPlanDetails = SUBSCRIPTION_PLANS.find(p => p.id.includes(currentPlan)) || SUBSCRIPTION_PLANS[0];

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlanDetails.id) return;
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setCanceling(true);
    setCancelError(null);
    
    try {
      await cancelSubscription();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanDetails.id;
          const isPopular = plan.name === 'Pro';
          
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-6 border-2 transition-all ${
                isCurrentPlan 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              {isPopular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={isCurrentPlan}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isCurrentPlan
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isPopular
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCurrentPlan ? 'Current Plan' : plan.price > currentPlanDetails.price ? 'Upgrade' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Cancel Subscription */}
      {subscription && !subscription.cancel_at_period_end && currentPlanDetails.id !== 'free' && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Cancel Subscription</h3>
          <p className="text-sm text-gray-600 mb-4">
            You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
          </p>
          
          {cancelError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {cancelError}
            </div>
          )}
          
          <button
            onClick={handleCancelSubscription}
            disabled={canceling}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {canceling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Canceling...
              </>
            ) : (
              'Cancel Subscription'
            )}
          </button>
        </div>
      )}

      {/* Cancellation Notice */}
      {subscription?.cancel_at_period_end && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-900 mb-2">Subscription Ending</h3>
          <p className="text-sm text-amber-800">
            Your subscription will end on {new Date(subscription.current_period_end * 1000).toLocaleDateString()}.
            You can reactivate your subscription at any time before this date.
          </p>
        </div>
      )}

      {/* Upgrade Modal */}
      {selectedPlan && (
        <PlanUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            setSelectedPlan(null);
          }}
          targetPlan={selectedPlan}
          currentPlan={currentPlanDetails}
        />
      )}
    </div>
  );
};