import React from 'react';
import { useBillingCycle } from '../../hooks/useBillingCycle';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';

export const BillingCycleCard: React.FC = () => {
  const { billingCycle, getRenewalInfo, formatBillingPeriod } = useBillingCycle();
  
  if (!billingCycle) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const renewalInfo = getRenewalInfo();
  const isEndingSoon = billingCycle.daysRemaining <= 3;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          Billing Cycle
        </h3>
        {billingCycle.isTrialPeriod && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
            Trial Period
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Current Period */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Current Period</p>
          <p className="font-medium">{formatBillingPeriod(billingCycle.currentPeriod)}</p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Cycle Progress</span>
            <span className="font-medium">{Math.round(billingCycle.percentageComplete)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${billingCycle.percentageComplete}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {billingCycle.daysRemaining} days remaining
          </p>
        </div>

        {/* Trial Info */}
        {billingCycle.isTrialPeriod && billingCycle.trialEndsAt && (
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-900">
              Your trial ends on {billingCycle.trialEndsAt.toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Renewal Info */}
        {renewalInfo && (
          <div className={`rounded-lg p-3 ${isEndingSoon ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <div className="flex items-start gap-2">
              {isEndingSoon ? (
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ) : (
                <RefreshCw className="w-5 h-5 text-gray-600 flex-shrink-0" />
              )}
              <div className="text-sm">
                {renewalInfo.willAutoRenew ? (
                  <p className={isEndingSoon ? 'text-amber-900' : 'text-gray-700'}>
                    Your subscription will renew on{' '}
                    <span className="font-medium">
                      {renewalInfo.nextBillingDate.toLocaleDateString()}
                    </span>
                  </p>
                ) : (
                  <p className="text-red-700">
                    Your subscription will end on{' '}
                    <span className="font-medium">
                      {renewalInfo.cancellationDate?.toLocaleDateString() || 'N/A'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};