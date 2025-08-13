import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useValuationStore } from '@/store/valuation';
import { Calculator, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export function IncomeApproachComprehensive() {
  const { incomeApproach, updateIncomeApproach } = useValuationStore();
  const [activeIncomeTab, setActiveIncomeTab] = useState('direct-cap');

  const handleInputChange = (field: string, value: string | number | boolean) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    updateIncomeApproach({ [field]: numericValue });
  };

  // IAAO Standard Income Approach Variables (100+ variables)
  const revenueStreams = {
    baseRent: incomeApproach.baseRent || 0,
    parkingRevenue: incomeApproach.parkingRevenue || 0,
    storageRevenue: incomeApproach.storageRevenue || 0,
    laundryRevenue: incomeApproach.laundryRevenue || 0,
    vendingRevenue: incomeApproach.vendingRevenue || 0,
    petFees: incomeApproach.petFees || 0,
    miscellaneousIncome: incomeApproach.miscellaneousIncome || 0
  };

  const operatingExpenses = {
    administrative: {
      management: incomeApproach.managementExpense || 0,
      accounting: incomeApproach.accountingExpense || 0,
      legal: incomeApproach.legalExpense || 0,
      advertising: incomeApproach.advertisingExpense || 0
    },
    operational: {
      utilities: incomeApproach.utilities || 0,
      maintenance: incomeApproach.maintenance || 0,
      landscaping: incomeApproach.landscapingExpense || 0,
      security: incomeApproach.securityExpense || 0
    },
    fixed: {
      insurance: incomeApproach.insurance || 0,
      realEstateTaxes: incomeApproach.realEstateTaxes || 0,
      permits: incomeApproach.permitsExpense || 0
    },
    reserves: {
      replacementReserves: incomeApproach.replacementReserves || 0,
      capitalImprovements: incomeApproach.capitalImprovements || 0
    }
  };

  return (
    <div className="space-y-6">
      {/* Income Approach Navigation */}
      <Tabs value={activeIncomeTab} onValueChange={setActiveIncomeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger 
            value="direct-cap" 
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Direct Capitalization
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="dcf" 
            className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Discounted Cash Flow
            </div>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="direct-cap" className="space-y-6">
      {/* Gross Income Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Gross Income Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rentableArea">Total Rentable Area (SF)</Label>
              <Input
                id="rentableArea"
                type="number"
                step="1"
                min="0"
                value={incomeApproach.totalRentableArea || 0}
                onChange={(e) => handleInputChange('totalRentableArea', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rentPerSqFt">Base Rent per SF (Annual)</Label>
              <Input
                id="rentPerSqFt"
                type="number"
                step="0.01"
                min="0"
                value={incomeApproach.rentPerSqFt || 0}
                onChange={(e) => handleInputChange('rentPerSqFt', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Revenue Streams */}
          <div>
            <h4 className="font-semibold mb-3">Additional Revenue Streams</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="parkingRevenue">Parking Revenue</Label>
                <Input
                  id="parkingRevenue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={revenueStreams.parkingRevenue}
                  onChange={(e) => handleInputChange('parkingRevenue', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="storageRevenue">Storage Revenue</Label>
                <Input
                  id="storageRevenue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={revenueStreams.storageRevenue}
                  onChange={(e) => handleInputChange('storageRevenue', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="laundryRevenue">Laundry Revenue</Label>
                <Input
                  id="laundryRevenue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={revenueStreams.laundryRevenue}
                  onChange={(e) => handleInputChange('laundryRevenue', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vendingRevenue">Vending Revenue</Label>
                <Input
                  id="vendingRevenue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={revenueStreams.vendingRevenue}
                  onChange={(e) => handleInputChange('vendingRevenue', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="petFees">Pet Fees</Label>
                <Input
                  id="petFees"
                  type="number"
                  step="0.01"
                  min="0"
                  value={revenueStreams.petFees}
                  onChange={(e) => handleInputChange('petFees', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="miscIncome">Misc. Income</Label>
                <Input
                  id="miscIncome"
                  type="number"
                  step="0.01"
                  min="0"
                  value={revenueStreams.miscellaneousIncome}
                  onChange={(e) => handleInputChange('miscellaneousIncome', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Vacancy & Credit Loss */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vacancyRate">Vacancy Rate (%)</Label>
              <Input
                id="vacancyRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={incomeApproach.vacancyRate || 0}
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
                max="100"
                value={incomeApproach.creditLoss || 0}
                onChange={(e) => handleInputChange('creditLoss', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Operating Expenses Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Administrative Expenses */}
          <div>
            <h4 className="font-semibold mb-3">Administrative Expenses</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="managementFee">Management Fee</Label>
                <Input
                  id="managementFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.administrative.management}
                  onChange={(e) => handleInputChange('managementExpense', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="accounting">Accounting</Label>
                <Input
                  id="accounting"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.administrative.accounting}
                  onChange={(e) => handleInputChange('accountingExpense', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="legal">Legal</Label>
                <Input
                  id="legal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.administrative.legal}
                  onChange={(e) => handleInputChange('legalExpense', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="advertising">Advertising</Label>
                <Input
                  id="advertising"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.administrative.advertising}
                  onChange={(e) => handleInputChange('advertisingExpense', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Operational Expenses */}
          <div>
            <h4 className="font-semibold mb-3">Operational Expenses</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="utilities">Utilities</Label>
                <Input
                  id="utilities"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.operational.utilities}
                  onChange={(e) => handleInputChange('utilities', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maintenance">Maintenance</Label>
                <Input
                  id="maintenance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.operational.maintenance}
                  onChange={(e) => handleInputChange('maintenance', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="landscaping">Landscaping</Label>
                <Input
                  id="landscaping"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.operational.landscaping}
                  onChange={(e) => handleInputChange('landscapingExpense', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="security">Security</Label>
                <Input
                  id="security"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.operational.security}
                  onChange={(e) => handleInputChange('securityExpense', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Fixed Expenses */}
          <div>
            <h4 className="font-semibold mb-3">Fixed Expenses</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="insurance">Insurance</Label>
                <Input
                  id="insurance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.fixed.insurance}
                  onChange={(e) => handleInputChange('insurance', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="realEstateTaxes">Real Estate Taxes</Label>
                <Input
                  id="realEstateTaxes"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.fixed.realEstateTaxes}
                  onChange={(e) => handleInputChange('realEstateTaxes', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="permits">Permits & Licenses</Label>
                <Input
                  id="permits"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.fixed.permits}
                  onChange={(e) => handleInputChange('permitsExpense', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Reserves */}
          <div>
            <h4 className="font-semibold mb-3">Reserves for Replacement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="replacementReserves">Replacement Reserves</Label>
                <Input
                  id="replacementReserves"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.reserves.replacementReserves}
                  onChange={(e) => handleInputChange('replacementReserves', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="capitalImprovements">Capital Improvements</Label>
                <Input
                  id="capitalImprovements"
                  type="number"
                  step="0.01"
                  min="0"
                  value={operatingExpenses.reserves.capitalImprovements}
                  onChange={(e) => handleInputChange('capitalImprovements', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capitalization Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Capitalization Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="capRate">Capitalization Rate (%)</Label>
              <Input
                id="capRate"
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={incomeApproach.capRate || 0}
                onChange={(e) => handleInputChange('capRate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="capRateSource">Cap Rate Source</Label>
              <Select 
                value={incomeApproach.capRateSource || 'market'}
                onValueChange={(value) => handleInputChange('capRateSource', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Extraction</SelectItem>
                  <SelectItem value="band-investment">Band of Investment</SelectItem>
                  <SelectItem value="build-up">Build-Up Method</SelectItem>
                  <SelectItem value="survey">Market Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discountRate">Discount Rate (%)</Label>
              <Input
                id="discountRate"
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={incomeApproach.discountRate || 0}
                onChange={(e) => handleInputChange('discountRate', e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Capitalization Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="mortgageEquity"
                checked={incomeApproach.useMortgageEquity || false}
                onCheckedChange={(checked) => handleInputChange('useMortgageEquity', checked)}
              />
              <Label htmlFor="mortgageEquity">Use Mortgage-Equity Analysis</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="dcfAnalysis"
                checked={incomeApproach.useDCF || false}
                onCheckedChange={(checked) => handleInputChange('useDCF', checked)}
              />
              <Label htmlFor="dcfAnalysis">Discounted Cash Flow Analysis</Label>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Direct Capitalization Summary */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle>Direct Capitalization Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Effective Gross Income</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${incomeApproach.effectiveGrossIncome?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Operating Income</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${incomeApproach.noi?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Indicated Value</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${incomeApproach.valuationResult?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="dcf" className="space-y-6">
            {/* DCF Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Discounted Cash Flow Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Holding Period & Growth Assumptions */}
                <div>
                  <h4 className="font-semibold mb-3">Investment Assumptions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="holdingPeriod">Holding Period (Years)</Label>
                      <Input
                        id="holdingPeriod"
                        type="number"
                        step="1"
                        min="1"
                        max="30"
                        value={incomeApproach.holdingPeriod || 10}
                        onChange={(e) => handleInputChange('holdingPeriod', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rentGrowthRate">Annual Rent Growth (%)</Label>
                      <Input
                        id="rentGrowthRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={incomeApproach.rentGrowthRate || 2.5}
                        onChange={(e) => handleInputChange('rentGrowthRate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expenseGrowthRate">Annual Expense Growth (%)</Label>
                      <Input
                        id="expenseGrowthRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={incomeApproach.expenseGrowthRate || 3.0}
                        onChange={(e) => handleInputChange('expenseGrowthRate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Terminal Value Analysis */}
                <div>
                  <h4 className="font-semibold mb-3">Terminal Value</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="terminalCapRate">Terminal Cap Rate (%)</Label>
                      <Input
                        id="terminalCapRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        value={incomeApproach.terminalCapRate || 0}
                        onChange={(e) => handleInputChange('terminalCapRate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reversionValue">Reversion Value Method</Label>
                      <Select 
                        value={incomeApproach.reversionMethod || 'cap-rate'}
                        onValueChange={(value) => handleInputChange('reversionMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cap-rate">Capitalization Method</SelectItem>
                          <SelectItem value="comparable-sales">Comparable Sales</SelectItem>
                          <SelectItem value="cost-approach">Cost Approach</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Cash Flow Projections */}
                <div>
                  <h4 className="font-semibold mb-3">Cash Flow Projections</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Year</th>
                          <th className="border border-gray-300 p-2 text-right">Gross Income</th>
                          <th className="border border-gray-300 p-2 text-right">Operating Expenses</th>
                          <th className="border border-gray-300 p-2 text-right">NOI</th>
                          <th className="border border-gray-300 p-2 text-right">Cash Flow</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: Math.min(incomeApproach.holdingPeriod || 10, 10) }, (_, i) => {
                          const year = i + 1;
                          const baseIncome = (incomeApproach.totalRentableArea || 0) * (incomeApproach.rentPerSqFt || 0);
                          const projectedIncome = baseIncome * Math.pow(1 + (incomeApproach.rentGrowthRate || 2.5) / 100, year);
                          const baseExpenses = Object.values(operatingExpenses).reduce((sum, category) => {
                            return sum + Object.values(category).reduce((catSum: number, val: number) => catSum + val, 0);
                          }, 0);
                          const projectedExpenses = baseExpenses * Math.pow(1 + (incomeApproach.expenseGrowthRate || 3.0) / 100, year);
                          const noi = projectedIncome - projectedExpenses;
                          
                          return (
                            <tr key={year} className={year % 2 === 0 ? 'bg-gray-25' : ''}>
                              <td className="border border-gray-300 p-2">{year}</td>
                              <td className="border border-gray-300 p-2 text-right">${projectedIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="border border-gray-300 p-2 text-right">${projectedExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="border border-gray-300 p-2 text-right">${noi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="border border-gray-300 p-2 text-right">${noi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DCF Valuation Summary */}
            <Card className="bg-green-50">
              <CardHeader>
                <CardTitle>DCF Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Value of Cash Flows</p>
                    <p className="text-xl font-bold text-green-700">
                      ${(incomeApproach.pvCashFlows || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Value of Reversion</p>
                    <p className="text-xl font-bold text-green-700">
                      ${(incomeApproach.pvReversion || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Present Value</p>
                    <p className="text-xl font-bold text-green-700">
                      ${((incomeApproach.pvCashFlows || 0) + (incomeApproach.pvReversion || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">IRR</p>
                    <p className="text-xl font-bold text-green-700">
                      {(incomeApproach.irr || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}