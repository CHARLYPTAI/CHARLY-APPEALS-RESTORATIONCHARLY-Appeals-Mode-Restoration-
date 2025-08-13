/**
 * Charged AI Component - Apple CTO Emergency Payment Sprint Week 3-4
 * Wrapper component that handles AI credit charging for any AI operation
 */

import { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { UsageLimitWarning } from './UsageLimitWarning';
import { useFeatureGating, FeatureGateError } from '../../hooks/useFeatureGating';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { useCustomer } from '../../hooks/useStripeHooks';

interface ChargedAIComponentProps {
  creditsRequired: number;
  operationName: string;
  description?: string;
  children: React.ReactNode;
  onExecute: () => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface AIOperationStatus {
  isExecuting: boolean;
  isComplete: boolean;
  error: string | null;
  result: unknown;
}

export function ChargedAIComponent({
  creditsRequired,
  operationName,
  description,
  children,
  onExecute,
  onSuccess,
  onError,
  disabled = false,
  className = ""
}: ChargedAIComponentProps) {
  const [status, setStatus] = useState<AIOperationStatus>({
    isExecuting: false,
    isComplete: false,
    error: null,
    result: null
  });

  const { executeWithGating } = useFeatureGating();
  const { metrics } = useUsageTracking();
  const { customer } = useCustomer();

  const handleExecute = useCallback(async () => {
    if (!customer) {
      const error = 'Please log in to use AI features';
      setStatus(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    setStatus({
      isExecuting: true,
      isComplete: false,
      error: null,
      result: null
    });

    try {
      // Execute with automatic gating and usage tracking
      const result = await executeWithGating(
        'ai_generation',
        onExecute,
        creditsRequired
      );

      setStatus({
        isExecuting: false,
        isComplete: true,
        error: null,
        result
      });

      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof FeatureGateError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';

      setStatus({
        isExecuting: false,
        isComplete: false,
        error: errorMessage,
        result: null
      });

      onError?.(errorMessage);
    }
  }, [customer, executeWithGating, onExecute, creditsRequired, onSuccess, onError]);

  const canAfford = metrics ? metrics.aiCreditsRemaining >= creditsRequired : false;
  const isDisabled = disabled || status.isExecuting || !customer;

  return (
    <UsageLimitWarning 
      feature="ai_generation" 
      creditsRequired={creditsRequired}
    >
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {operationName}
              </h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                🤖 {creditsRequired} credits
              </Badge>
              {metrics && (
                <Badge 
                  variant={canAfford ? "default" : "destructive"}
                  className="text-xs"
                >
                  {metrics.aiCreditsRemaining} available
                </Badge>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {status.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 text-sm">⚠️</span>
                <span className="text-red-700 text-sm font-medium">
                  {status.error}
                </span>
              </div>
            </div>
          )}

          {status.isExecuting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-700 text-sm font-medium">
                  Processing AI operation... ({creditsRequired} credits will be charged)
                </span>
              </div>
            </div>
          )}

          {status.isComplete && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-green-500 text-sm">✅</span>
                <span className="text-green-700 text-sm font-medium">
                  Operation completed successfully! {creditsRequired} credits charged.
                </span>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className={status.isExecuting ? 'opacity-50 pointer-events-none' : ''}>
            {children}
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleExecute}
              disabled={isDisabled}
              className="w-full"
              size="lg"
            >
              {status.isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  🚀 {operationName} ({creditsRequired} credits)
                </>
              )}
            </Button>

            {!canAfford && metrics && (
              <div className="text-xs text-gray-500 text-center mt-2">
                Insufficient credits. You have {metrics.aiCreditsRemaining} but need {creditsRequired}.
              </div>
            )}
          </div>
        </div>
      </Card>
    </UsageLimitWarning>
  );
}

// Pre-configured components for common AI operations
export function AINarrativeGenerator({
  propertyData,
  onSuccess,
  onError,
  className
}: {
  propertyData: Record<string, unknown>;
  onSuccess?: (narrative: string) => void;
  onError?: (error: string) => void;
  className?: string;
}) {
  const handleGenerate = async () => {
    // Simulate AI narrative generation
    // In production, this would call your actual AI service
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const narrative = `
EXECUTIVE SUMMARY

Based on comprehensive analysis of the subject property located at ${propertyData.address || 'the subject address'}, we respectfully request a reduction in the current assessed value from $${propertyData.currentAssessment?.toLocaleString() || 'XXX,XXX'} to $${propertyData.estimatedValue?.toLocaleString() || 'XXX,XXX'}.

INCOME APPROACH ANALYSIS

The income approach analysis reveals significant discrepancies in the current assessment methodology. Market rental rates for comparable properties in the area indicate a gross rental multiplier inconsistent with the assessed value. Our analysis of actual rental data from similar properties supports a lower valuation.

SALES COMPARISON APPROACH

Recent sales of comparable properties within the market area demonstrate values substantially below the current assessment. After adjusting for differences in size, condition, and location, the indicated value supports our proposed reduction.

COST APPROACH CONSIDERATIONS

The cost approach, while supportive of construction value, must account for economic obsolescence and market conditions that affect the subject property's value in the current market.

CONCLUSION

The preponderance of evidence from all three approaches to value supports a reduction in the assessed value. We respectfully request your consideration of this appeal and look forward to your response.
    `.trim();

    return narrative;
  };

  return (
    <ChargedAIComponent
      creditsRequired={5}
      operationName="Generate AI Narrative"
      description="Create a professional property tax appeal narrative using AI analysis"
      onExecute={handleGenerate}
      onSuccess={onSuccess}
      onError={onError}
      className={className}
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-600">
          This AI will analyze your property data and generate a comprehensive narrative including:
        </div>
        <ul className="text-sm text-gray-600 space-y-1 ml-4">
          <li>• Executive Summary</li>
          <li>• Income Approach Analysis</li>
          <li>• Sales Comparison Analysis</li>
          <li>• Cost Approach Considerations</li>
          <li>• Professional Conclusion</li>
        </ul>
      </div>
    </ChargedAIComponent>
  );
}

export function AIAppealAnalyzer({
  propertyData,
  onSuccess,
  onError,
  className
}: {
  propertyData: Record<string, unknown>;
  onSuccess?: (analysis: unknown) => void;
  onError?: (error: string) => void;
  className?: string;
}) {
  const handleAnalyze = async () => {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysis = {
      appealProbability: 0.78,
      estimatedSavings: Math.floor((propertyData.currentAssessment as number) * 0.15),
      recommendedStrategy: 'multi_approach',
      keyFactors: [
        'Market conditions favor reassessment',
        'Recent comparable sales support lower value',
        'Income approach indicates over-assessment'
      ]
    };

    return analysis;
  };

  return (
    <ChargedAIComponent
      creditsRequired={3}
      operationName="Analyze Appeal Potential"
      description="AI-powered analysis of your property's appeal probability and potential savings"
      onExecute={handleAnalyze}
      onSuccess={onSuccess}
      onError={onError}
      className={className}
    >
      <div className="text-sm text-gray-600">
        Our AI will analyze market data, comparable sales, and assessment patterns to determine 
        your property's appeal probability and estimated potential savings.
      </div>
    </ChargedAIComponent>
  );
}

export function AIComparableSearch({
  propertyData,
  onSuccess,
  onError,
  className
}: {
  propertyData: Record<string, unknown>;
  onSuccess?: (comparables: unknown[]) => void;
  onError?: (error: string) => void;
  className?: string;
}) {
  const handleSearch = async () => {
    // Simulate AI comparable search
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const comparables = [
      {
        address: '123 Similar St',
        salePrice: (propertyData.currentAssessment as number) * 0.85,
        saleDate: '2024-01-15',
        similarity: 0.92
      },
      {
        address: '456 Comparable Ave',
        salePrice: (propertyData.currentAssessment as number) * 0.78,
        saleDate: '2024-02-08',
        similarity: 0.88
      }
    ];

    return comparables;
  };

  return (
    <ChargedAIComponent
      creditsRequired={7}
      operationName="Find AI Comparables"
      description="Advanced AI search for the most relevant comparable property sales"
      onExecute={handleSearch}
      onSuccess={onSuccess}
      onError={onError}
      className={className}
    >
      <div className="text-sm text-gray-600">
        AI will search through thousands of property sales to find the most relevant 
        comparables for your appeal, ranked by similarity and adjusted for differences.
      </div>
    </ChargedAIComponent>
  );
}