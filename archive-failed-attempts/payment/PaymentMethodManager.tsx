/**
 * Payment Method Manager - Apple CTO Emergency Payment Sprint
 * Clean payment method management with Apple design standards
 */

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { usePaymentMethods } from '../../hooks/useStripeHooks';
import type { PaymentMethodManagerProps } from '../../types/payment';

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
  hidePostalCode: true,
};

function formatCardBrand(brand: string): string {
  const brandMap: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unknown: 'Unknown',
  };
  return brandMap[brand] || brand;
}

export function PaymentMethodManager({ 
  onMethodAdded, 
  onMethodRemoved 
}: PaymentMethodManagerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { paymentMethods, addPaymentMethod, removePaymentMethod } = usePaymentMethods();
  
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleCardChange = (event: { complete: boolean; error?: { message: string } }) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const handleAddMethod = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !cardComplete) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError('Card element not found');
      return;
    }

    setIsAdding(true);
    setCardError(null);

    try {
      const method = await addPaymentMethod(cardElement);
      onMethodAdded(method);
      setShowAddForm(false);
      
      // Clear the card element
      cardElement.clear();
      setCardComplete(false);
    } catch (error) {
      console.error('Add payment method error:', error);
      setCardError(error instanceof Error ? error.message : 'Failed to add payment method');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMethod = async (methodId: string) => {
    setRemovingId(methodId);
    
    try {
      await removePaymentMethod(methodId);
      onMethodRemoved(methodId);
    } catch (error) {
      console.error('Remove payment method error:', error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Payment Methods
        </h3>
        
        {paymentMethods.length === 0 ? (
          <Card className="p-4 text-center text-gray-500">
            No payment methods added yet
          </Card>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                      {method.card.brand.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatCardBrand(method.card.brand)} •••• {method.card.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {method.card.expMonth.toString().padStart(2, '0')}/{method.card.expYear}
                        {method.isDefault && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMethod(method.id)}
                    disabled={removingId === method.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingId === method.id ? (
                      <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full" />
                    ) : (
                      'Remove'
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add New Payment Method */}
      <div>
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full"
          >
            + Add New Payment Method
          </Button>
        ) : (
          <Card className="p-4">
            <form onSubmit={handleAddMethod} className="space-y-4">
              <div>
                <Label htmlFor="new-card-element" className="block text-sm font-medium text-gray-700 mb-2">
                  New Payment Method
                </Label>
                <div className="p-3 border border-gray-300 rounded-md bg-white">
                  <CardElement
                    id="new-card-element"
                    options={cardElementOptions}
                    onChange={handleCardChange}
                  />
                </div>
                {cardError && (
                  <p className="text-sm text-red-600 mt-1">{cardError}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={!stripe || !cardComplete || isAdding}
                  className="flex-1"
                >
                  {isAdding ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Adding...
                    </div>
                  ) : (
                    'Add Payment Method'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setCardError(null);
                    if (elements) {
                      const cardElement = elements.getElement(CardElement);
                      cardElement?.clear();
                    }
                  }}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        🔒 All payment information is securely processed by Stripe and never stored on our servers.
      </div>
    </div>
  );
}