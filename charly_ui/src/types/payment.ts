/**
 * Payment System Types - Apple CTO Emergency Payment Sprint
 * Lean, mean, no bloat TypeScript interfaces
 */

import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

// Core Stripe Types
export interface StripeConfig {
  publishableKey: string;
  apiVersion: '2023-10-16';
  locale: 'en';
}

// Subscription Plans - Apple Standard Simplicity
export type PlanTier = 'Free' | 'Pro' | 'Enterprise';

export interface SubscriptionPlan {
  id: string;
  name: PlanTier;
  stripePriceId: string;
  price: number; // Monthly price
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[]; // Simple feature list
  limits: {
    aiCredits: number;
    appealLimit: number;
    reportLimit: number;
    prioritySupport: boolean;
  };
}

// Billing Period
export interface BillingPeriod {
  start: Date;
  end: Date;
}

// Payment Session Types
export interface CheckoutSession {
  id: string;
  clientSecret: string;
  url: string;
  customerId?: string;
  subscriptionId?: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
}

// Customer & Subscription State
export interface Customer {
  id: string;
  email: string;
  name?: string;
  defaultPaymentMethodId?: string;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd?: number;
}

// Payment Method Types
export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unknown';
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

// Usage & Billing Types
export interface Usage {
  aiCreditsUsed: number;
  appealsGenerated: number;
  reportsCreated: number;
  billingPeriodStart: number;
  billingPeriodEnd: number;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  created: number;
  dueDate: number;
  downloadUrl?: string;
}

// Webhook Event Types
export type WebhookEventType = 
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'payment_method.attached'
  | 'payment_method.detached';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: {
    object: unknown;
  };
  created: number;
}

// Component Props Types
export interface StripeProviderProps {
  children: React.ReactNode;
}

export interface CheckoutFormProps {
  planId: string;
  customerId?: string;
  onSuccess: (session: CheckoutSession) => void;
  onError: (error: string) => void;
}

export interface PaymentMethodManagerProps {
  customerId: string;
  onMethodAdded: (method: PaymentMethod) => void;
  onMethodRemoved: (methodId: string) => void;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateCheckoutSessionRequest {
  planId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
}

// Error Types
export interface PaymentError {
  type: 'card_error' | 'validation_error' | 'api_error';
  code: string;
  message: string;
  param?: string;
}

// Context Types
export interface PaymentContextType {
  stripe: Stripe | null;
  elements: StripeElements | null;
  isLoading: boolean;
  customer: Customer | null;
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  usage: Usage | null;
  // Actions
  createCheckoutSession: (planId: string) => Promise<CheckoutSession>;
  createPaymentIntent: (amount: number, description?: string) => Promise<PaymentIntent>;
  addPaymentMethod: (element: StripeCardElement) => Promise<PaymentMethod>;
  removePaymentMethod: (methodId: string) => Promise<void>;
  updateSubscription: (planId: string) => Promise<Subscription>;
  cancelSubscription: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// Constants
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    stripePriceId: '',
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '10 AI Credits per month',
      '3 Property appeals',
      '5 Market reports',
      'Basic support',
    ],
    limits: {
      aiCredits: 10,
      appealLimit: 3,
      reportLimit: 5,
      prioritySupport: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || '',
    price: 29,
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      '200 AI Credits per month',
      '50 Property appeals',
      '100 Market reports',
      'Priority support',
      'Advanced analytics',
      'Bulk processing',
    ],
    limits: {
      aiCredits: 200,
      appealLimit: 50,
      reportLimit: 100,
      prioritySupport: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    stripePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || '',
    price: 99,
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      '1000 AI Credits per month',
      'Unlimited property appeals',
      'Unlimited market reports',
      'Dedicated support',
      'Custom integrations',
      'API access',
      'White-label options',
    ],
    limits: {
      aiCredits: 1000,
      appealLimit: -1, // Unlimited
      reportLimit: -1, // Unlimited
      prioritySupport: true,
    },
  },
];