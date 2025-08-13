/**
 * Credit Purchase Modal - Apple CTO Week 5-6 Implementation
 * One-time credit purchase with Stripe integration
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CreditCard, 
  Zap, 
  Check, 
  Star,
  Gift,
  Loader2
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { updateCreditBalance } from '../../hooks/useCreditBalance';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  total_credits: number;
  price: number;
  price_per_credit: number;
}

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

const CreditPurchaseForm: React.FC<{
  packages: CreditPackage[];
  selectedPackage: CreditPackage | null;
  onSelectPackage: (pkg: CreditPackage) => void;
  onPurchaseComplete: (newBalance: number) => void;
  onError: (error: string) => void;
}> = ({ packages, selectedPackage, onSelectPackage, onPurchaseComplete, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!stripe || !elements || !selectedPackage) {
      onError('Payment system not ready');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await fetch('/api/payments/credits/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          package_id: selectedPackage.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm purchase on backend
        const confirmResponse = await fetch('/api/payments/credits/confirm-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
          }),
        });

        if (confirmResponse.ok) {
          // Get updated balance
          const balanceResponse = await fetch('/api/usage/credits/balance', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          });

          if (balanceResponse.ok) {
            const { balance } = await balanceResponse.json();
            onPurchaseComplete(balance);
            updateCreditBalance(balance);
          }
        }
      }

    } catch (err) {
      onError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Package Selection */}
      <div className="grid gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedPackage?.id === pkg.id 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => onSelectPackage(pkg)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedPackage?.id === pkg.id 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedPackage?.id === pkg.id && (
                      <Check className="w-3 h-3 text-white m-0.5" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{pkg.name}</h3>
                      {pkg.bonus_credits > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Gift className="w-3 h-3 mr-1" />
                          +{pkg.bonus_credits} bonus
                        </Badge>
                      )}
                      {pkg.id === 'professional' && (
                        <Badge variant="default">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {pkg.credits} credits + {pkg.bonus_credits} bonus = {pkg.total_credits} total
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold">${pkg.price}</div>
                  <div className="text-xs text-gray-500">
                    ${pkg.price_per_credit.toFixed(2)}/credit
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Form */}
      {selectedPackage && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Method
            </h4>
            <div className="bg-gray-50 p-3 rounded border">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <Button 
            onClick={handlePurchase}
            disabled={isProcessing || !stripe || !elements}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Purchase {selectedPackage.total_credits} Credits for ${selectedPackage.price}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  currentBalance = 0
}) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/payments/credits/packages');
      if (!response.ok) throw new Error('Failed to fetch packages');
      
      const data = await response.json();
      setPackages(data.packages);
      
      // Pre-select the professional package
      const professional = data.packages.find((pkg: CreditPackage) => pkg.id === 'professional');
      if (professional) {
        setSelectedPackage(professional);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseComplete = () => {
    setSuccess(true);
    setTimeout(() => {
      onClose();
      setSuccess(false);
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-500" />
            Purchase Credits
          </DialogTitle>
          <DialogDescription>
            Add credits to your account to continue using premium features.
            Current balance: {currentBalance} credits
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : success ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Purchase Successful!</h3>
            <p className="text-gray-600">Your credits have been added to your account.</p>
          </div>
        ) : error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        ) : (
          <Elements stripe={stripePromise}>
            <CreditPurchaseForm
              packages={packages}
              selectedPackage={selectedPackage}
              onSelectPackage={setSelectedPackage}
              onPurchaseComplete={handlePurchaseComplete}
              onError={handleError}
            />
          </Elements>
        )}

        {!isLoading && !success && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreditPurchaseModal;