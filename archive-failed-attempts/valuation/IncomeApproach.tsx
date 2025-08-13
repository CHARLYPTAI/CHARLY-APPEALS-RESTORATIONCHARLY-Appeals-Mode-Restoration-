import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useValuationStore } from '@/store/valuation';
import { Calculator, DollarSign, Percent, TrendingUp } from 'lucide-react';

export function IncomeApproach() {
  const { incomeApproach, updateIncomeApproach, apiValuation } = useValuationStore();
  
  console.log("IncomeApproach - Loaded:", { incomeApproach, apiValuation });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    updateIncomeApproach({ [field]: numericValue });
  };

  const grossIncome = incomeApproach.rentPerSqFt * incomeApproach.totalRentableArea * 12;
  const vacancyLoss = grossIncome * (incomeApproach.vacancyRate / 100);
  const creditLoss = grossIncome * (incomeApproach.creditLoss / 100);
  const effectiveGrossIncome = grossIncome - vacancyLoss - creditLoss;
  const managementFee = effectiveGrossIncome * (incomeApproach.managementFeeRate / 100);
  const tiReserves = effectiveGrossIncome * (incomeApproach.tiLcReserves / 100);
  const totalExpenses = incomeApproach.operatingExpenses + incomeApproach.insurance + 
                       incomeApproach.utilities + incomeApproach.maintenance + 
                       incomeApproach.realEstateTaxes + incomeApproach.otherExpenses + 
                       managementFee + tiReserves;

  return (
    <div className="space-y-6">
      {/* Income Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Income Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rentPerSqFt">Rent per Sq Ft (Annual)</Label>
              <Input
                id="rentPerSqFt"
                type="number"
                step="0.01"
                value={incomeApproach.rentPerSqFt}
                onChange={(e) => handleInputChange('rentPerSqFt', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="totalRentableArea">Total Rentable Area (Sq Ft)</Label>
              <Input
                id="totalRentableArea"
                type="number"
                value={incomeApproach.totalRentableArea}
                onChange={(e) => handleInputChange('totalRentableArea', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="leaseType">Lease Type</Label>
              <Select 
                value={incomeApproach.leaseType} 
                onValueChange={(value) => handleInputChange('leaseType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross">Gross Lease</SelectItem>
                  <SelectItem value="net">Net Lease</SelectItem>
                  <SelectItem value="modified">Modified Gross</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Gross Annual Income</h4>
            <p className="text-2xl font-bold text-blue-900">
              ${grossIncome.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600">
              {incomeApproach.rentPerSqFt} × {incomeApproach.totalRentableArea} × 12 months
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vacancy & Credit Loss */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-600" />
            Vacancy & Credit Loss
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="vacancyRate">Vacancy Rate (%)</Label>
              <Input
                id="vacancyRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={incomeApproach.vacancyRate}
                onChange={(e) => handleInputChange('vacancyRate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="creditLoss">Credit Loss (%)</Label>
              <Input
                id="creditLoss"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={incomeApproach.creditLoss}
                onChange={(e) => handleInputChange('creditLoss', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="managementFeeRate">Management Fee (%)</Label>
              <Input
                id="managementFeeRate"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={incomeApproach.managementFeeRate}
                onChange={(e) => handleInputChange('managementFeeRate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tiLcReserves">TI/LC Reserves (%)</Label>
              <Input
                id="tiLcReserves"
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={incomeApproach.tiLcReserves}
                onChange={(e) => handleInputChange('tiLcReserves', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-1">Effective Gross Income</h4>
              <p className="text-xl font-bold text-green-900">
                ${effectiveGrossIncome.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                After {incomeApproach.vacancyRate}% vacancy + {incomeApproach.creditLoss}% credit loss
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-1">Expense Ratio</h4>
              <p className="text-xl font-bold text-amber-900">
                {incomeApproach.expenseRatio.toFixed(1)}%
              </p>
              <p className="text-sm text-amber-600">
                Total expenses / EGI
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-1">Total Operating Expenses</h4>
              <p className="text-xl font-bold text-red-900">
                ${totalExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                All expenses + management + reserves
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="rentEscalation"
                checked={incomeApproach.rentEscalation}
                onCheckedChange={(checked) => handleInputChange('rentEscalation', checked)}
              />
              <Label htmlFor="rentEscalation">Include Rent Escalation</Label>
            </div>
            {incomeApproach.rentEscalation && (
              <div>
                <Label htmlFor="escalationRate">Annual Escalation Rate (%)</Label>
                <Input
                  id="escalationRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={incomeApproach.escalationRate}
                  onChange={(e) => handleInputChange('escalationRate', e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Operating Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            Operating Expenses Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="operatingExpenses">General Operating Expenses</Label>
              <Input
                id="operatingExpenses"
                type="number"
                value={incomeApproach.operatingExpenses}
                onChange={(e) => handleInputChange('operatingExpenses', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="insurance">Insurance</Label>
              <Input
                id="insurance"
                type="number"
                value={incomeApproach.insurance}
                onChange={(e) => handleInputChange('insurance', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="utilities">Utilities</Label>
              <Input
                id="utilities"
                type="number"
                value={incomeApproach.utilities}
                onChange={(e) => handleInputChange('utilities', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maintenance">Maintenance & Repairs</Label>
              <Input
                id="maintenance"
                type="number"
                value={incomeApproach.maintenance}
                onChange={(e) => handleInputChange('maintenance', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="realEstateTaxes">Real Estate Taxes</Label>
              <Input
                id="realEstateTaxes"
                type="number"
                value={incomeApproach.realEstateTaxes}
                onChange={(e) => handleInputChange('realEstateTaxes', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="otherExpenses">Other Expenses</Label>
              <Input
                id="otherExpenses"
                type="number"
                value={incomeApproach.otherExpenses}
                onChange={(e) => handleInputChange('otherExpenses', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="includePropertyTax"
              checked={incomeApproach.includePropertyTax}
              onCheckedChange={(checked) => handleInputChange('includePropertyTax', checked)}
            />
            <Label htmlFor="includePropertyTax">Include Property Tax in NOI Calculation</Label>
          </div>
        </CardContent>
      </Card>

      {/* Capitalization Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Capitalization Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capRate">Cap Rate (%)</Label>
              <Input
                id="capRate"
                type="number"
                step="0.01"
                min="1"
                max="30"
                value={incomeApproach.capRate}
                onChange={(e) => handleInputChange('capRate', e.target.value)}
                disabled={incomeApproach.capRateSource === 'api'}
              />
            </div>
            <div>
              <Label htmlFor="capRateSource">Cap Rate Source</Label>
              <Select 
                value={incomeApproach.capRateSource} 
                onValueChange={(value) => handleInputChange('capRateSource', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API Derived</SelectItem>
                  <SelectItem value="manual">Manual Override</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {incomeApproach.capRateSource === 'api' && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Using API-derived cap rate:</strong> This rate is calculated from market data and comparable properties.
                Switch to "Manual Override" to input your own rate.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NOI & Valuation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-600" />
            Net Operating Income & Valuation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-amber-50 rounded-lg p-6 text-center">
              <h4 className="font-semibold text-amber-800 mb-2">Net Operating Income</h4>
              <p className="text-3xl font-bold text-amber-900">
                ${incomeApproach.noi.toLocaleString()}
              </p>
              <p className="text-sm text-amber-600 mt-2">
                EGI - All Operating Expenses
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 text-center border-2 border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Income Approach Value</h4>
              <p className="text-3xl font-bold text-blue-900">
                ${incomeApproach.valuationResult.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                NOI ÷ {incomeApproach.capRate}% Cap Rate
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-3">Detailed Calculation Summary:</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Income:</strong></p>
              <p className="ml-4">Gross Potential Income: ${grossIncome.toLocaleString()}</p>
              <p className="ml-4">Less Vacancy ({incomeApproach.vacancyRate}%): $({vacancyLoss.toLocaleString()})</p>
              <p className="ml-4">Less Credit Loss ({incomeApproach.creditLoss}%): $({creditLoss.toLocaleString()})</p>
              <p className="ml-4"><strong>Effective Gross Income: ${effectiveGrossIncome.toLocaleString()}</strong></p>
              
              <p className="mt-3"><strong>Expenses:</strong></p>
              <p className="ml-4">Management ({incomeApproach.managementFeeRate}%): $({managementFee.toLocaleString()})</p>
              <p className="ml-4">TI/LC Reserves ({incomeApproach.tiLcReserves}%): $({tiReserves.toLocaleString()})</p>
              <p className="ml-4">General Operating: $({incomeApproach.operatingExpenses.toLocaleString()})</p>
              <p className="ml-4">Insurance: $({incomeApproach.insurance.toLocaleString()})</p>
              <p className="ml-4">Utilities: $({incomeApproach.utilities.toLocaleString()})</p>
              <p className="ml-4">Maintenance: $({incomeApproach.maintenance.toLocaleString()})</p>
              <p className="ml-4">Real Estate Taxes: $({incomeApproach.realEstateTaxes.toLocaleString()})</p>
              <p className="ml-4">Other Expenses: $({incomeApproach.otherExpenses.toLocaleString()})</p>
              <p className="ml-4"><strong>Total Expenses: $({totalExpenses.toLocaleString()})</strong></p>
              
              <p className="mt-3 pt-3 border-t"><strong>Net Operating Income: ${incomeApproach.noi.toLocaleString()}</strong></p>
              <p><strong>Cap Rate: {incomeApproach.capRate}%</strong></p>
              <p><strong>Income Approach Value: ${incomeApproach.valuationResult.toLocaleString()}</strong></p>
              <p className="text-xs text-gray-500 mt-2">Expense Ratio: {incomeApproach.expenseRatio.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}