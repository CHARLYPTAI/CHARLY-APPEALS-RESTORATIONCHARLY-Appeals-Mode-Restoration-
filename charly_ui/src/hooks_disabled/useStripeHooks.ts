import { useContext } from 'react';
import { createContext } from 'react';
import type { PaymentContextType } from '../types/payment';

// Move the context here to be imported
export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Custom hook - Apple standard pattern
export function usePayment(): PaymentContextType {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a StripeProvider');
  }
  return context;
}

// Convenience hooks
export function useStripe() {
  const context = usePayment();
  return {
    stripe: context.stripe,
    subscription: context.subscription,
    loading: context.isLoading,
    cancelSubscription: context.cancelSubscription,
    changePlan: context.updateSubscription,
  };
}

export function useElements() {
  const { elements } = usePayment();
  return elements;
}

export function useCustomer() {
  const { customer, subscription, usage } = usePayment();
  return { customer, subscription, usage };
}

export function usePaymentMethods() {
  const { paymentMethods, addPaymentMethod, removePaymentMethod } = usePayment();
  return { paymentMethods, addPaymentMethod, removePaymentMethod };
}