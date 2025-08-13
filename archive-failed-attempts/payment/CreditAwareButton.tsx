/**
 * Credit-Aware Button - Apple CTO Week 5-6 Implementation
 * Button component that checks credits before allowing actions
 */

import React, { useState, useEffect } from 'react';
import { Button, ButtonProps } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Zap, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditBalance';

interface CreditAwareButtonProps extends ButtonProps {
  operation: string;
  creditsRequired?: number;
  appealType?: string;
  onInsufficientCredits?: (required: number, current: number) => void;
  onUpgradeNeeded?: () => void;
  showCreditCost?: boolean;
  checkOnly?: boolean; // Only check, don't deduct credits
}

export const CreditAwareButton: React.FC<CreditAwareButtonProps> = ({
  operation,
  creditsRequired,
  appealType = 'standard',
  onInsufficientCredits,
  onUpgradeNeeded,
  showCreditCost = true,
  checkOnly = false,
  onClick,
  children,
  disabled,
  ...buttonProps
}) => {
  const { balance, isLoading: balanceLoading } = useCreditBalance();
  const [isChecking, setIsChecking] = useState(false);
  const [operationCost, setOperationCost] = useState<number>(creditsRequired || 0);
  const [canAfford, setCanAfford] = useState(true);

  useEffect(() => {
    if (creditsRequired !== undefined) {
      setOperationCost(creditsRequired);
    } else {
      checkOperationCost();
    }
  }, [creditsRequired, operation, appealType]);

  useEffect(() => {
    setCanAfford(balance >= operationCost);
  }, [balance, operationCost]);

  const checkOperationCost = async () => {
    try {
      setIsChecking(true);
      
      const response = await fetch('/api/usage/check-operation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ operation }),
      });

      if (response.ok) {
        const data = await response.json();
        setOperationCost(data.credits_required);
        setCanAfford(data.allowed);
      }
    } catch (error) {
      console.error('Failed to check operation cost:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkAppealCost = async () => {
    try {
      setIsChecking(true);
      
      const response = await fetch('/api/appeals/check-generation-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ appeal_type: appealType }),
      });

      if (response.ok) {
        const data = await response.json();
        setOperationCost(data.credits_required);
        setCanAfford(data.can_generate);
        
        if (!data.can_generate && data.upgrade_required) {
          onUpgradeNeeded?.();
        }
      }
    } catch (error) {
      console.error('Failed to check appeal cost:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!canAfford) {
      onInsufficientCredits?.(operationCost, balance);
      return;
    }

    if (operation === 'appeal_generation') {
      await checkAppealCost();
      if (!canAfford) {
        onInsufficientCredits?.(operationCost, balance);
        return;
      }
    }

    onClick?.(event);
  };

  const getCreditCostDisplay = () => {
    if (!showCreditCost || operationCost === 0) return null;
    
    return (
      <Badge 
        variant={canAfford ? 'secondary' : 'destructive'} 
        className="ml-2 text-xs"
      >
        <Zap className="w-3 h-3 mr-1" />
        {operationCost} credit{operationCost !== 1 ? 's' : ''}
      </Badge>
    );
  };

  const isButtonDisabled = disabled || balanceLoading || isChecking || (!canAfford && !checkOnly);

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Button
          {...buttonProps}
          disabled={isButtonDisabled}
          onClick={handleClick}
          className={`
            ${buttonProps.className || ''} 
            ${!canAfford ? 'opacity-75' : ''}
          `}
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              {children}
              {getCreditCostDisplay()}
            </>
          )}
        </Button>
      </div>

      {!canAfford && !checkOnly && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            Insufficient credits. Need {operationCost} credits, but only have {balance}.
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-red-800 underline ml-1"
              onClick={() => onUpgradeNeeded?.()}
            >
              Purchase more credits
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showCreditCost && operationCost > 0 && canAfford && (
        <div className="text-xs text-muted-foreground">
          This action will use {operationCost} credit{operationCost !== 1 ? 's' : ''}. 
          Current balance: {balance} credits
        </div>
      )}
    </div>
  );
};

export default CreditAwareButton;