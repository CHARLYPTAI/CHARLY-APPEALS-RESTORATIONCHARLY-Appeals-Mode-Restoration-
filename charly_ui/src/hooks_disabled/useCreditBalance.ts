/**
 * Credit Balance Hook - Apple CTO Week 5-6 Implementation
 * Real-time credit balance tracking with automatic refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

interface CreditBalanceData {
  balance: number;
  last_updated: string;
}

interface UseCreditBalanceReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: string | null;
}

export const useCreditBalance = (refreshInterval: number = 30000): UseCreditBalanceReturn => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const { user, token } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCreditBalance = useCallback(async (): Promise<void> => {
    if (!user || !token) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/usage/credits/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch credit balance: ${response.status}`);
      }

      const data: CreditBalanceData = await response.json();
      
      setBalance(data.balance);
      setLastUpdated(data.last_updated);
      setError(null);
      
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          // Request was cancelled, don't update error state
          return;
        }
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await fetchCreditBalance();
  }, [fetchCreditBalance]);

  // Initial fetch and setup interval
  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Fetch immediately
    fetchCreditBalance();

    // Setup refresh interval
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchCreditBalance, refreshInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, token, refreshInterval, fetchCreditBalance]);

  // Listen for credit balance changes from other components
  useEffect(() => {
    const handleCreditBalanceUpdate = (event: CustomEvent) => {
      const { newBalance } = event.detail;
      if (typeof newBalance === 'number') {
        setBalance(newBalance);
        setLastUpdated(new Date().toISOString());
      }
    };

    window.addEventListener('creditBalanceUpdate', handleCreditBalanceUpdate as EventListener);

    return () => {
      window.removeEventListener('creditBalanceUpdate', handleCreditBalanceUpdate as EventListener);
    };
  }, []);

  return {
    balance,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
};

// Utility function to dispatch credit balance updates
export const updateCreditBalance = (newBalance: number): void => {
  const event = new CustomEvent('creditBalanceUpdate', {
    detail: { newBalance }
  });
  window.dispatchEvent(event);
};