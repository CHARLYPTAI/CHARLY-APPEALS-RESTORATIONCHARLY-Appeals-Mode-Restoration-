import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useValuationStore, type PropertyComparable } from '@/store/valuation';
import { Plus, Trash2, TrendingUp, MapPin, Star, Building } from 'lucide-react';

export function SalesComparisonApproach() {
  const { 
    salesComparison, 
    updateSalesComparison, 
    addComparable, 
    updateComparable, 
    removeComparable,
    apiValuation 
  } = useValuationStore();
  
  console.log("SalesComparisonApproach - Loaded:", { salesComparison, apiValuation });

  const [newCompAddress, setNewCompAddress] = useState('');

  const handleSubjectChange = (field: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    updateSalesComparison({ [field]: numericValue });
  };

  const handleCompChange = (id: string, field: string, value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    updateComparable(id, { [field]: numericValue });
    
    // Recalculate sales comparison after any comp change
    updateSalesComparison({});
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
      zoningCompatibility: 8
    };
    
    addComparable(newComp);
    setNewCompAddress('');
  };

  const getAdjustedPrice = (comp: PropertyComparable) => {
    return comp.pricePerSqFt * 
      (1 + comp.timeAdjustment / 100) *
      (1 + comp.locationAdjustment / 100) *
      (1 + comp.ageAdjustment / 100) *
      (1 + comp.qualityAdjustment / 100);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalWeight = salesComparison.comparables.reduce((sum, comp) => sum + comp.weight, 0);

  return (
    <div className="space-y-6">
      {/* Subject Property */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Subject Property
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subjectSquareFootage">Square Footage</Label>
              <Input
                id="subjectSquareFootage"
                type="number"
                value={salesComparison.subjectSquareFootage}
                onChange={(e) => handleSubjectChange('subjectSquareFootage', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-1">Estimated Value</h4>
              <p className="text-2xl font-bold text-blue-900">
                ${salesComparison.reconciledValue.toLocaleString()}
              </p>
              {salesComparison.adjustedPricePerSqFt > 0 && (
                <p className="text-sm text-blue-600">
                  ${salesComparison.adjustedPricePerSqFt.toFixed(2)}/sq ft
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Comparable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Add Comparable Sale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter property address..."
              value={newCompAddress}
              onChange={(e) => setNewCompAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNewComparable()}
              className="flex-1"
            />
            <Button onClick={addNewComparable} disabled={!newCompAddress.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparables Table */}
      {salesComparison.comparables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Comparable Sales Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {salesComparison.comparables.map((comp, index) => (
                <Card key={comp.id} className="bg-gray-50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          Comparable {index + 1}
                        </h4>
                        <p className="text-sm text-gray-600">{comp.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getConfidenceColor(comp.confidence)}>
                          {comp.confidence} confidence
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeComparable(comp.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Sale Information */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Sale Price</Label>
                        <Input
                          type="number"
                          value={comp.salePrice}
                          onChange={(e) => {
                            const salePrice = parseFloat(e.target.value) || 0;
                            const pricePerSqFt = comp.squareFootage > 0 ? salePrice / comp.squareFootage : 0;
                            handleCompChange(comp.id, 'salePrice', salePrice);
                            handleCompChange(comp.id, 'pricePerSqFt', pricePerSqFt);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Square Footage</Label>
                        <Input
                          type="number"
                          value={comp.squareFootage}
                          onChange={(e) => {
                            const sqft = parseFloat(e.target.value) || 0;
                            const pricePerSqFt = sqft > 0 ? comp.salePrice / sqft : 0;
                            handleCompChange(comp.id, 'squareFootage', sqft);
                            handleCompChange(comp.id, 'pricePerSqFt', pricePerSqFt);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Sale Date</Label>
                        <Input
                          type="date"
                          value={comp.saleDate}
                          onChange={(e) => handleCompChange(comp.id, 'saleDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Price/Sq Ft</Label>
                        <div className="bg-white rounded border p-2 text-sm font-medium">
                          ${comp.pricePerSqFt.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Adjustments */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Time Adjustment (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={comp.timeAdjustment}
                          onChange={(e) => handleCompChange(comp.id, 'timeAdjustment', e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <Label>Location Adjustment (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={comp.locationAdjustment}
                          onChange={(e) => handleCompChange(comp.id, 'locationAdjustment', e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <Label>Age/Condition (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={comp.ageAdjustment}
                          onChange={(e) => handleCompChange(comp.id, 'ageAdjustment', e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <Label>Quality Adjustment (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={comp.qualityAdjustment}
                          onChange={(e) => handleCompChange(comp.id, 'qualityAdjustment', e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                    </div>

                    {/* Weight and Quality Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Weight in Analysis (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={comp.weight}
                          onChange={(e) => handleCompChange(comp.id, 'weight', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Confidence Level</Label>
                        <Select 
                          value={comp.confidence} 
                          onValueChange={(value) => handleCompChange(comp.id, 'confidence', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Zoning Compatibility (1-10)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={comp.zoningCompatibility}
                          onChange={(e) => handleCompChange(comp.id, 'zoningCompatibility', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Adjusted Price Display */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-semibold text-green-800">Adjusted Price per Sq Ft</h5>
                          <p className="text-2xl font-bold text-green-900">
                            ${getAdjustedPrice(comp).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600">Weight: {comp.weight}%</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-green-600">
                              Zoning: {comp.zoningCompatibility}/10
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-green-600">
                        Base: ${comp.pricePerSqFt.toFixed(2)} × 
                        Time: {comp.timeAdjustment > 0 ? '+' : ''}{comp.timeAdjustment}% × 
                        Location: {comp.locationAdjustment > 0 ? '+' : ''}{comp.locationAdjustment}% × 
                        Age: {comp.ageAdjustment > 0 ? '+' : ''}{comp.ageAdjustment}% × 
                        Quality: {comp.qualityAdjustment > 0 ? '+' : ''}{comp.qualityAdjustment}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation Summary */}
      {salesComparison.comparables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Sales Comparison Reconciliation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Weighted Analysis</h4>
                {salesComparison.comparables.map((comp, index) => (
                  <div key={comp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm">Comp {index + 1}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${getAdjustedPrice(comp).toFixed(2)} × {comp.weight}%
                      </div>
                      <div className="text-xs text-gray-500">
                        = ${(getAdjustedPrice(comp) * comp.weight / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Weight:</span>
                    <span>{totalWeight}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-6 text-center">
                <h4 className="font-semibold text-amber-800 mb-2">Reconciled Value</h4>
                <p className="text-3xl font-bold text-amber-900">
                  ${salesComparison.reconciledValue.toLocaleString()}
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  Weighted Avg: ${salesComparison.adjustedPricePerSqFt.toFixed(2)}/sq ft
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  × {salesComparison.subjectSquareFootage.toLocaleString()} sq ft
                </p>
              </div>
            </div>

            {totalWeight !== 100 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Comparable weights total {totalWeight}% instead of 100%. 
                  Consider adjusting weights for more accurate reconciliation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {salesComparison.comparables.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Comparable Sales</h3>
            <p className="text-gray-500 mb-4">Add comparable sales to begin the sales comparison analysis</p>
            <Button onClick={() => setNewCompAddress('')} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Comparable
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}