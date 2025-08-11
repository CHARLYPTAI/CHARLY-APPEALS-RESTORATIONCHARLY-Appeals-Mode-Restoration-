/**
 * Credit Balance Component - Apple CTO Week 5-6 Implementation
 * Real-time credit balance tracking with enterprise features
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  Zap,
  Plus,
  History,
  RefreshCw
} from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditBalance';
import { usePaymentModal } from '../../hooks/usePaymentModal';

interface CreditBalanceProps {
  showPurchaseButton?: boolean;
  showHistory?: boolean;
  compact?: boolean;
  refreshInterval?: number; // milliseconds
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  showPurchaseButton = true,
  showHistory = true,
  compact = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const { 
    balance, 
    isLoading, 
    error, 
    refresh,
    lastUpdated 
  } = useCreditBalance(refreshInterval);
  
  const { openCreditPurchase } = usePaymentModal();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Credit balance status
  const getBalanceStatus = () => {
    if (balance >= 50) return { level: 'high', color: 'green', label: 'Excellent' };
    if (balance >= 20) return { level: 'medium', color: 'yellow', label: 'Good' };
    if (balance >= 5) return { level: 'low', color: 'orange', label: 'Low' };
    return { level: 'critical', color: 'red', label: 'Critical' };
  };

  const status = getBalanceStatus();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 bg-white rounded-lg border px-3 py-2 shadow-sm">
        <Zap className={`h-4 w-4 text-${status.color}-500`} />
        <span className="text-sm font-medium">
          {isLoading ? '--' : balance} credits
        </span>
        {status.level === 'critical' && (
          <Badge variant="destructive" className="text-xs">
            Low
          </Badge>
        )}
        {showPurchaseButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={openCreditPurchase}
            className="ml-auto"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Credit Balance
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Balance Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                {isLoading ? '--' : balance}
              </span>
              <span className="text-muted-foreground">credits</span>
              <Badge 
                variant={status.level === 'critical' ? 'destructive' : 'secondary'}
                className={`text-${status.color}-600 bg-${status.color}-50 border-${status.color}-200`}
              >
                {status.label}
              </Badge>
            </div>
            
            {showPurchaseButton && (
              <Button 
                onClick={openCreditPurchase}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Buy Credits</span>
              </Button>
            )}
          </div>

          {/* Low Balance Warning */}
          {status.level === 'critical' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Your credit balance is critically low. Purchase more credits to continue using premium features.
              </AlertDescription>
            </Alert>
          )}

          {/* Last Updated */}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-2">
            {showHistory && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center space-x-1"
                onClick={() => {/* Open transaction history */}}
              >
                <History className="h-3 w-3" />
                <span>History</span>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-1"
              onClick={() => {/* Open usage stats */}}
            >
              <TrendingUp className="h-3 w-3" />
              <span>Usage</span>
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditBalance;