import React, { useState } from 'react';
import { useStripe } from '../../hooks/useStripeHooks';
import { useBillingCycle } from '../../hooks/useBillingCycle';
import type { SubscriptionPlan } from '../../types/payment';
import { CheckCircle2, AlertCircle, CreditCard, Loader2 } from 'lucide-react';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: SubscriptionPlan;
  currentPlan: SubscriptionPlan;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  targetPlan,
  currentPlan,
}) => {
  const { changePlan } = useStripe();
  const { calculateProration } = useBillingCycle();
  const [proration, setProration] = useState<{
    immediateCharge: number;
    creditsApplied: number;
    nextBillingAmount: number;
    description: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      calculateProration(currentPlan, targetPlan)
        .then(setProration)
        .catch(err => setError(err.message));
    }
  }, [isOpen, currentPlan, targetPlan, calculateProration]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await changePlan(targetPlan.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isUpgrade = targetPlan.price > currentPlan.price;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6">
          {isUpgrade ? 'Upgrade' : 'Change'} to {targetPlan.name}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {proration && (
          <div className="space-y-6">
            {/* Plan Comparison */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm text-gray-600">Current Plan</p>
                  <p className="font-semibold">{currentPlan.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">New Plan</p>
                  <p className="font-semibold text-blue-600">{targetPlan.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-center text-gray-400">
                <span className="text-2xl">→</span>
              </div>
            </div>

            {/* Proration Details */}
            <div className="border rounded-xl p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                Billing Details
              </h3>
              
              {proration.immediateCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Today</span>
                  <span className="font-semibold">${proration.immediateCharge.toFixed(2)}</span>
                </div>
              )}
              
              {proration.creditsApplied > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Credit</span>
                  <span className="font-semibold text-green-600">
                    -${proration.creditsApplied.toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t">
                <span className="text-gray-600">Next Billing Amount</span>
                <span className="font-semibold">${proration.nextBillingAmount.toFixed(2)}/mo</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-900">{proration.description}</p>
            </div>

            {/* New Features */}
            {isUpgrade && (
              <div className="space-y-2">
                <h3 className="font-medium mb-3">What you'll get with {targetPlan.name}:</h3>
                {targetPlan.features.slice(0, 4).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Confirm {isUpgrade ? 'Upgrade' : 'Change'}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};