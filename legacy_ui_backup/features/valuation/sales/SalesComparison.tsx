import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../components/ToastProvider';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  assessedValue: number;
  marketValue: number;
}

interface Comparable {
  id: string;
  address: string;
  saleDate: string;
  salePrice: number;
  squareFootage: number;
  pricePerSF: number;
  condition: 'excellent' | 'good' | 'average' | 'fair' | 'poor';
  location: 'superior' | 'similar' | 'inferior';
  adjustments: {
    condition: number;
    location: number;
    time: number;
    other: number;
  };
  adjustedPrice: number;
  adjustedPricePerSF: number;
  weight: number;
}

interface SalesComparisonData {
  property: Property;
  comparables: Comparable[];
  valuation: {
    indicatedValue: number;
    weightedAvgPricePerSF: number;
    confidence: number;
    rationale: string[];
  };
  readyForPacket: boolean;
}

interface SalesComparisonProps {
  propertyId: string;
}

// Mock SWARTZ data for sales comparison
const mockSwartzSalesData: Record<string, SalesComparisonData> = {
  'OBZ-2023-001': {
    property: {
      id: 'OBZ-2023-001',
      name: 'Office Building Z',
      address: '1250 Business Park Drive',
      city: 'Austin',
      state: 'TX',
      assessedValue: 2800000,
      marketValue: 3200000
    },
    comparables: [
      {
        id: 'comp1',
        address: '1200 Business Park Drive',
        saleDate: '2023-08-15',
        salePrice: 3150000,
        squareFootage: 28500,
        pricePerSF: 110.53,
        condition: 'good',
        location: 'similar',
        adjustments: {
          condition: 0,
          location: 0,
          time: 2000,
          other: 0
        },
        adjustedPrice: 3152000,
        adjustedPricePerSF: 110.60,
        weight: 0.35
      },
      {
        id: 'comp2',
        address: '1300 Technology Boulevard',
        saleDate: '2023-06-22',
        salePrice: 2950000,
        squareFootage: 26800,
        pricePerSF: 110.07,
        condition: 'excellent',
        location: 'superior',
        adjustments: {
          condition: -5000,
          location: -8000,
          time: 8000,
          other: 0
        },
        adjustedPrice: 2945000,
        adjustedPricePerSF: 109.89,
        weight: 0.30
      },
      {
        id: 'comp3',
        address: '1400 Corporate Way',
        saleDate: '2023-09-10',
        salePrice: 3320000,
        squareFootage: 30200,
        pricePerSF: 109.93,
        condition: 'average',
        location: 'inferior',
        adjustments: {
          condition: 8000,
          location: 12000,
          time: -1000,
          other: 0
        },
        adjustedPrice: 3339000,
        adjustedPricePerSF: 110.56,
        weight: 0.35
      }
    ],
    valuation: {
      indicatedValue: 3168500,
      weightedAvgPricePerSF: 110.37,
      confidence: 0.84,
      rationale: [
        'Three recent sales within 2 miles of subject property',
        'Comparable properties of similar size and use',
        'Adjustments made for condition, location, and market conditions',
        'Weighted average indicates market value support'
      ]
    },
    readyForPacket: true
  }
};

export function SalesComparison({ propertyId }: SalesComparisonProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, Partial<Comparable>>>({});
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-comparison', propertyId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = mockSwartzSalesData[propertyId];
      if (!data) throw new Error('Property not found');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, Partial<Comparable>>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return updates;
    },
    onSuccess: () => {
      addToast({ type: 'success', message: 'Comparables updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['sales-comparison', propertyId] });
      setEditMode(false);
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to update comparables' });
    }
  });

  useEffect(() => {
    if (data && Object.keys(formData).length === 0) {
      const initialFormData: Record<string, Partial<Comparable>> = {};
      data.comparables.forEach(comp => {
        initialFormData[comp.id] = { ...comp };
      });
      setFormData(initialFormData);
    }
  }, [data, formData]);

  const handleAdjustmentChange = (compId: string, field: keyof Comparable['adjustments'], value: number) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [compId]: {
          ...prev[compId],
          adjustments: {
            ...prev[compId]?.adjustments,
            [field]: value
          }
        }
      };
      
      // Recalculate adjusted price and price per SF
      const comp = updated[compId];
      if (comp && comp.salePrice && comp.adjustments) {
        const totalAdjustment = Object.values(comp.adjustments).reduce((sum, adj) => sum + (adj || 0), 0);
        comp.adjustedPrice = comp.salePrice + totalAdjustment;
        comp.adjustedPricePerSF = comp.squareFootage ? comp.adjustedPrice / comp.squareFootage : 0;
      }
      
      return updated;
    });
  };

  const handleWeightChange = (compId: string, weight: number) => {
    setFormData(prev => ({
      ...prev,
      [compId]: {
        ...prev[compId],
        weight: weight / 100 // Convert percentage to decimal
      }
    }));
  };

  const calculateIndicatedValue = () => {
    if (!data) return 0;
    
    let totalWeightedValue = 0;
    let totalWeight = 0;
    
    data.comparables.forEach(comp => {
      const formComp = formData[comp.id];
      const adjustedPrice = formComp?.adjustedPrice || comp.adjustedPrice;
      const weight = formComp?.weight || comp.weight;
      
      totalWeightedValue += adjustedPrice * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading sales comparison analysis...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Property not found or failed to load sales comparison analysis.</p>
      </div>
    );
  }

  const indicatedValue = editMode ? calculateIndicatedValue() : data.valuation.indicatedValue;

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Comparison Approach</h2>
            <p className="text-gray-600">
              {data.property.name} - {data.property.address}, {data.property.city}, {data.property.state}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
            >
              {editMode ? 'Cancel' : 'Edit Adjustments'}
            </button>
            
            {data.readyForPacket && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Ready for Packet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Comparables Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Comparable Sales</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attributes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adjustments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adjusted Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.comparables.map((comp) => {
                const formComp = formData[comp.id] || comp;
                return (
                  <tr key={comp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{comp.address}</div>
                      <div className="text-sm text-gray-500">{formatDate(comp.saleDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(comp.salePrice)}</div>
                      <div className="text-sm text-gray-500">{comp.squareFootage.toLocaleString()} SF</div>
                      <div className="text-sm text-gray-500">${comp.pricePerSF.toFixed(2)}/SF</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          comp.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                          comp.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                          comp.condition === 'average' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {comp.condition}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Location: {comp.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editMode ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500 w-16">Condition:</label>
                            <input
                              type="number"
                              value={formComp.adjustments?.condition || 0}
                              onChange={(e) => handleAdjustmentChange(comp.id, 'condition', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500 w-16">Location:</label>
                            <input
                              type="number"
                              value={formComp.adjustments?.location || 0}
                              onChange={(e) => handleAdjustmentChange(comp.id, 'location', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500 w-16">Time:</label>
                            <input
                              type="number"
                              value={formComp.adjustments?.time || 0}
                              onChange={(e) => handleAdjustmentChange(comp.id, 'time', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-500 w-16">Other:</label>
                            <input
                              type="number"
                              value={formComp.adjustments?.other || 0}
                              onChange={(e) => handleAdjustmentChange(comp.id, 'other', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <div>Condition: {formatCurrency(comp.adjustments.condition)}</div>
                          <div>Location: {formatCurrency(comp.adjustments.location)}</div>
                          <div>Time: {formatCurrency(comp.adjustments.time)}</div>
                          <div>Other: {formatCurrency(comp.adjustments.other)}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(formComp.adjustedPrice || comp.adjustedPrice)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${(formComp.adjustedPricePerSF || comp.adjustedPricePerSF).toFixed(2)}/SF
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editMode ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={(formComp.weight || comp.weight) * 100}
                          onChange={(e) => handleWeightChange(comp.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {((formComp.weight || comp.weight) * 100).toFixed(0)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editMode && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">
                Live Calculation: {formatCurrency(indicatedValue)}
              </p>
              <p className="text-xs text-blue-600">
                Adjustments and weights update the indicated value in real-time
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Valuation Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Comparison Valuation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(indicatedValue)}
              </div>
              <div className="text-sm text-green-600 mt-1">Indicated Market Value</div>
            </div>
            
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Weighted Avg $/SF:</span>
                <span className="font-medium">${data.valuation.weightedAvgPricePerSF.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">{(data.valuation.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Assessment Comparison */}
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Assessed Value:</span>
                <span>{formatCurrency(data.property.assessedValue)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Indicated Value:</span>
                <span>{formatCurrency(indicatedValue)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-900">Variance:</span>
                <span className={
                  indicatedValue < data.property.assessedValue 
                    ? 'text-red-600' : 'text-green-600'
                }>
                  {formatCurrency(Math.abs(indicatedValue - data.property.assessedValue))}
                  {indicatedValue < data.property.assessedValue ? ' Over' : ' Under'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis Rationale</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {data.valuation.rationale.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}