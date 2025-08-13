/**
 * Usage Status Card - Apple CTO Week 5-6 Implementation
 * Real-time usage monitoring with limit enforcement
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Zap,
  FileText,
  BarChart3,
  ArrowUp
} from 'lucide-react';

interface UsageData {
  credits: {
    balance: number;
    low_balance: boolean;
  };
  monthly_usage: {
    ai_credits: number;
    appeals: number;
    reports: number;
  };
  plan_limits: {
    ai_credits: number;
    appeals: number;
    reports: number;
  };
  usage_percentages: {
    ai_credits: number;
    appeals: number;
    reports: number;
  };
  warnings: Array<{
    resource: string;
    level: 'warning' | 'critical';
    message: string;
  }>;
  requires_upgrade: boolean;
}

interface UsageStatusCardProps {
  onUpgrade?: () => void;
  refreshInterval?: number;
}

export const UsageStatusCard: React.FC<UsageStatusCardProps> = ({
  onUpgrade,
  refreshInterval = 60000 // 1 minute
}) => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStatus();
    
    const interval = setInterval(fetchUsageStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchUsageStatus = async () => {
    try {
      const response = await fetch('/api/usage/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage status');
      }

      const data: UsageData = await response.json();
      setUsageData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (percentage: number, isUnlimited: boolean = false) => {
    if (isUnlimited) return 'bg-green-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = (percentage: number, isUnlimited: boolean = false) => {
    if (isUnlimited) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (percentage >= 90) return <XCircle className="w-4 h-4 text-red-500" />;
    if (percentage >= 75) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getUsageIcon = (resource: string) => {
    switch (resource) {
      case 'ai_credits': return <Zap className="w-4 h-4" />;
      case 'appeals': return <FileText className="w-4 h-4" />;
      case 'reports': return <BarChart3 className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getResourceLabel = (resource: string) => {
    switch (resource) {
      case 'ai_credits': return 'AI Credits';
      case 'appeals': return 'Appeals';
      case 'reports': return 'Reports';
      default: return resource;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!usageData) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <TrendingUp className="h-4 w-4 mr-2" />
          Usage Status
        </CardTitle>
        {usageData.requires_upgrade && (
          <Badge variant="destructive">
            Action Required
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Critical Warnings */}
        {usageData.warnings.length > 0 && (
          <div className="space-y-2">
            {usageData.warnings.map((warning, index) => (
              <Alert 
                key={index}
                className={
                  warning.level === 'critical' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-yellow-200 bg-yellow-50'
                }
              >
                <AlertTriangle className={`h-4 w-4 ${
                  warning.level === 'critical' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <AlertDescription className={
                  warning.level === 'critical' ? 'text-red-800' : 'text-yellow-800'
                }>
                  {warning.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Usage Meters */}
        <div className="space-y-4">
          {Object.entries(usageData.monthly_usage).map(([resource, usage]) => {
            const limit = usageData.plan_limits[resource as keyof typeof usageData.plan_limits];
            const percentage = usageData.usage_percentages[resource as keyof typeof usageData.usage_percentages];
            const isUnlimited = limit === -1;
            
            return (
              <div key={resource} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {getUsageIcon(resource)}
                    <span className="font-medium">{getResourceLabel(resource)}</span>
                    {getStatusIcon(percentage, isUnlimited)}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {usage} {isUnlimited ? '' : `/ ${limit}`}
                    </span>
                    {!isUnlimited && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({percentage.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
                
                {!isUnlimited && (
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    // Apply custom color based on usage level
                    style={{
                      '--progress-background': getProgressColor(percentage, isUnlimited)
                    } as React.CSSProperties}
                  />
                )}
                
                {isUnlimited && (
                  <div className="text-xs text-green-600 font-medium">
                    ✨ Unlimited usage
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Credit Balance Warning */}
        {usageData.credits.low_balance && (
          <Alert className="border-orange-200 bg-orange-50">
            <Zap className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Credit balance is running low ({usageData.credits.balance} remaining).
              Consider purchasing more credits or upgrading your plan.
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade Prompt */}
        {usageData.requires_upgrade && onUpgrade && (
          <div className="pt-4 border-t">
            <Button 
              onClick={onUpgrade} 
              className="w-full"
              variant="default"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        )}

        {/* Usage Summary */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Monthly usage resets on the 1st of each month. 
          Current period: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageStatusCard;