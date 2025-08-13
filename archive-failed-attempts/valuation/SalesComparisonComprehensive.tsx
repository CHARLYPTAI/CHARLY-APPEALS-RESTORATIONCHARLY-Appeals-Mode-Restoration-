import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useValuationStore } from '@/store/valuation';
import { type PropertyComparable } from '@/store/valuation';
import { TrendingUp, Building, MapPin, Trash2, Plus, ChevronDown, ChevronRight, Calculator, BarChart3 } from 'lucide-react';

export function SalesComparisonComprehensive() {
  const { salesComparison, updateSalesComparison, addComparable, removeComparable, updateComparable } = useValuationStore();
  const [newCompAddress, setNewCompAddress] = useState('');
  const [expandedComparables, setExpandedComparables] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('comparables');

  const toggleComparable = (id: string) => {
    const newExpanded = new Set(expandedComparables);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedComparables(newExpanded);
  };

  const handleCompChange = (id: string, field: string, value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    updateComparable(id, { [field]: numericValue });
  };

  const addNewComparable = () => {
    if (!newCompAddress.trim()) return;
    
    const newComp: PropertyComparable = {
      id: `comp_${Date.now()}`,
      address: newCompAddress,
      salePrice: 0,
      saleDate: new Date().toISOString().split('T')[0],
      squareFootage: 0,
      pricePerSqFt: 0,
      timeAdjustment: 0,
      locationAdjustment: 0,
      ageAdjustment: 0,
      qualityAdjustment: 0,
      weight: 25,
      confidence: 'medium',
      zoningCompatibility: 8,
      // Additional IAAO variables
      lotSize: 0,
      buildingArea: 0,
      parkingSpaces: 0,
      storiesCount: 1,
      yearBuilt: 2000,
      constructionQuality: 'average',
      conditionRating: 'average',
      marketConditionsAdjustment: 0,
      financingAdjustment: 0,
      conditionsOfSaleAdjustment: 0
    };
    
    addComparable(newComp);
    setNewCompAddress('');
  };

  const getAdjustedPrice = (comp: PropertyComparable) => {
    const basePrice = comp.pricePerSqFt;
    const adjustments = 1 + 
      (comp.timeAdjustment / 100) +
      (comp.locationAdjustment / 100) +
      (comp.ageAdjustment / 100) +
      (comp.qualityAdjustment / 100) +
      ((comp.marketConditionsAdjustment || 0) / 100) +
      ((comp.financingAdjustment || 0) / 100) +
      ((comp.conditionsOfSaleAdjustment || 0) / 100);
    
    return basePrice * adjustments;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sales Approach Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Sales Comparison Approach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger 
                value="comparables" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Comparable Sales
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="adjustments"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Market Adjustments
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Statistical Analysis
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="comparables" className="space-y-6">
                {/* Subject Property Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Subject Property Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="subjectSquareFootage">Building Square Footage</Label>
                        <Input
                          id="subjectSquareFootage"
                          type="number"
                          step="1"
                          min="0"
                          value={salesComparison.subjectSquareFootage || 0}
                          onChange={(e) => updateSalesComparison({ subjectSquareFootage: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subjectLotSize">Lot Size (SF)</Label>
                        <Input
                          id="subjectLotSize"
                          type="number"
                          step="1"
                          min="0"
                          value={salesComparison.subjectLotSize || 0}
                          onChange={(e) => updateSalesComparison({ subjectLotSize: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subjectYearBuilt">Year Built</Label>
                        <Input
                          id="subjectYearBuilt"
                          type="number"
                          step="1"
                          min="1800"
                          max={new Date().getFullYear()}
                          value={salesComparison.subjectYearBuilt || 2000}
                          onChange={(e) => updateSalesComparison({ subjectYearBuilt: parseFloat(e.target.value) || 2000 })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

      {/* Comparable Properties */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Comparable Properties Analysis
            </CardTitle>
            <Badge variant="outline">
              {salesComparison.comparables?.length || 0} Comparables
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Comparable */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter comparable property address"
              value={newCompAddress}
              onChange={(e) => setNewCompAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewComparable()}
            />
            <Button onClick={addNewComparable} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Comparable
            </Button>
          </div>

          {/* Comparable Properties List */}
          {salesComparison.comparables?.map((comp, index) => (
            <Collapsible 
              key={comp.id} 
              open={expandedComparables.has(comp.id)}
              onOpenChange={() => toggleComparable(comp.id)}
            >
              <div className="border rounded-lg border-l-4 border-l-blue-500">
                <CollapsibleTrigger asChild>
                  <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {expandedComparables.has(comp.id) ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Comparable #{index + 1}
                        </h4>
                        <p className="text-sm text-gray-600">{comp.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">${getAdjustedPrice(comp).toFixed(2)}/SF</p>
                        <p className="text-xs text-gray-500">Adjusted Price</p>
                      </div>
                      <Badge className={getConfidenceColor(comp.confidence)}>
                        {comp.confidence}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeComparable(comp.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                {/* Basic Sale Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`salePrice-${comp.id}`}>Sale Price</Label>
                    <Input
                      id={`salePrice-${comp.id}`}
                      type="number"
                      step="1"
                      min="0"
                      value={comp.salePrice}
                      onChange={(e) => handleCompChange(comp.id, 'salePrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`saleDate-${comp.id}`}>Sale Date</Label>
                    <Input
                      id={`saleDate-${comp.id}`}
                      type="date"
                      value={comp.saleDate}
                      onChange={(e) => handleCompChange(comp.id, 'saleDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`squareFootage-${comp.id}`}>Square Footage</Label>
                    <Input
                      id={`squareFootage-${comp.id}`}
                      type="number"
                      step="1"
                      min="0"
                      value={comp.squareFootage}
                      onChange={(e) => handleCompChange(comp.id, 'squareFootage', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`pricePerSqFt-${comp.id}`}>Price per SF</Label>
                    <Input
                      id={`pricePerSqFt-${comp.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={comp.squareFootage > 0 ? (comp.salePrice / comp.squareFootage).toFixed(2) : 0}
                      onChange={(e) => handleCompChange(comp.id, 'pricePerSqFt', e.target.value)}
                    />
                  </div>
                </div>

                {/* Physical Characteristics */}
                <div>
                  <h5 className="font-medium mb-2">Physical Characteristics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`lotSize-${comp.id}`}>Lot Size (SF)</Label>
                      <Input
                        id={`lotSize-${comp.id}`}
                        type="number"
                        step="1"
                        min="0"
                        value={comp.lotSize || 0}
                        onChange={(e) => handleCompChange(comp.id, 'lotSize', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`yearBuilt-${comp.id}`}>Year Built</Label>
                      <Input
                        id={`yearBuilt-${comp.id}`}
                        type="number"
                        step="1"
                        min="1800"
                        max={new Date().getFullYear()}
                        value={comp.yearBuilt || 2000}
                        onChange={(e) => handleCompChange(comp.id, 'yearBuilt', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`parkingSpaces-${comp.id}`}>Parking Spaces</Label>
                      <Input
                        id={`parkingSpaces-${comp.id}`}
                        type="number"
                        step="1"
                        min="0"
                        value={comp.parkingSpaces || 0}
                        onChange={(e) => handleCompChange(comp.id, 'parkingSpaces', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`storiesCount-${comp.id}`}>Stories</Label>
                      <Input
                        id={`storiesCount-${comp.id}`}
                        type="number"
                        step="1"
                        min="1"
                        value={comp.storiesCount || 1}
                        onChange={(e) => handleCompChange(comp.id, 'storiesCount', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Quality and Condition */}
                <div>
                  <h5 className="font-medium mb-2">Quality and Condition</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`constructionQuality-${comp.id}`}>Construction Quality</Label>
                      <Select 
                        value={comp.constructionQuality || 'average'}
                        onValueChange={(value) => handleCompChange(comp.id, 'constructionQuality', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`conditionRating-${comp.id}`}>Condition Rating</Label>
                      <Select 
                        value={comp.conditionRating || 'average'}
                        onValueChange={(value) => handleCompChange(comp.id, 'conditionRating', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Adjustments */}
                <div>
                  <h5 className="font-medium mb-2">Adjustments (%)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`timeAdj-${comp.id}`}>Time</Label>
                      <Input
                        id={`timeAdj-${comp.id}`}
                        type="number"
                        step="0.1"
                        value={comp.timeAdjustment}
                        onChange={(e) => handleCompChange(comp.id, 'timeAdjustment', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`locationAdj-${comp.id}`}>Location</Label>
                      <Input
                        id={`locationAdj-${comp.id}`}
                        type="number"
                        step="0.1"
                        value={comp.locationAdjustment}
                        onChange={(e) => handleCompChange(comp.id, 'locationAdjustment', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`ageAdj-${comp.id}`}>Age/Condition</Label>
                      <Input
                        id={`ageAdj-${comp.id}`}
                        type="number"
                        step="0.1"
                        value={comp.ageAdjustment}
                        onChange={(e) => handleCompChange(comp.id, 'ageAdjustment', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`qualityAdj-${comp.id}`}>Quality</Label>
                      <Input
                        id={`qualityAdj-${comp.id}`}
                        type="number"
                        step="0.1"
                        value={comp.qualityAdjustment}
                        onChange={(e) => handleCompChange(comp.id, 'qualityAdjustment', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Adjustments */}
                <div>
                  <h5 className="font-medium mb-2">Advanced Adjustments (%)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`marketAdj-${comp.id}`}>Market Conditions</Label>
                      <Input
                        id={`marketAdj-${comp.id}`}
                        type="number"
                        step="0.1"
                        value={comp.marketConditionsAdjustment || 0}
                        onChange={(e) => handleCompChange(comp.id, 'marketConditionsAdjustment', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`financingAdj-${comp.id}`}>Financing</Label>
                      <Input
                        id={`financingAdj-${comp.id}`}
                        type="number"
                        step="0.1"
                        value={comp.financingAdjustment || 0}
                        onChange={(e) => handleCompChange(comp.id, 'financingAdjustment', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`conditionsAdj-${comp.id}`}>Conditions of Sale</Label>
                      <Input
                        id={`conditionsAdj-${comp.id}`}
                        type="number"
                        step="0.1"
                        value={comp.conditionsOfSaleAdjustment || 0}
                        onChange={(e) => handleCompChange(comp.id, 'conditionsOfSaleAdjustment', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                    {/* Weighting and Results */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`weight-${comp.id}`}>Weight (%)</Label>
                          <Input
                            id={`weight-${comp.id}`}
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={comp.weight}
                            onChange={(e) => handleCompChange(comp.id, 'weight', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Adjusted Price per SF</Label>
                          <p className="text-lg font-semibold text-green-600">
                            ${getAdjustedPrice(comp).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <Label>Indicated Value</Label>
                          <p className="text-lg font-semibold text-blue-600">
                            ${(getAdjustedPrice(comp) * (salesComparison.subjectSquareFootage || 0)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

              </TabsContent>

              <TabsContent value="adjustments" className="space-y-6">
                {/* Market Conditions Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Market Conditions & Adjustments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overall Market Conditions */}
                    <div>
                      <h4 className="font-semibold mb-4">Overall Market Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="marketTrend">Market Trend</Label>
                          <Select defaultValue="stable">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="declining">Declining</SelectItem>
                              <SelectItem value="stable">Stable</SelectItem>
                              <SelectItem value="improving">Improving</SelectItem>
                              <SelectItem value="rapid-growth">Rapid Growth</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="marketActivity">Market Activity Level</Label>
                          <Select defaultValue="moderate">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="very-high">Very High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="supplyDemand">Supply/Demand Balance</Label>
                          <Select defaultValue="balanced">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="oversupply">Oversupply</SelectItem>
                              <SelectItem value="balanced">Balanced</SelectItem>
                              <SelectItem value="undersupply">Undersupply</SelectItem>
                              <SelectItem value="severe-shortage">Severe Shortage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Time Adjustments */}
                    <div>
                      <h4 className="font-semibold mb-4">Time Adjustment Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="priceAppreciation">Annual Price Appreciation (%)</Label>
                          <Input
                            id="priceAppreciation"
                            type="number"
                            step="0.1"
                            placeholder="3.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="marketVolatility">Market Volatility Factor</Label>
                          <Select defaultValue="low">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="very-low">Very Low</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="very-high">Very High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Location Adjustment Factors */}
                    <div>
                      <h4 className="font-semibold mb-4">Location Adjustment Factors</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="proximityTransport">Proximity to Transportation</Label>
                          <Select defaultValue="average">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="poor">Poor</SelectItem>
                              <SelectItem value="below-average">Below Average</SelectItem>
                              <SelectItem value="average">Average</SelectItem>
                              <SelectItem value="above-average">Above Average</SelectItem>
                              <SelectItem value="excellent">Excellent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="neighborhoodQuality">Neighborhood Quality</Label>
                          <Select defaultValue="average">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="poor">Poor</SelectItem>
                              <SelectItem value="below-average">Below Average</SelectItem>
                              <SelectItem value="average">Average</SelectItem>
                              <SelectItem value="above-average">Above Average</SelectItem>
                              <SelectItem value="excellent">Excellent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="commercialActivity">Commercial Activity Level</Label>
                          <Select defaultValue="moderate">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="very-high">Very High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Physical Adjustment Guidelines */}
                    <div>
                      <h4 className="font-semibold mb-4">Physical Adjustment Guidelines</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sizeAdjustment">Size Adjustment per SF Difference (%)</Label>
                          <Input
                            id="sizeAdjustment"
                            type="number"
                            step="0.01"
                            placeholder="0.05"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ageAdjustmentRate">Age Adjustment per Year (%)</Label>
                          <Input
                            id="ageAdjustmentRate"
                            type="number"
                            step="0.01"
                            placeholder="0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                {/* Statistical Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Statistical Analysis & Data Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Comparable Sales Statistics */}
                    <div>
                      <h4 className="font-semibold mb-4">Comparable Sales Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-sm font-medium text-blue-600">Sample Size</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {salesComparison.comparables?.length || 0}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-sm font-medium text-green-600">Mean Price/SF</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${salesComparison.comparables?.length > 0 
                              ? (salesComparison.comparables.reduce((sum, comp) => sum + getAdjustedPrice(comp), 0) / salesComparison.comparables.length).toFixed(0)
                              : '0'
                            }
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <p className="text-sm font-medium text-purple-600">Standard Deviation</p>
                          <p className="text-2xl font-bold text-purple-700">
                            ${salesComparison.comparables?.length > 1 
                              ? (() => {
                                const prices = salesComparison.comparables.map(getAdjustedPrice);
                                const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
                                const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
                                return Math.sqrt(variance).toFixed(0);
                              })()
                              : '0'
                            }
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-4 text-center">
                          <p className="text-sm font-medium text-amber-600">Coefficient of Variation</p>
                          <p className="text-2xl font-bold text-amber-700">
                            {salesComparison.comparables?.length > 1 
                              ? (() => {
                                const prices = salesComparison.comparables.map(getAdjustedPrice);
                                const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
                                const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
                                const stdDev = Math.sqrt(variance);
                                return ((stdDev / mean) * 100).toFixed(1) + '%';
                              })()
                              : '0%'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Data Quality Metrics */}
                    <div>
                      <h4 className="font-semibold mb-4">Data Quality Assessment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Sale Date Recency</Label>
                          <div className="mt-2 space-y-2">
                            {salesComparison.comparables?.map((comp, index) => {
                              const monthsOld = Math.floor((new Date().getTime() - new Date(comp.saleDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
                              const freshness = monthsOld <= 6 ? 'excellent' : monthsOld <= 12 ? 'good' : monthsOld <= 24 ? 'fair' : 'poor';
                              const colors = {
                                excellent: 'bg-green-100 text-green-800',
                                good: 'bg-blue-100 text-blue-800',
                                fair: 'bg-yellow-100 text-yellow-800',
                                poor: 'bg-red-100 text-red-800'
                              };
                              
                              return (
                                <div key={comp.id} className="flex justify-between items-center">
                                  <span className="text-sm">Comp {index + 1}</span>
                                  <Badge className={colors[freshness as keyof typeof colors]}>
                                    {monthsOld}mo - {freshness}
                                  </Badge>
                                </div>
                              );
                            }) || []}
                          </div>
                        </div>
                        <div>
                          <Label>Size Similarity</Label>
                          <div className="mt-2 space-y-2">
                            {salesComparison.comparables?.map((comp, index) => {
                              const sizeDiff = Math.abs((comp.squareFootage - (salesComparison.subjectSquareFootage || 0)) / (salesComparison.subjectSquareFootage || 1));
                              const similarity = sizeDiff <= 0.1 ? 'excellent' : sizeDiff <= 0.25 ? 'good' : sizeDiff <= 0.5 ? 'fair' : 'poor';
                              const colors = {
                                excellent: 'bg-green-100 text-green-800',
                                good: 'bg-blue-100 text-blue-800',
                                fair: 'bg-yellow-100 text-yellow-800',
                                poor: 'bg-red-100 text-red-800'
                              };
                              
                              return (
                                <div key={comp.id} className="flex justify-between items-center">
                                  <span className="text-sm">Comp {index + 1}</span>
                                  <Badge className={colors[similarity as keyof typeof colors]}>
                                    {(sizeDiff * 100).toFixed(0)}% - {similarity}
                                  </Badge>
                                </div>
                              );
                            }) || []}
                          </div>
                        </div>
                        <div>
                          <Label>Overall Reliability</Label>
                          <div className="mt-2 space-y-2">
                            {salesComparison.comparables?.map((comp, index) => (
                              <div key={comp.id} className="flex justify-between items-center">
                                <span className="text-sm">Comp {index + 1}</span>
                                <Badge className={getConfidenceColor(comp.confidence)}>
                                  {comp.confidence}
                                </Badge>
                              </div>
                            )) || []}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Reconciliation Metrics */}
                    <div>
                      <h4 className="font-semibold mb-4">Reconciliation Quality Indicators</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>Weight Distribution</Label>
                            <div className="mt-2">
                              {salesComparison.comparables?.map((comp, index) => (
                                <div key={comp.id} className="flex justify-between items-center py-1">
                                  <span className="text-sm">Comparable {index + 1}</span>
                                  <span className="text-sm font-medium">{comp.weight}%</span>
                                </div>
                              )) || []}
                              <div className="border-t mt-2 pt-2 flex justify-between items-center font-semibold">
                                <span>Total Weight</span>
                                <span>{salesComparison.comparables?.reduce((sum, comp) => sum + comp.weight, 0) || 0}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Adjustment Summary</Label>
                            <div className="mt-2 text-sm space-y-2">
                              <div className="flex justify-between">
                                <span>Average Time Adjustment:</span>
                                <span>{salesComparison.comparables?.length > 0 
                                  ? (salesComparison.comparables.reduce((sum, comp) => sum + comp.timeAdjustment, 0) / salesComparison.comparables.length).toFixed(1)
                                  : '0'
                                }%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Average Location Adjustment:</span>
                                <span>{salesComparison.comparables?.length > 0 
                                  ? (salesComparison.comparables.reduce((sum, comp) => sum + comp.locationAdjustment, 0) / salesComparison.comparables.length).toFixed(1)
                                  : '0'
                                }%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Average Total Adjustment:</span>
                                <span>{salesComparison.comparables?.length > 0 
                                  ? (salesComparison.comparables.reduce((sum, comp) => sum + comp.timeAdjustment + comp.locationAdjustment + comp.ageAdjustment + comp.qualityAdjustment, 0) / salesComparison.comparables.length).toFixed(1)
                                  : '0'
                                }%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sales Comparison Summary */}
      <Card className="bg-orange-50">
        <CardHeader>
          <CardTitle>Sales Comparison Approach Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Number of Comparables</p>
              <p className="text-2xl font-bold text-orange-700">
                {salesComparison.comparables?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Adjusted Price Range</p>
              <p className="text-2xl font-bold text-orange-700">
                ${salesComparison.comparables?.length > 0 
                  ? Math.min(...salesComparison.comparables.map(getAdjustedPrice)).toFixed(0)
                  : '0'
                } - 
                ${salesComparison.comparables?.length > 0 
                  ? Math.max(...salesComparison.comparables.map(getAdjustedPrice)).toFixed(0)
                  : '0'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Indicated Value</p>
              <p className="text-2xl font-bold text-orange-700">
                ${salesComparison.reconciledValue?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}