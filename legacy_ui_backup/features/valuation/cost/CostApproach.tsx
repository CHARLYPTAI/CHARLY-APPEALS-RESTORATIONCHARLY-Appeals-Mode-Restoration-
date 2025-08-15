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

interface CostData {
  landValue: number;
  improvementCost: number;
  age: number;
  effectiveAge: number;
  economicLife: number;
  physicalDeterioration: number;
  functionalObsolescence: number;
  externalObsolescence: number;
  depreciation: {
    physical: number;
    functional: number;
    external: number;
    total: number;
  };
  depreciatedValue: number;
  indicatedValue: number;
}

interface CostApproachData {
  property: Property;
  costData: CostData;
  valuation: {
    confidence: number;
    rationale: string[];
  };
  readyForPacket: boolean;
}

interface CostApproachProps {
  propertyId: string;
}

// Mock SWARTZ data for cost approach
const mockSwartzCostData: Record<string, CostApproachData> = {
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
    costData: {
      landValue: 850000,
      improvementCost: 2650000,
      age: 12,
      effectiveAge: 10,
      economicLife: 50,
      physicalDeterioration: 18,
      functionalObsolescence: 5,
      externalObsolescence: 0,
      depreciation: {
        physical: 477000,
        functional: 132500,
        external: 0,
        total: 1139500
      },
      depreciatedValue: 1510500,
      indicatedValue: 2360500
    },
    valuation: {
      confidence: 0.78,
      rationale: [
        'Land value based on recent comparable land sales',
        'Replacement cost estimated using Marshall & Swift guidelines',
        'Physical depreciation reflects building age and condition',
        'Minimal functional obsolescence for modern office use',
        'No external obsolescence identified in current market'
      ]
    },
    readyForPacket: true
  }
};

export function CostApproach({ propertyId }: CostApproachProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<CostData>>({});
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['cost-approach', propertyId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = mockSwartzCostData[propertyId];
      if (!data) throw new Error('Property not found');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<CostData>) => {
      // Simulate API call to calculate cost approach
      await new Promise(resolve => setTimeout(resolve, 500));
      return updates;
    },
    onSuccess: () => {
      addToast({ type: 'success', message: 'Cost approach data updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['cost-approach', propertyId] });
      setEditMode(false);
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to update cost approach data' });
    }
  });

  useEffect(() => {
    if (data && Object.keys(formData).length === 0) {
      setFormData(data.costData);
    }
  }, [data, formData]);

  const calculateDepreciation = (costData: Partial<CostData>) => {
    if (!costData.improvementCost) return { physical: 0, functional: 0, external: 0, total: 0 };
    
    const physicalDep = (costData.improvementCost * (costData.physicalDeterioration || 0)) / 100;
    const functionalDep = (costData.improvementCost * (costData.functionalObsolescence || 0)) / 100;
    const externalDep = (costData.improvementCost * (costData.externalObsolescence || 0)) / 100;
    
    // Age-based depreciation
    const ageDep = costData.economicLife && costData.effectiveAge 
      ? (costData.improvementCost * costData.effectiveAge) / costData.economicLife 
      : 0;
    
    const totalDep = Math.min(
      physicalDep + functionalDep + externalDep + ageDep,
      costData.improvementCost * 0.95 // Cap at 95%
    );
    
    return {
      physical: physicalDep,
      functional: functionalDep,
      external: externalDep,
      total: totalDep
    };
  };

  const calculateIndicatedValue = (costData: Partial<CostData>) => {
    if (!costData.landValue || !costData.improvementCost) return 0;
    
    const depreciation = calculateDepreciation(costData);
    const depreciatedImprovementValue = costData.improvementCost - depreciation.total;
    return costData.landValue + depreciatedImprovementValue;
  };

  const handleInputChange = (field: keyof CostData, value: number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate depreciation and indicated value
      updated.depreciation = calculateDepreciation(updated);
      updated.depreciatedValue = updated.improvementCost ? updated.improvementCost - updated.depreciation.total : 0;
      updated.indicatedValue = calculateIndicatedValue(updated);
      
      return updated;
    });
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading cost approach analysis...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Property not found or failed to load cost approach analysis.</p>
      </div>
    );
  }

  const currentData = editMode ? formData : data.costData;
  const indicatedValue = editMode ? calculateIndicatedValue(formData) : data.costData.indicatedValue;

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cost Approach</h2>
            <p className="text-gray-600">
              {data.property.name} - {data.property.address}, {data.property.city}, {data.property.state}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
            >
              {editMode ? 'Cancel' : 'Edit Parameters'}
            </button>
            
            {data.readyForPacket && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Ready for Packet
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Components Panel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Components</h3>
          
          <div className="space-y-4">
            {/* Land Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Land Value
              </label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.landValue || 0}
                  onChange={(e) => handleInputChange('landValue', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(currentData.landValue || 0)}
                </div>
              )}
            </div>

            {/* Improvement Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Replacement Cost New
              </label>
              {editMode ? (
                <input
                  type="number"
                  value={formData.improvementCost || 0}
                  onChange={(e) => handleInputChange('improvementCost', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(currentData.improvementCost || 0)}
                </div>
              )}
            </div>

            {/* Age Information */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Age
                </label>
                {editMode ? (
                  <input
                    type="number"
                    value={formData.age || 0}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {currentData.age || 0} years
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Age
                </label>
                {editMode ? (
                  <input
                    type="number"
                    value={formData.effectiveAge || 0}
                    onChange={(e) => handleInputChange('effectiveAge', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {currentData.effectiveAge || 0} years
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Economic Life
                </label>
                {editMode ? (
                  <input
                    type="number"
                    value={formData.economicLife || 0}
                    onChange={(e) => handleInputChange('economicLife', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {currentData.economicLife || 0} years
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Depreciation Panel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Depreciation Analysis</h3>
          
          <div className="space-y-4">
            {/* Physical Deterioration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Physical Deterioration (%)
              </label>
              {editMode ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.physicalDeterioration || 0}
                    onChange={(e) => handleInputChange('physicalDeterioration', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">
                    {formatCurrency((formData.improvementCost || 0) * (formData.physicalDeterioration || 0) / 100)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPercentage(currentData.physicalDeterioration || 0)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(currentData.depreciation?.physical || 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Functional Obsolescence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Functional Obsolescence (%)
              </label>
              {editMode ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.functionalObsolescence || 0}
                    onChange={(e) => handleInputChange('functionalObsolescence', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">
                    {formatCurrency((formData.improvementCost || 0) * (formData.functionalObsolescence || 0) / 100)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPercentage(currentData.functionalObsolescence || 0)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(currentData.depreciation?.functional || 0)}
                  </span>
                </div>
              )}
            </div>

            {/* External Obsolescence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External Obsolescence (%)
              </label>
              {editMode ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.externalObsolescence || 0}
                    onChange={(e) => handleInputChange('externalObsolescence', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">
                    {formatCurrency((formData.improvementCost || 0) * (formData.externalObsolescence || 0) / 100)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPercentage(currentData.externalObsolescence || 0)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(currentData.depreciation?.external || 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Total Depreciation */}
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-900">Total Depreciation:</span>
                <span className="text-red-600">
                  {formatCurrency(
                    editMode ? calculateDepreciation(formData).total : (currentData.depreciation?.total || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
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
                Land Value + (Replacement Cost - Total Depreciation)
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Approach Valuation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Land Value:</span>
                <span className="font-medium">{formatCurrency(currentData.landValue || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Replacement Cost New:</span>
                <span className="font-medium">{formatCurrency(currentData.improvementCost || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Less: Total Depreciation:</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(
                    editMode ? calculateDepreciation(formData).total : (currentData.depreciation?.total || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Depreciated Improvement Value:</span>
                <span className="font-medium">
                  {formatCurrency(
                    editMode 
                      ? (formData.improvementCost || 0) - calculateDepreciation(formData).total
                      : (currentData.depreciatedValue || 0)
                  )}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span className="text-gray-900">Indicated Value:</span>
                <span className="text-lg text-green-600">{formatCurrency(indicatedValue)}</span>
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
            <div className="text-center p-4 bg-orange-50 rounded-lg mb-4">
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(indicatedValue)}
              </div>
              <div className="text-sm text-orange-600 mt-1">Indicated Market Value</div>
              <div className="text-xs text-orange-500 mt-1">
                Confidence: {(data.valuation.confidence * 100).toFixed(0)}%
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis Notes</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {data.valuation.rationale.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}