import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useValuationStore } from '@/store/valuation';
import { authService } from '@/lib/auth';
import { IncomeApproachComprehensive } from './valuation/IncomeApproachComprehensive';
import { SalesComparisonComprehensive } from './valuation/SalesComparisonComprehensive';
import { CostApproachComprehensive } from './valuation/CostApproachComprehensive';
import { Reconciliation } from './valuation/Reconciliation';
import { 
  Calculator, 
  TrendingUp, 
  Building, 
  Target, 
  Save, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface ValuationTabsProps {
  propertyId: string;
  propertyAddress?: string;
  onValuationComplete?: (finalValue: number) => void;
}

export function ValuationTabs({ 
  propertyId, 
  propertyAddress,
  onValuationComplete 
}: ValuationTabsProps) {
  const [activeTab, setActiveTab] = useState('income');
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    loading,
    error,
    lastUpdated,
    apiValuation,
    loadValuation,
    saveDraft,
    finalizeValuation,
    calculateIncomeValue,
    calculateSalesValue,
    calculateCostValue,
    calculateWeightedValue
  } = useValuationStore();

  useEffect(() => {
    const loadValuationData = async () => {
      if (propertyId) {
        console.log(`🔄 Loading valuation data for property: ${propertyId}`);
        
        // R3 requirement: Ensure auth is ready before making API calls
        try {
          console.log('Workup: Ensuring auth readiness before valuation API calls...');
          await authService.ensureReady();
          
          await loadValuation(propertyId);
        } catch (error) {
          console.error('Failed to load valuation data:', error);
        }
      }
    };
    
    loadValuationData();
  }, [propertyId, loadValuation]);

  useEffect(() => {
    if (apiValuation) {
      console.log("✅ API Valuation Data Loaded:", apiValuation);
      console.log("📊 Current Store State:", {
        incomeValue: calculateIncomeValue(),
        salesValue: calculateSalesValue(),
        costValue: calculateCostValue(),
        weightedValue: calculateWeightedValue()
      });
    }
  }, [apiValuation, calculateIncomeValue, calculateSalesValue, calculateCostValue, calculateWeightedValue]);

  const handleSaveDraft = async () => {
    setIsDraft(true);
    try {
      await saveDraft();
    } finally {
      setIsDraft(false);
    }
  };

  const handleFinalize = async () => {
    if (isSubmitted || isSubmitting) return; // Prevent double-clicks
    
    setIsSubmitting(true);
    try {
      const result = await finalizeValuation();
      const finalValue = calculateWeightedValue();
      
      // Mark as submitted and disable the button
      setIsSubmitted(true);
      
      // Show success toast
      const { toast } = await import('@/components/ui/use-toast');
      toast({
        title: "✅ Valuation Finalized",
        description: `Valuation submitted successfully. Filing ID: ${result?.filingId || 'N/A'}`,
      });
      
      onValuationComplete?.(finalValue);
    } catch (error) {
      console.error('Failed to finalize valuation:', error);
      
      // Show error toast with FastAPI detail
      const { toast } = await import('@/components/ui/use-toast');
      const errorMessage = error instanceof Error ? error.message : 'Failed to finalize valuation';
      toast({
        title: "Finalization Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incomeValue = calculateIncomeValue();
  const salesValue = calculateSalesValue();
  const costValue = calculateCostValue();
  const weightedValue = calculateWeightedValue();

  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'income':
        return incomeValue > 0 ? 'complete' : 'pending';
      case 'sales':
        return salesValue > 0 ? 'complete' : 'pending';
      case 'cost':
        return costValue > 0 ? 'complete' : 'pending';
      case 'reconciliation':
        return weightedValue > 0 ? 'complete' : 'pending';
      default:
        return 'pending';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading valuation data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Valuation</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadValuation(propertyId)} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Valuation Analysis */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Property Valuation Analysis
              </CardTitle>
              {propertyAddress && (
                <p className="text-gray-600 mt-1">{propertyAddress}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline">Property ID: {propertyId}</Badge>
                {lastUpdated && (
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isDraft}
              >
                <Save className="w-4 h-4 mr-2" />
                {isDraft ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button 
                onClick={handleFinalize}
                disabled={weightedValue <= 0 || isSubmitted || isSubmitting}
                className={isSubmitted ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}
              >
                <Target className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : isSubmitted ? 'Submitted' : 'Finalize'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* API Valuation Summary */}
      {apiValuation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API Valuation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-600">NOI</p>
                <p className="text-xl font-bold text-blue-700">
                  ${apiValuation.noi.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-600">Cap Rate</p>
                <p className="text-xl font-bold text-green-700">
                  {(apiValuation.cap_rate * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-sm font-medium text-purple-600">Expense Ratio</p>
                <p className="text-xl font-bold text-purple-700">
                  {(apiValuation.expense_ratio * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-600">Score</p>
                <p className="text-xl font-bold text-amber-700">
                  {apiValuation.valuation_score}/100
                </p>
              </div>
            </div>
            {apiValuation.flags.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Flags:</p>
                <div className="flex flex-wrap gap-2">
                  {apiValuation.flags.map((flag, index) => (
                    <Badge key={index} variant="secondary">
                      {flag.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Valuation Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Valuation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-600">Income Approach</p>
              <p className="text-xl font-bold text-blue-700">
                {incomeValue > 0 ? `$${incomeValue.toLocaleString()}` : 'Pending'}
              </p>
              <StatusIcon status={getTabStatus('income')} />
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">Sales Comparison</p>
              <p className="text-xl font-bold text-green-700">
                {salesValue > 0 ? `$${salesValue.toLocaleString()}` : 'Pending'}
              </p>
              <StatusIcon status={getTabStatus('sales')} />
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Building className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">Cost Approach</p>
              <p className="text-xl font-bold text-purple-700">
                {costValue > 0 ? `$${costValue.toLocaleString()}` : 'Pending'}
              </p>
              <StatusIcon status={getTabStatus('cost')} />
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center border-2 border-amber-200">
              <Target className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-amber-600">Final Value</p>
              <p className="text-xl font-bold text-amber-700">
                {weightedValue > 0 ? `$${weightedValue.toLocaleString()}` : 'Pending'}
              </p>
              <StatusIcon status={getTabStatus('reconciliation')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger 
              value="income" 
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Income
                <StatusIcon status={getTabStatus('income')} />
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="sales"
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sales
                <StatusIcon status={getTabStatus('sales')} />
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="cost"
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Cost
                <StatusIcon status={getTabStatus('cost')} />
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="reconciliation"
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Reconciliation
                <StatusIcon status={getTabStatus('reconciliation')} />
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="income" className="space-y-4">
              <IncomeApproachComprehensive />
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <SalesComparisonComprehensive />
            </TabsContent>

            <TabsContent value="cost" className="space-y-4">
              <CostApproachComprehensive />
            </TabsContent>

            <TabsContent value="reconciliation" className="space-y-4">
              <Reconciliation 
                incomeValue={incomeValue}
                salesValue={salesValue}
                costValue={costValue}
              />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}