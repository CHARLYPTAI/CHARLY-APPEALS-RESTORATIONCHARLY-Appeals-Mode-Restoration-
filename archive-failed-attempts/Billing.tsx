/**
 * Billing Page - Apple CTO Emergency Payment Sprint
 * Clean billing management interface with Apple design standards
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckoutForm } from '../components/payment/CheckoutForm';
import { PaymentMethodManager } from '../components/payment/PaymentMethodManager';
import { SubscriptionManager } from '../components/payment/SubscriptionManager';
import { BillingCycleCard } from '../components/payment/BillingCycleCard';
import { UsageDisplay, UsageWarningBadge } from '../components/payment/UsageDisplay';
import { usePayment, useCustomer } from '../hooks/useStripeHooks';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { SUBSCRIPTION_PLANS } from '../types/payment';
import type { PlanTier } from '../types/payment';

export default function Billing() {
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'methods' | 'usage' | 'analytics'>('overview');
  
  const { isLoading, refreshData } = usePayment();
  const { customer, subscription, usage } = useCustomer();
  // const { paymentMethods } = usePaymentMethods();
  const { metrics: usageMetrics, actions: usageActions } = useUsageTracking();

  // Handle successful checkout session
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Refresh data after successful checkout
      refreshData();
      // Remove session_id from URL
      window.history.replaceState({}, '', '/billing');
    }
  }, [searchParams, refreshData]);

  const handlePlanSelect = (planId: PlanTier) => {
    setSelectedPlan(planId);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = async () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    await refreshData();
  };

  const handleCheckoutError = (error: string) => {
    console.error('Checkout error:', error);
    // Could show toast notification here
  };

  const handlePaymentMethodAdded = () => {
    // Could show success notification
  };

  const handlePaymentMethodRemoved = () => {
    // Could show success notification
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">
            Manage your subscription, payment methods, and billing information
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <UsageWarningBadge />
          <Button 
            onClick={() => usageActions.refreshUsage()}
            variant="outline"
            size="sm"
          >
            🔄 Refresh Usage
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'plans', name: 'Plans' },
            { id: 'methods', name: 'Payment Methods' },
            { id: 'usage', name: 'Usage' },
            { id: 'analytics', name: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'plans' | 'methods' | 'usage' | 'analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Plan */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {subscription?.planId || 'Free'}
                </span>
                <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                  {subscription?.status || 'Free'}
                </Badge>
              </div>
              
              {subscription && (
                <>
                  <div className="text-sm text-gray-600">
                    Current period: {new Date(subscription.currentPeriodStart * 1000).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
                  </div>
                  {subscription.cancelAtPeriodEnd && (
                    <div className="text-sm text-red-600">
                      ⚠️ Subscription will cancel at period end
                    </div>
                  )}
                </>
              )}
              
              <Button 
                onClick={() => setActiveTab('plans')}
                variant="outline" 
                className="w-full"
              >
                Change Plan
              </Button>
            </div>
          </Card>

          {/* Usage Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage This Period</h3>
            {usage && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>AI Credits Used:</span>
                  <span className="font-medium">{usage.aiCreditsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Appeals Generated:</span>
                  <span className="font-medium">{usage.appealsGenerated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reports Created:</span>
                  <span className="font-medium">{usage.reportsCreated}</span>
                </div>
              </div>
            )}
          </Card>
          
          {/* Billing Cycle Card */}
          <BillingCycleCard />
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <SubscriptionManager />
      )}
      
      {/* Original Plans Tab Content - hidden for now */}
      {activeTab === 'plans-old' && (
        <div className="space-y-6">
          {!showCheckout ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <Card key={planId} className="p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      ${plan.monthlyPrice}
                      <span className="text-lg font-normal text-gray-600">/month</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      <div>
                        AI Credits: {plan.features.aiCredits === -1 ? 'Unlimited' : plan.features.aiCredits}
                      </div>
                      <div>
                        Appeals: {plan.features.appealLimit === -1 ? 'Unlimited' : plan.features.appealLimit}
                      </div>
                      <div>
                        Reports: {plan.features.reportLimit === -1 ? 'Unlimited' : plan.features.reportLimit}
                      </div>
                      {plan.features.prioritySupport && (
                        <div className="text-green-600">✓ Priority Support</div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => handlePlanSelect(planId as PlanTier)}
                      disabled={subscription?.planId === planId}
                      className="w-full"
                      variant={subscription?.planId === planId ? 'secondary' : 'default'}
                    >
                      {subscription?.planId === planId ? 'Current Plan' : `Select ${plan.name}`}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <Button 
                  onClick={() => setShowCheckout(false)} 
                  variant="ghost"
                  className="mb-4"
                >
                  ← Back to Plans
                </Button>
              </div>
              {selectedPlan && (
                <CheckoutForm
                  planId={selectedPlan}
                  customerId={customer?.id}
                  onSuccess={handleCheckoutSuccess}
                  onError={handleCheckoutError}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && customer && (
        <div className="max-w-2xl">
          <PaymentMethodManager
            customerId={customer.id}
            onMethodAdded={handlePaymentMethodAdded}
            onMethodRemoved={handlePaymentMethodRemoved}
          />
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <UsageDisplay showUpgradePrompt={true} />
          
          {/* Usage Controls */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => usageActions.refreshUsage()}
                variant="outline"
                className="w-full"
              >
                🔄 Refresh Usage Data
              </Button>
              <Button
                onClick={() => setActiveTab('plans')}
                variant="outline"
                className="w-full"
              >
                📈 Upgrade Plan
              </Button>
              <Button
                onClick={() => setActiveTab('analytics')}
                variant="outline"
                className="w-full"
              >
                📊 View Analytics
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          {usageMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">AI Credits</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {usageMetrics.aiCreditsRemaining}
                    </p>
                    <p className="text-xs text-gray-500">remaining</p>
                  </div>
                  <div className="text-3xl">🤖</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Appeals</p>
                    <p className="text-2xl font-bold text-green-600">
                      {usageMetrics.appealsRemaining === Number.MAX_SAFE_INTEGER 
                        ? '∞' 
                        : usageMetrics.appealsRemaining}
                    </p>
                    <p className="text-xs text-gray-500">remaining</p>
                  </div>
                  <div className="text-3xl">📄</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Reports</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {usageMetrics.reportsRemaining === Number.MAX_SAFE_INTEGER 
                        ? '∞' 
                        : usageMetrics.reportsRemaining}
                    </p>
                    <p className="text-xs text-gray-500">remaining</p>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Trends */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Trends</h3>
              {usageMetrics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Efficiency Score</span>
                    <span className="text-lg font-bold text-green-600">
                      {Math.round(100 - (usageMetrics.percentageUsed.aiCredits + usageMetrics.percentageUsed.appeals + usageMetrics.percentageUsed.reports) / 3)}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>AI Credits Efficiency</span>
                      <span className={usageMetrics.percentageUsed.aiCredits > 80 ? 'text-red-600' : 'text-green-600'}>
                        {(100 - usageMetrics.percentageUsed.aiCredits).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Appeals Efficiency</span>
                      <span className={usageMetrics.percentageUsed.appeals > 80 ? 'text-red-600' : 'text-green-600'}>
                        {(100 - usageMetrics.percentageUsed.appeals).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Reports Efficiency</span>
                      <span className={usageMetrics.percentageUsed.reports > 80 ? 'text-red-600' : 'text-green-600'}>
                        {(100 - usageMetrics.percentageUsed.reports).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No analytics data available
                </div>
              )}
            </Card>

            {/* Plan Comparison */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Optimization</h3>
              {usageMetrics && (
                <div className="space-y-4">
                  {usageMetrics.isNearLimit.aiCredits && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm font-medium text-orange-800">
                        ⚠️ AI Credits Warning
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        You're using {usageMetrics.percentageUsed.aiCredits.toFixed(1)}% of your AI credits. Consider upgrading.
                      </div>
                    </div>
                  )}
                  
                  {usageMetrics.isNearLimit.appeals && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm font-medium text-orange-800">
                        ⚠️ Appeals Warning
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        You're using {usageMetrics.percentageUsed.appeals.toFixed(1)}% of your appeal limit.
                      </div>
                    </div>
                  )}
                  
                  {!usageMetrics.isNearLimit.aiCredits && !usageMetrics.isNearLimit.appeals && !usageMetrics.isNearLimit.reports && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-800">
                        ✅ Usage Optimal
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Your current plan meets your usage needs efficiently.
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => setActiveTab('plans')}
                    variant="outline"
                    className="w-full"
                  >
                    Compare Plans
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Historical Usage Chart Placeholder */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Usage</h3>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">📈</div>
              <div className="text-gray-600 mb-2">Usage Chart Coming Soon</div>
              <div className="text-sm text-gray-500">
                Historical usage charts and trend analysis will be available in the next update.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}