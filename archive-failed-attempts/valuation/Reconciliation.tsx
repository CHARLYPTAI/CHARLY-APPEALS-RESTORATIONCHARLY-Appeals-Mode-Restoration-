import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useValuationStore } from '@/store/valuation';
import { Target, TrendingUp, Brain, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface ReconciliationProps {
  incomeValue: number;
  salesValue: number;
  costValue: number;
}

export function Reconciliation({ incomeValue, salesValue, costValue }: ReconciliationProps) {
  const { reconciliation, updateReconciliation, apiValuation } = useValuationStore();
  
  console.log("Reconciliation - Loaded:", { 
    reconciliation, 
    apiValuation, 
    incomeValue, 
    salesValue, 
    costValue 
  });
  const [useAISuggestions, setUseAISuggestions] = useState(false);

  const handleWeightChange = (approach: string, value: string) => {
    const weight = parseFloat(value) || 0;
    const updates: Record<string, number> = { [approach + 'Weight']: weight };
    
    // Auto-adjust other weights to maintain 100% total
    const otherApproaches = ['income', 'sales', 'cost'].filter(a => a !== approach);
    const currentOtherTotal = otherApproaches.reduce((sum, a) => {
      const currentWeight = a === 'income' ? reconciliation.incomeWeight :
                           a === 'sales' ? reconciliation.salesWeight :
                           reconciliation.costWeight;
      return sum + (a === approach ? 0 : currentWeight);
    }, 0);
    
    const remaining = Math.max(0, 100 - weight);
    if (currentOtherTotal > 0 && remaining > 0) {
      const ratio = remaining / currentOtherTotal;
      otherApproaches.forEach(a => {
        const currentWeight = a === 'income' ? reconciliation.incomeWeight :
                             a === 'sales' ? reconciliation.salesWeight :
                             reconciliation.costWeight;
        updates[a + 'Weight'] = Math.round(currentWeight * ratio * 10) / 10;
      });
    }
    
    updateReconciliation(updates);
  };

  const handleApplyAISuggestions = () => {
    updateReconciliation({
      incomeWeight: reconciliation.aiSuggestedWeights.income,
      salesWeight: reconciliation.aiSuggestedWeights.sales,
      costWeight: reconciliation.aiSuggestedWeights.cost
    });
    setUseAISuggestions(true);
  };

  const handleResetWeights = () => {
    updateReconciliation({
      incomeWeight: 50,
      salesWeight: 35,
      costWeight: 15
    });
    setUseAISuggestions(false);
  };

  const totalWeight = reconciliation.incomeWeight + reconciliation.salesWeight + reconciliation.costWeight;
  const weightedValue = reconciliation.weightedValue;
  const finalValue = reconciliation.finalOverride || weightedValue;
  
  const approaches = [
    {
      name: 'Income Approach',
      value: incomeValue,
      weight: reconciliation.incomeWeight,
      color: 'blue',
      icon: '💰',
      reliability: incomeValue > 0 ? 'High' : 'Not Calculated',
      contribution: (incomeValue * reconciliation.incomeWeight / 100)
    },
    {
      name: 'Sales Comparison',
      value: salesValue,
      weight: reconciliation.salesWeight,
      color: 'green',
      icon: '📊',
      reliability: salesValue > 0 ? 'Medium' : 'Not Calculated',
      contribution: (salesValue * reconciliation.salesWeight / 100)
    },
    {
      name: 'Cost Approach',
      value: costValue,
      weight: reconciliation.costWeight,
      color: 'purple',
      icon: '🏗️',
      reliability: costValue > 0 ? 'Medium' : 'Not Calculated',
      contribution: (costValue * reconciliation.costWeight / 100)
    }
  ];

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const variance = Math.max(incomeValue, salesValue, costValue) - Math.min(incomeValue, salesValue, costValue);
  const averageValue = (incomeValue + salesValue + costValue) / 3;
  const variancePercentage = averageValue > 0 ? (variance / averageValue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Weight Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Recommended Weights</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span>Income Approach</span>
                  <Badge variant="outline">{reconciliation.aiSuggestedWeights.income}%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span>Sales Comparison</span>
                  <Badge variant="outline">{reconciliation.aiSuggestedWeights.sales}%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span>Cost Approach</span>
                  <Badge variant="outline">{reconciliation.aiSuggestedWeights.cost}%</Badge>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleApplyAISuggestions} size="sm" variant="outline">
                  Apply Suggestions
                </Button>
                <Button onClick={handleResetWeights} size="sm" variant="ghost">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-2">AI Confidence</h4>
              <p className="text-3xl font-bold text-purple-900">
                {(reconciliation.aiSuggestedWeights.confidence * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-purple-600 mt-2">
                Based on property type, market data availability, and approach reliability.
              </p>
              {useAISuggestions && (
                <div className="mt-3 flex items-center gap-2 text-sm text-purple-700">
                  <CheckCircle className="w-4 h-4" />
                  AI suggestions applied
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approach Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Approach Analysis & Weighting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {approaches.map((approach, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{approach.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{approach.name}</h4>
                        <Badge className={getReliabilityColor(approach.reliability)} variant="secondary">
                          {approach.reliability}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Indicated Value</p>
                    <p className="text-xl font-bold text-gray-900">
                      {approach.value > 0 ? `$${approach.value.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor={`weight-${index}`}>Weight (%)</Label>
                    <Input
                      id={`weight-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={approach.weight}
                      onChange={(e) => handleWeightChange(
                        approach.name.split(' ')[0].toLowerCase(), 
                        e.target.value
                      )}
                      disabled={approach.value <= 0}
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Contribution</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${approach.contribution.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Weight Total Warning */}
            {Math.abs(totalWeight - 100) > 0.1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h5 className="font-medium text-yellow-800">Weight Total: {totalWeight.toFixed(1)}%</h5>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Weights should total 100% for accurate reconciliation. 
                  {totalWeight < 100 ? ' Consider increasing weights.' : ' Consider reducing weights.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Value Variance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Value Variance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <h4 className="font-semibold text-blue-800">Highest Value</h4>
              <p className="text-xl font-bold text-blue-900">
                ${Math.max(incomeValue, salesValue, costValue).toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <h4 className="font-semibold text-red-800">Lowest Value</h4>
              <p className="text-xl font-bold text-red-900">
                ${Math.min(incomeValue, salesValue, costValue).toLocaleString()}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <h4 className="font-semibold text-amber-800">Variance</h4>
              <p className="text-xl font-bold text-amber-900">
                {variancePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
          
          {variancePercentage > 20 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h5 className="font-medium text-yellow-800">High Variance Warning</h5>
              </div>
              <p className="text-sm text-yellow-700">
                The variance between approaches exceeds 20%. This suggests significant differences in 
                underlying assumptions or market conditions. Consider reviewing approach methodologies 
                and market data before finalizing the valuation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weighted Value & Override */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Final Valuation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-6 text-center border-2 border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Weighted Average Value</h4>
                <p className="text-3xl font-bold text-green-900">
                  ${weightedValue.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Based on approach weights: {reconciliation.incomeWeight}% / {reconciliation.salesWeight}% / {reconciliation.costWeight}%
                </p>
              </div>
              
              <div>
                <Label htmlFor="finalOverride">Final Override Value (Optional)</Label>
                <Input
                  id="finalOverride"
                  type="number"
                  value={reconciliation.finalOverride || ''}
                  onChange={(e) => updateReconciliation({ 
                    finalOverride: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="Leave blank to use weighted value"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use only if appraiser judgment requires deviation from weighted result
                </p>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-6 text-center border-3 border-amber-300">
              <h4 className="font-semibold text-amber-800 mb-2">Final Appraised Value</h4>
              <p className="text-4xl font-bold text-amber-900">
                ${finalValue.toLocaleString()}
              </p>
              {reconciliation.finalOverride && (
                <div className="mt-3">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Appraiser Override Applied
                  </Badge>
                  <p className="text-xs text-amber-600 mt-1">
                    Override: ${reconciliation.finalOverride.toLocaleString()} 
                    (vs ${weightedValue.toLocaleString()} weighted)
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appraiser Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Rationale</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="appraiserNotes">Appraiser Notes & Justification</Label>
            <Textarea
              id="appraiserNotes"
              value={reconciliation.appraiserNotes}
              onChange={(e) => updateReconciliation({ appraiserNotes: e.target.value })}
              placeholder="Explain the reasoning behind the approach weights and final value conclusion. Include any market conditions, property-specific factors, or limitations that influenced the reconciliation..."
              rows={6}
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Maximum 2000 characters for compliance documentation
              </p>
              <p className="text-xs text-gray-500">
                {reconciliation.appraiserNotes.length}/2000
              </p>
            </div>
          </div>
          
          {reconciliation.appraiserNotes.length < 50 && finalValue > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Professional Standard:</strong> Include detailed reconciliation rationale 
                explaining weight selection and final value conclusion for USPAP compliance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}