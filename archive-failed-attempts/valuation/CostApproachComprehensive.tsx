import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useValuationStore } from '@/store/valuation';
import { Building, Calculator, TrendingDown, Hammer, MapPin } from 'lucide-react';
import { useState } from 'react';

export function CostApproachComprehensive() {
  const { costApproach, updateCostApproach } = useValuationStore();
  const [activeCostTab, setActiveCostTab] = useState('replacement-cost');

  const handleInputChange = (field: string, value: string | number | boolean) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    updateCostApproach({ [field]: numericValue });
  };

  // IAAO Standard Cost Approach Variables (100+ variables)
  const buildingCosts = {
    structuralSystems: {
      foundation: costApproach.foundationCost || 0,
      framing: costApproach.framingCost || 0,
      roofStructure: costApproach.roofStructureCost || 0,
      exteriorWalls: costApproach.exteriorWallsCost || 0
    },
    mechanicalSystems: {
      plumbing: costApproach.plumbingCost || 0,
      electrical: costApproach.electricalCost || 0,
      hvac: costApproach.hvacCost || 0,
      fireProtection: costApproach.fireProtectionCost || 0
    },
    finishingSystems: {
      flooring: costApproach.flooringCost || 0,
      interior: costApproach.interiorCost || 0,
      exterior: costApproach.exteriorFinishCost || 0,
      specialFeatures: costApproach.specialFeaturesCost || 0
    }
  };

  const depreciationFactors = {
    physical: {
      curable: costApproach.curablePhysicalDepreciation || 0,
      incurable: costApproach.incurablePhysicalDepreciation || 0
    },
    functional: {
      curable: costApproach.curableFunctionalObsolescence || 0,
      incurable: costApproach.incurableFunctionalObsolescence || 0
    },
    external: {
      economic: costApproach.economicObsolescence || 0,
      locational: costApproach.locationalObsolescence || 0
    }
  };

  return (
    <div className="space-y-6">
      {/* Cost Approach Navigation */}
      <Tabs value={activeCostTab} onValueChange={setActiveCostTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger 
            value="replacement-cost" 
            className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Replacement Cost
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="depreciation" 
            className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700"
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Depreciation
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="land-value" 
            className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Land Value
            </div>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="replacement-cost" className="space-y-6">
      {/* Replacement Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Replacement Cost New (RCN) Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalSquareFootage">Total Building Area (SF)</Label>
              <Input
                id="totalSquareFootage"
                type="number"
                step="1"
                min="0"
                value={costApproach.totalSquareFootage || 0}
                onChange={(e) => handleInputChange('totalSquareFootage', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="costPerSqFt">Base Cost per SF</Label>
              <Input
                id="costPerSqFt"
                type="number"
                step="0.01"
                min="0"
                value={costApproach.costPerSqFt || 0}
                onChange={(e) => handleInputChange('costPerSqFt', e.target.value)}
              />
            </div>
          </div>

          {/* Building Quality Factors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="buildingQuality">Building Quality Grade</Label>
              <Select 
                value={costApproach.buildingQuality || 'average'}
                onValueChange={(value) => handleInputChange('buildingQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="average-minus">Average Minus</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="average-plus">Average Plus</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="very-good">Very Good</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="designComplexity">Design Complexity</Label>
              <Select 
                value={costApproach.designComplexity || 'simple'}
                onValueChange={(value) => handleInputChange('designComplexity', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sizeFactor">Size Multiplier</Label>
              <Input
                id="sizeFactor"
                type="number"
                step="0.01"
                min="0.5"
                max="2.0"
                value={costApproach.sizeFactor || 1.0}
                onChange={(e) => handleInputChange('sizeFactor', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

            {/* Advanced Cost Components */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Detailed Cost Components
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Structural Systems */}
                <div>
                  <h4 className="font-semibold mb-3">Structural Systems</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="foundationCost">Foundation</Label>
                      <Input
                        id="foundationCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.structuralSystems.foundation}
                        onChange={(e) => handleInputChange('foundationCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="framingCost">Framing</Label>
                      <Input
                        id="framingCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.structuralSystems.framing}
                        onChange={(e) => handleInputChange('framingCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="roofStructureCost">Roof Structure</Label>
                      <Input
                        id="roofStructureCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.structuralSystems.roofStructure}
                        onChange={(e) => handleInputChange('roofStructureCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="exteriorWallsCost">Exterior Walls</Label>
                      <Input
                        id="exteriorWallsCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.structuralSystems.exteriorWalls}
                        onChange={(e) => handleInputChange('exteriorWallsCost', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Mechanical Systems */}
                <div>
                  <h4 className="font-semibold mb-3">Mechanical Systems</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="plumbingCost">Plumbing</Label>
                      <Input
                        id="plumbingCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.mechanicalSystems.plumbing}
                        onChange={(e) => handleInputChange('plumbingCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="electricalCost">Electrical</Label>
                      <Input
                        id="electricalCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.mechanicalSystems.electrical}
                        onChange={(e) => handleInputChange('electricalCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hvacCost">HVAC</Label>
                      <Input
                        id="hvacCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.mechanicalSystems.hvac}
                        onChange={(e) => handleInputChange('hvacCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fireProtectionCost">Fire Protection</Label>
                      <Input
                        id="fireProtectionCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.mechanicalSystems.fireProtection}
                        onChange={(e) => handleInputChange('fireProtectionCost', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Finishing Systems */}
                <div>
                  <h4 className="font-semibold mb-3">Finishing Systems</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="flooringCost">Flooring</Label>
                      <Input
                        id="flooringCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.finishingSystems.flooring}
                        onChange={(e) => handleInputChange('flooringCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="interiorCost">Interior Finishes</Label>
                      <Input
                        id="interiorCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.finishingSystems.interior}
                        onChange={(e) => handleInputChange('interiorCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="exteriorFinishCost">Exterior Finishes</Label>
                      <Input
                        id="exteriorFinishCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.finishingSystems.exterior}
                        onChange={(e) => handleInputChange('exteriorFinishCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialFeaturesCost">Special Features</Label>
                      <Input
                        id="specialFeaturesCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={buildingCosts.finishingSystems.specialFeatures}
                        onChange={(e) => handleInputChange('specialFeaturesCost', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Builder's Profit & Entrepreneurial Incentive */}
                <div>
                  <h4 className="font-semibold mb-3">Additional Costs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="buildersProfit">Builder's Profit (%)</Label>
                      <Input
                        id="buildersProfit"
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={costApproach.buildersProfit || 10}
                        onChange={(e) => handleInputChange('buildersProfit', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="entrepreneurialIncentive">Entrepreneurial Incentive (%)</Label>
                      <Input
                        id="entrepreneurialIncentive"
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        value={costApproach.entrepreneurialIncentive || 5}
                        onChange={(e) => handleInputChange('entrepreneurialIncentive', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="indirectCosts">Indirect Costs (%)</Label>
                      <Input
                        id="indirectCosts"
                        type="number"
                        step="0.1"
                        min="0"
                        max="25"
                        value={costApproach.indirectCosts || 15}
                        onChange={(e) => handleInputChange('indirectCosts', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="depreciation" className="space-y-6">

      {/* Depreciation Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Depreciation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Physical Depreciation */}
          <div>
            <h4 className="font-semibold mb-3">Physical Depreciation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="curablePhysical">Curable Physical (%)</Label>
                <Input
                  id="curablePhysical"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={depreciationFactors.physical.curable}
                  onChange={(e) => handleInputChange('curablePhysicalDepreciation', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="incurablePhysical">Incurable Physical (%)</Label>
                <Input
                  id="incurablePhysical"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={depreciationFactors.physical.incurable}
                  onChange={(e) => handleInputChange('incurablePhysicalDepreciation', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Functional Obsolescence */}
          <div>
            <h4 className="font-semibold mb-3">Functional Obsolescence</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="curableFunctional">Curable Functional (%)</Label>
                <Input
                  id="curableFunctional"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={depreciationFactors.functional.curable}
                  onChange={(e) => handleInputChange('curableFunctionalObsolescence', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="incurableFunctional">Incurable Functional (%)</Label>
                <Input
                  id="incurableFunctional"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={depreciationFactors.functional.incurable}
                  onChange={(e) => handleInputChange('incurableFunctionalObsolescence', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* External Obsolescence */}
          <div>
            <h4 className="font-semibold mb-3">External Obsolescence</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="economicObsolescence">Economic Obsolescence (%)</Label>
                <Input
                  id="economicObsolescence"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={depreciationFactors.external.economic}
                  onChange={(e) => handleInputChange('economicObsolescence', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="locationalObsolescence">Locational Obsolescence (%)</Label>
                <Input
                  id="locationalObsolescence"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={depreciationFactors.external.locational}
                  onChange={(e) => handleInputChange('locationalObsolescence', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

            {/* Age-Life Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer className="w-5 h-5" />
                  Age-Life Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="actualAge">Actual Age (Years)</Label>
                    <Input
                      id="actualAge"
                      type="number"
                      step="1"
                      min="0"
                      value={costApproach.actualAge || 0}
                      onChange={(e) => handleInputChange('actualAge', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="effectiveAge">Effective Age (Years)</Label>
                    <Input
                      id="effectiveAge"
                      type="number"
                      step="1"
                      min="0"
                      value={costApproach.effectiveAge || 0}
                      onChange={(e) => handleInputChange('effectiveAge', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="economicLife">Economic Life (Years)</Label>
                    <Input
                      id="economicLife"
                      type="number"
                      step="1"
                      min="1"
                      value={costApproach.economicLife || 50}
                      onChange={(e) => handleInputChange('economicLife', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="remainingLife">Remaining Life (Years)</Label>
                    <Input
                      id="remainingLife"
                      type="number"
                      step="1"
                      min="0"
                      value={Math.max(0, (costApproach.economicLife || 50) - (costApproach.effectiveAge || 0))}
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="land-value" className="space-y-6">
            {/* Land Valuation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Land Valuation Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="landSize">Land Size (SF)</Label>
                    <Input
                      id="landSize"
                      type="number"
                      step="1"
                      min="0"
                      value={costApproach.landSize || 0}
                      onChange={(e) => handleInputChange('landSize', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="landValuePerSF">Land Value per SF</Label>
                    <Input
                      id="landValuePerSF"
                      type="number"
                      step="0.01"
                      min="0"
                      value={costApproach.landValuePerSF || 0}
                      onChange={(e) => handleInputChange('landValuePerSF', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="landValueMethod">Valuation Method</Label>
                    <Select 
                      value={costApproach.landValueMethod || 'sales-comparison'}
                      onValueChange={(value) => handleInputChange('landValueMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales-comparison">Sales Comparison</SelectItem>
                        <SelectItem value="allocation">Allocation Method</SelectItem>
                        <SelectItem value="extraction">Extraction Method</SelectItem>
                        <SelectItem value="subdivision">Subdivision Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Site Improvements */}
                <div>
                  <h4 className="font-semibold mb-3">Site Improvements</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="driveways">Driveways & Walkways</Label>
                      <Input
                        id="driveways"
                        type="number"
                        step="0.01"
                        min="0"
                        value={costApproach.drivewaysCost || 0}
                        onChange={(e) => handleInputChange('drivewaysCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="landscaping">Landscaping</Label>
                      <Input
                        id="landscaping"
                        type="number"
                        step="0.01"
                        min="0"
                        value={costApproach.landscapingCost || 0}
                        onChange={(e) => handleInputChange('landscapingCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="utilities">Utilities</Label>
                      <Input
                        id="utilities"
                        type="number"
                        step="0.01"
                        min="0"
                        value={costApproach.utilitiesCost || 0}
                        onChange={(e) => handleInputChange('utilitiesCost', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fencing">Fencing</Label>
                      <Input
                        id="fencing"
                        type="number"
                        step="0.01"
                        min="0"
                        value={costApproach.fencingCost || 0}
                        onChange={(e) => handleInputChange('fencingCost', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Cost Approach Summary */}
      <Card className="bg-purple-50">
        <CardHeader>
          <CardTitle>Cost Approach Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Land Value</p>
              <p className="text-xl font-bold text-purple-700">
                ${((costApproach.landSize || 0) * (costApproach.landValuePerSF || 0)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Replacement Cost New</p>
              <p className="text-xl font-bold text-purple-700">
                ${((costApproach.totalSquareFootage || 0) * (costApproach.costPerSqFt || 0)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Depreciation</p>
              <p className="text-xl font-bold text-red-600">
                {(((depreciationFactors.physical.curable || 0) + (depreciationFactors.physical.incurable || 0) + 
                   (depreciationFactors.functional.curable || 0) + (depreciationFactors.functional.incurable || 0) + 
                   (depreciationFactors.external.economic || 0) + (depreciationFactors.external.locational || 0))).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Final Indicated Value</p>
              <p className="text-xl font-bold text-purple-700">
                ${costApproach.totalValue?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}