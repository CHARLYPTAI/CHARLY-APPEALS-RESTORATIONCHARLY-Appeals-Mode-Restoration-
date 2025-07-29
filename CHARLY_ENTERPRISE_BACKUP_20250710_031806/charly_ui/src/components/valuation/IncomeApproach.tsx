import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useValuationStore } from '@/store/valuation';
import { Calculator, DollarSign, Percent, ToggleLeft } from 'lucide-react';

export function IncomeApproach() {
  const { incomeApproach, updateIncomeApproach, apiValuation } = useValuationStore();
  
  console.log("IncomeApproach - Loaded:", { incomeApproach, apiValuation });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    updateIncomeApproach({ [field]: numericValue });
  };

  const grossIncome = incomeApproach.rentPerSqFt * incomeApproach.totalRentableArea * 12;
  const effectiveIncome = grossIncome * (1 - incomeApproach.vacancyRate / 100);
  const managementFee = effectiveIncome * (incomeApproach.managementFeeRate / 100);
  const tiReserves = effectiveIncome * (incomeApproach.tiLcReserves / 100);

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

      {/* Vacancy & Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-600" />
            Vacancy & Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-1">Effective Income</h4>
              <p className="text-xl font-bold text-green-900">
                ${effectiveIncome.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                After {incomeApproach.vacancyRate}% vacancy
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-1">Total Deductions</h4>
              <p className="text-xl font-bold text-red-900">
                ${(managementFee + tiReserves).toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                Management: ${managementFee.toLocaleString()} + TI/LC: ${tiReserves.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="rentEscalation"
              checked={incomeApproach.rentEscalation}
              onCheckedChange={(checked) => handleInputChange('rentEscalation', checked)}
            />
            <Label htmlFor="rentEscalation">Include Rent Escalation</Label>
          </div>
        </CardContent>
      </Card>

      {/* Operating Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            Operating Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="operatingExpenses">Annual Operating Expenses</Label>
            <Input
              id="operatingExpenses"
              type="number"
              value={incomeApproach.operatingExpenses}
              onChange={(e) => handleInputChange('operatingExpenses', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="includePropertyTax"
              checked={incomeApproach.includePropertyTax}
              onCheckedChange={(checked) => handleInputChange('includePropertyTax', checked)}
            />
            <Label htmlFor="includePropertyTax">Include Property Tax in Expenses</Label>
          </div>
        </CardContent>
      </Card>

      {/* Capitalization Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-green-600" />
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
                Effective Income - Management - TI/LC - Operating Expenses
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

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Calculation Summary:</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Gross Income: ${grossIncome.toLocaleString()}</p>
              <p>Less Vacancy ({incomeApproach.vacancyRate}%): $({(grossIncome * incomeApproach.vacancyRate / 100).toLocaleString()})</p>
              <p>Effective Income: ${effectiveIncome.toLocaleString()}</p>
              <p>Less Management ({incomeApproach.managementFeeRate}%): $({managementFee.toLocaleString()})</p>
              <p>Less TI/LC Reserves ({incomeApproach.tiLcReserves}%): $({tiReserves.toLocaleString()})</p>
              <p>Less Operating Expenses: $({incomeApproach.operatingExpenses.toLocaleString()})</p>
              <p className="font-semibold pt-2 border-t">Net Operating Income: ${incomeApproach.noi.toLocaleString()}</p>
              <p className="font-semibold">Divided by {incomeApproach.capRate}% Cap Rate = ${incomeApproach.valuationResult.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}