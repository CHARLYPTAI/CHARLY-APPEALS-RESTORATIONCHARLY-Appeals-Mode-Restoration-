/**
 * Checkout Form - Apple CTO Emergency Payment Sprint
 * Clean, secure payment processing with Apple design standards
 */

import { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { usePayment } from '../../hooks/useStripeHooks';
import { SUBSCRIPTION_PLANS } from '../../types/payment';
import type { CheckoutFormProps } from '../../types/payment';

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1a1a1a',
      '::placeholder': {
        color: '#8e8e93',
      },
    },
    invalid: {
      color: '#ff3b30',
      iconColor: '#ff3b30',
    },
  },
  hidePostalCode: false,
};

export function CheckoutForm({ planId, customerId, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { createCheckoutSession, isLoading: contextLoading } = usePayment();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

  useEffect(() => {
    if (!plan) {
      onError('Invalid plan selected');
    }
  }, [plan, onError]);

  const handleCardChange = (event: { complete: boolean; error?: { message: string } }) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !plan) {
      onError('Payment system not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // For existing subscriptions, use direct checkout session
      if (plan.name !== 'Free') {
        const session = await createCheckoutSession(planId);
        
        if (session.url) {
          // Redirect to Stripe checkout
          window.location.href = session.url;
        } else {
          onSuccess(session);
        }
      } else {
        // Free plan - no payment required
        onSuccess({
          id: 'free-plan',
          clientSecret: '',
          url: '',
          customerId,
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!plan) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Invalid plan configuration</p>
      </div>
    );
  }

  const isDisabled = !stripe || contextLoading || isProcessing || (!cardComplete && plan.name !== 'Free');

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Plan Summary */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {plan.name} Plan
        </h3>
        <div className="text-2xl font-bold text-gray-900 mb-4">
          ${plan.monthlyPrice}
          <span className="text-sm font-normal text-gray-600">/month</span>
        </div>
        
        {/* Plan Features */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>AI Credits:</span>
            <span className="font-medium">
              {plan.features.aiCredits === -1 ? 'Unlimited' : plan.features.aiCredits}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Appeal Limit:</span>
            <span className="font-medium">
              {plan.features.appealLimit === -1 ? 'Unlimited' : plan.features.appealLimit}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Report Limit:</span>
            <span className="font-medium">
              {plan.features.reportLimit === -1 ? 'Unlimited' : plan.features.reportLimit}
            </span>
          </div>
          {plan.features.prioritySupport && (
            <div className="flex justify-between">
              <span>Priority Support:</span>
              <span className="font-medium text-green-600">✓ Included</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Form */}
      {plan.name !== 'Free' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Information
            </Label>
            <div className="p-3 border border-gray-300 rounded-md bg-white">
              <CardElement
                id="card-element"
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            {cardError && (
              <p className="text-sm text-red-600 mt-1">{cardError}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing...
              </div>
            ) : (
              `Subscribe to ${plan.name} - $${plan.monthlyPrice}/month`
            )}
          </Button>
        </form>
      )}

      {plan.name === 'Free' && (
        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="w-full bg-gray-600 hover:bg-gray-700"
        >
          {isProcessing ? 'Processing...' : 'Continue with Free Plan'}
        </Button>
      )}

      {/* Security Notice */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          🔒 Secured by Stripe. Your payment information is encrypted and secure.
        </p>
      </div>
    </div>
  );
}