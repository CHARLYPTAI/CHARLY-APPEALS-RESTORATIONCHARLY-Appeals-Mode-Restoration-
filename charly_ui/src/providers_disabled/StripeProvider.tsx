/**
 * Stripe Provider - Apple CTO Emergency Payment Sprint
 * Clean, efficient context provider with no bloat
 */

import { useEffect, useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { 
  Stripe, 
  StripeCardElement 
} from '@stripe/stripe-js';
import type {
  PaymentContextType,
  Customer,
  Subscription,
  PaymentMethod,
  Usage,
  CheckoutSession,
  PaymentIntent,
  StripeProviderProps
} from '../types/payment';
import { PaymentContext } from '../hooks/useStripeHooks';


// Stripe instance - singleton pattern
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) {
      console.error('VITE_STRIPE_PUBLIC_KEY not found');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export function StripeProvider({ children }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  // const [, setElements] = useState<StripeElements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      const stripeInstance = await getStripe();
      setStripe(stripeInstance);
      setIsLoading(false);
    };
    
    initStripe();
  }, []);

  // API Helper - Apple standard fetch wrapper
  const apiRequest = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}
  ) => {
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'API request failed');
    }

    return response.json();
  }, []);

  // Type-safe API helper
  const typedApiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    return apiRequest(endpoint, options);
  }, [apiRequest]);

  // Core Payment Actions
  const createCheckoutSession = useCallback(async (planId: string): Promise<CheckoutSession> => {
    return typedApiRequest('/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        planId,
        customerId: customer?.id,
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
      }),
    });
  }, [customer?.id, apiRequest]);

  const createPaymentIntent = useCallback(async (
    amount: number, 
    description?: string
  ): Promise<PaymentIntent> => {
    return typedApiRequest('/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customerId: customer?.id,
        description,
      }),
    });
  }, [customer?.id, typedApiRequest]);

  const addPaymentMethod = useCallback(async (
    element: StripeCardElement
  ): Promise<PaymentMethod> => {
    if (!stripe || !customer) {
      throw new Error('Stripe not initialized or no customer');
    }

    // Create payment method with Stripe
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: element,
    });

    if (error || !paymentMethod) {
      throw new Error(error?.message || 'Failed to create payment method');
    }

    // Attach to customer via API
    const attached = await apiRequest<PaymentMethod>('/payments/attach-payment-method', {
      method: 'POST',
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        customerId: customer.id,
      }),
    });

    // Update local state
    setPaymentMethods(prev => [...prev, attached]);
    
    return attached;
  }, [stripe, customer, apiRequest]);

  const removePaymentMethod = useCallback(async (methodId: string): Promise<void> => {
    await apiRequest('/payments/detach-payment-method', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId: methodId }),
    });

    setPaymentMethods(prev => prev.filter(pm => pm.id !== methodId));
  }, [apiRequest]);

  const updateSubscription = useCallback(async (planId: string): Promise<Subscription> => {
    const updated = await apiRequest<Subscription>('/payments/update-subscription', {
      method: 'POST',
      body: JSON.stringify({
        subscriptionId: subscription?.id,
        planId,
      }),
    });

    setSubscription(updated);
    return updated;
  }, [subscription?.id, apiRequest]);

  const cancelSubscription = useCallback(async (): Promise<void> => {
    if (!subscription) return;

    await apiRequest('/payments/cancel-subscription', {
      method: 'POST',
      body: JSON.stringify({
        subscriptionId: subscription.id,
      }),
    });

    setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
  }, [subscription, apiRequest]);

  const refreshData = useCallback(async (): Promise<void> => {
    if (!customer) return;

    try {
      setIsLoading(true);
      
      // Fetch all data in parallel - Apple efficiency
      const [customerData, usageData] = await Promise.all([
        apiRequest<Customer>(`/payments/customer/${customer.id}`),
        apiRequest<Usage>(`/payments/usage/${customer.id}`),
      ]);

      setCustomer(customerData);
      setSubscription(customerData.subscription || null);
      setUsage(usageData);

      if (customerData.id) {
        const methods = await apiRequest<PaymentMethod[]>(`/payments/payment-methods/${customerData.id}`);
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customer, apiRequest]);

  // Initialize customer data on mount
  useEffect(() => {
    const initCustomer = async () => {
      try {
        const userData = await apiRequest<Customer>('/payments/customer');
        setCustomer(userData);
        
        if (userData.subscription) {
          setSubscription(userData.subscription);
        }
        
        await refreshData();
      } catch (error) {
        console.error('Failed to initialize customer:', error);
        setIsLoading(false);
      }
    };

    if (stripe && !customer) {
      initCustomer();
    }
  }, [stripe, customer, refreshData, apiRequest]);

  const contextValue: PaymentContextType = {
    stripe,
    elements,
    isLoading,
    customer,
    subscription,
    paymentMethods,
    usage,
    createCheckoutSession,
    createPaymentIntent,
    addPaymentMethod,
    removePaymentMethod,
    updateSubscription,
    cancelSubscription,
    refreshData,
  };

  const stripeOptions = {
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#007AFF', // Apple blue
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {stripe ? (
        <Elements stripe={stripe} options={stripeOptions}>
          {children}
        </Elements>
      ) : (
        children
      )}
    </PaymentContext.Provider>
  );
}

// Export hooks from separate file to avoid react-refresh issues