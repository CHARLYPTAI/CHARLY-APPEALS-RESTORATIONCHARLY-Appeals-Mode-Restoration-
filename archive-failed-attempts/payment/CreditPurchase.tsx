/**
 * Credit Purchase Component - Apple CTO Emergency Payment Sprint Week 3-4
 * One-time credit purchases for additional AI usage
 */

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { usePayment, useCustomer } from '../../hooks/useStripeHooks';
import { useUsageTracking } from '../../hooks/useUsageTracking';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  savings: number;
  popular?: boolean;
  bonus?: number;
}

interface CreditPurchaseProps {
  isOpen: boolean;
  onClose: () => void;
  minCredits?: number;
  onSuccess?: (creditsAdded: number) => void;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    credits: 25,
    price: 5,
    pricePerCredit: 0.20,
    savings: 0,
  },
  {
    id: 'value',
    credits: 100,
    price: 15,
    pricePerCredit: 0.15,
    savings: 25,
    popular: true,
  },
  {
    id: 'pro',
    credits: 250,
    price: 30,
    pricePerCredit: 0.12,
    savings: 40,
    bonus: 50,
  },
  {
    id: 'enterprise',
    credits: 500,
    price: 50,
    pricePerCredit: 0.10,
    savings: 50,
    bonus: 100,
  },
];

export function CreditPurchase({ 
  isOpen, 
  onClose, 
  minCredits = 0,
  onSuccess 
}: CreditPurchaseProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createPaymentIntent } = usePayment();
  const { customer } = useCustomer();
  const { actions: usageActions } = useUsageTracking();

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!customer) {
      setError('Please log in to purchase credits');
      return;
    }

    setSelectedPackage(pkg);
    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent for credit purchase
      await createPaymentIntent(
        pkg.price,
        `${pkg.credits} AI Credits${pkg.bonus ? ` + ${pkg.bonus} bonus` : ''}`
      );

      // In a real implementation, you would handle the payment flow here
      // For demo purposes, we'll simulate a successful purchase
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate adding credits to the user's account
      // In production, this would be handled by webhook after payment confirmation
      
      const totalCredits = pkg.credits + (pkg.bonus || 0);
      
      // Refresh usage data to reflect new credits
      await usageActions.refreshUsage();
      
      onSuccess?.(totalCredits);
      onClose();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  const getRecommendedPackage = (): CreditPackage => {
    if (minCredits <= 25) return CREDIT_PACKAGES[0];
    if (minCredits <= 100) return CREDIT_PACKAGES[1];
    if (minCredits <= 250) return CREDIT_PACKAGES[2];
    return CREDIT_PACKAGES[3];
  };

  const recommendedPackage = getRecommendedPackage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Purchase AI Credits
          </DialogTitle>
          <DialogDescription>
            {minCredits > 0 
              ? `You need at least ${minCredits} credits for this operation. Choose a package below.`
              : 'Choose a credit package to unlock additional AI-powered features.'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                pkg === recommendedPackage ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${
                selectedPackage === pkg ? 'ring-2 ring-green-500 bg-green-50' : ''
              }`}
              onClick={() => !isProcessing && setSelectedPackage(pkg)}
            >
              <div className="text-center space-y-3">
                {/* Header */}
                <div>
                  {pkg.popular && (
                    <Badge className="mb-2 bg-blue-600">Most Popular</Badge>
                  )}
                  {pkg === recommendedPackage && !pkg.popular && (
                    <Badge variant="outline" className="mb-2">Recommended</Badge>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {pkg.id} Pack
                  </h3>
                </div>

                {/* Credits */}
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {pkg.credits}
                  </div>
                  <div className="text-sm text-gray-600">AI Credits</div>
                  {pkg.bonus && (
                    <div className="text-xs text-green-600 font-medium">
                      + {pkg.bonus} bonus credits!
                    </div>
                  )}
                </div>

                {/* Price */}
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${pkg.price}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${pkg.pricePerCredit.toFixed(2)} per credit
                  </div>
                  {pkg.savings > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      Save {pkg.savings}%
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(pkg);
                  }}
                  disabled={isProcessing}
                  className="w-full"
                  variant={pkg === recommendedPackage ? 'default' : 'outline'}
                >
                  {isProcessing && selectedPackage === pkg ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Purchase ${pkg.credits} Credits`
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">What you get with AI Credits:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">🤖</span>
              <span>AI-generated narratives</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">📊</span>
              <span>Property analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-500">🔍</span>
              <span>Comparable property search</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-orange-500">📈</span>
              <span>Market trend analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚖️</span>
              <span>Legal argument generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-indigo-500">💼</span>
              <span>Professional formatting</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Credits never expire • Secure payment processing
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// Quick credit purchase button component
export function QuickCreditButton({ 
  creditsNeeded = 0, 
  className = "" 
}: {
  creditsNeeded?: number;
  className?: string;
}) {
  const { isOpen, openPurchase, closePurchase } = useCreditPurchase();
  const { metrics } = useUsageTracking();

  const hasEnoughCredits = metrics ? metrics.aiCreditsRemaining >= creditsNeeded : false;

  if (hasEnoughCredits && creditsNeeded > 0) {
    return null; // Don't show button if user has enough credits
  }

  return (
    <>
      <Button
        onClick={() => openPurchase(creditsNeeded)}
        variant="outline"
        size="sm"
        className={className}
      >
        💳 Buy Credits
      </Button>

      <CreditPurchase
        isOpen={isOpen}
        onClose={closePurchase}
        minCredits={creditsNeeded}
      />
    </>
  );
}