import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useValuationStore } from '@/store/valuation';
import { Building, DollarSign, TrendingDown, Calculator, AlertTriangle } from 'lucide-react';

export function CostApproach() {
  const { costApproach, updateCostApproach, apiValuation } = useValuationStore();
  
  console.log("CostApproach - Loaded:", { costApproach, apiValuation });

  const handleInputChange = (field: string, value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    updateCostApproach({ [field]: numericValue });
  };

  const baseCost = costApproach.costPerSqFt * costApproach.totalSquareFootage;
  const builderProfitAmount = baseCost * (costApproach.builderProfit / 100);
  const entrepreneurialAmount = baseCost * (costApproach.entrepreneurialIncentive / 100);
  const replacementCostNew = baseCost + builderProfitAmount + entrepreneurialAmount;
  const depreciationAmount = replacementCostNew * (costApproach.depreciationRate / 100);
  const depreciatedValue = replacementCostNew - depreciationAmount;

  const getDepreciationMethodDescription = (method: string) => {
    switch (method) {
      case 'straight_line':
        return 'Assumes constant annual depreciation over the useful life of the improvement.';
      case 'observed':
        return 'Based on actual market evidence of depreciation from comparable properties.';
      case 'age_life':
        return 'Uses the ratio of effective age to total economic life to estimate depreciation.';
      default:
        return '';
    }
  };

  const calculateAgeLifeDepreciation = () => {
    if (costApproach.depreciationMethod === 'age_life' && costApproach.remainingLife > 0) {
      const totalLife = costApproach.remainingLife + 10; // Assuming 10 years of effective age
      const effectiveAge = 10;
      return (effectiveAge / totalLife) * 100;
    }
    return costApproach.depreciationRate;
  };

  return (
    <div className="space-y-6">
      {/* Land Value */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Land Value
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="landValue">Land Value ($)</Label>
              <Input
                id="landValue"
                type="number"
                value={costApproach.landValue}
                onChange={(e) => handleInputChange('landValue', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="landValueSource">Land Value Source</Label>
              <Select 
                value={costApproach.landValueSource} 
                onValueChange={(value) => handleInputChange('landValueSource', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Comparison</SelectItem>
                  <SelectItem value="extraction">Extraction Method</SelectItem>
                  <SelectItem value="allocation">Allocation Method</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Land Value Method</h4>
            <p className="text-sm text-green-700">
              {costApproach.landValueSource === 'sales' && 
                'Based on analysis of comparable vacant land sales in the area.'}
              {costApproach.landValueSource === 'extraction' && 
                'Derived by subtracting improvement value from total property sales.'}
              {costApproach.landValueSource === 'allocation' && 
                'Estimated as a percentage of total property value based on market ratios.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Replacement Cost New */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Replacement Cost New
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costPerSqFt">Cost per Square Foot ($)</Label>
              <Input
                id="costPerSqFt"
                type="number"
                step="0.01"
                value={costApproach.costPerSqFt}
                onChange={(e) => handleInputChange('costPerSqFt', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="totalSquareFootage">Total Square Footage</Label>
              <Input
                id="totalSquareFootage"
                type="number"
                value={costApproach.totalSquareFootage}
                onChange={(e) => handleInputChange('totalSquareFootage', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Base Construction Cost</h4>
            <p className="text-2xl font-bold text-blue-900">
              ${baseCost.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600">
              ${costApproach.costPerSqFt}/sq ft × {costApproach.totalSquareFootage.toLocaleString()} sq ft
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="builderProfit">Builder Profit (%)</Label>
              <Input
                id="builderProfit"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={costApproach.builderProfit}
                onChange={(e) => handleInputChange('builderProfit', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Typical range: 8-15% for commercial properties
              </p>
            </div>
            <div>
              <Label htmlFor="entrepreneurialIncentive">Entrepreneurial Incentive (%)</Label>
              <Input
                id="entrepreneurialIncentive"
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={costApproach.entrepreneurialIncentive}
                onChange={(e) => handleInputChange('entrepreneurialIncentive', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Developer's profit for project coordination and risk
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <h5 className="font-medium text-gray-800">Builder Profit</h5>
              <p className="text-lg font-semibold text-gray-900">
                ${builderProfitAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{costApproach.builderProfit}% of base cost</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h5 className="font-medium text-gray-800">Entrepreneurial Incentive</h5>
              <p className="text-lg font-semibold text-gray-900">
                ${entrepreneurialAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{costApproach.entrepreneurialIncentive}% of base cost</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-200">
              <h5 className="font-medium text-blue-800">Total Replacement Cost</h5>
              <p className="text-lg font-bold text-blue-900">
                ${replacementCostNew.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600">Including all costs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Depreciation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Depreciation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="depreciationMethod">Depreciation Method</Label>
              <Select 
                value={costApproach.depreciationMethod} 
                onValueChange={(value) => handleInputChange('depreciationMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight_line">Straight Line</SelectItem>
                  <SelectItem value="observed">Observed Condition</SelectItem>
                  <SelectItem value="age_life">Age-Life Method</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="depreciationRate">
                {costApproach.depreciationMethod === 'age_life' ? 'Calculated Rate (%)' : 'Depreciation Rate (%)'}
              </Label>
              <Input
                id="depreciationRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={costApproach.depreciationMethod === 'age_life' ? 
                  calculateAgeLifeDepreciation().toFixed(1) : costApproach.depreciationRate}
                onChange={(e) => handleInputChange('depreciationRate', e.target.value)}
                disabled={costApproach.depreciationMethod === 'age_life'}
              />
            </div>
          </div>

          {costApproach.depreciationMethod === 'age_life' && (
            <div>
              <Label htmlFor="remainingLife">Remaining Economic Life (Years)</Label>
              <Input
                id="remainingLife"
                type="number"
                min="0"
                max="100"
                value={costApproach.remainingLife}
                onChange={(e) => handleInputChange('remainingLife', e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Estimated remaining useful economic life of the improvements
              </p>
            </div>
          )}

          <div className="bg-amber-50 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Depreciation Method</h4>
            <p className="text-sm text-amber-700">
              {getDepreciationMethodDescription(costApproach.depreciationMethod)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-lg p-4">
              <h5 className="font-medium text-red-800">Total Depreciation</h5>
              <p className="text-2xl font-bold text-red-900">
                ${depreciationAmount.toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                {(costApproach.depreciationMethod === 'age_life' ? 
                  calculateAgeLifeDepreciation() : costApproach.depreciationRate).toFixed(1)}% of replacement cost
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-800">Depreciated Value</h5>
              <p className="text-2xl font-bold text-green-900">
                ${depreciatedValue.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                After depreciation adjustment
              </p>
            </div>
          </div>

          {costApproach.depreciationRate > 50 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h5 className="font-medium text-yellow-800">High Depreciation Warning</h5>
              </div>
              <p className="text-sm text-yellow-700">
                Depreciation rate exceeds 50%. Consider if this reflects actual market conditions 
                or if the property may have functional or external obsolescence issues.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Cost Approach Value */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            Cost Approach Valuation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Calculation Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Land Value</span>
                  <span className="font-medium">${costApproach.landValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Base Construction Cost</span>
                  <span className="font-medium">${baseCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Builder Profit ({costApproach.builderProfit}%)</span>
                  <span className="font-medium">${builderProfitAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Entrepreneurial Incentive ({costApproach.entrepreneurialIncentive}%)</span>
                  <span className="font-medium">${entrepreneurialAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium">Replacement Cost New</span>
                  <span className="font-semibold">${replacementCostNew.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span>Less: Depreciation ({(costApproach.depreciationMethod === 'age_life' ? 
                    calculateAgeLifeDepreciation() : costApproach.depreciationRate).toFixed(1)}%)</span>
                  <span className="font-medium text-red-700">-${depreciationAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span>Depreciated Improvement Value</span>
                  <span className="font-medium">${depreciatedValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 text-center border-2 border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Cost Approach Value</h4>
              <p className="text-4xl font-bold text-purple-900">
                ${costApproach.totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600 mt-3">
                Land Value + Depreciated Improvements
              </p>
              <p className="text-xs text-purple-600 mt-1">
                ${costApproach.landValue.toLocaleString()} + ${depreciatedValue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}