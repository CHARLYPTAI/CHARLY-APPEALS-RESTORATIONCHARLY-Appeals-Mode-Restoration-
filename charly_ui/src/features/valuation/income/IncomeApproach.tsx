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

interface FinancialData {
  grossIncome2022: number;
  grossIncome2021: number;
  grossIncome2020: number;
  operatingExpenses2022: number;
  operatingExpenses2021: number;
  operatingExpenses2020: number;
  noi2022: number;
  noi2021: number;
  noi2020: number;
  capRate: number;
  expenseRatio: number;
}

interface IncomeApproachData {
  property: Property;
  financialData: FinancialData;
  uploadedDocs: Array<{
    id: string;
    filename: string;
    type: 'income_statement' | 'rent_roll' | 'profit_loss';
    uploadDate: string;
  }>;
  valuation: {
    calculatedValue: number;
    confidence: number;
    method: string;
    rationale: string[];
  };
  readyForPacket: boolean;
}

interface IncomeApproachProps {
  propertyId: string;
}

// Mock SWARTZ data
const mockSwartzData: Record<string, IncomeApproachData> = {
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
    financialData: {
      grossIncome2022: 485000,
      grossIncome2021: 460000,
      grossIncome2020: 445000,
      operatingExpenses2022: 145000,
      operatingExpenses2021: 138000,
      operatingExpenses2020: 135000,
      noi2022: 340000,
      noi2021: 322000,
      noi2020: 310000,
      capRate: 0.106,
      expenseRatio: 0.30
    },
    uploadedDocs: [
      {
        id: 'doc1',
        filename: 'Office Bldg Z – 2020, 2021, 2022 income statements.csv',
        type: 'income_statement',
        uploadDate: '2024-01-15'
      },
      {
        id: 'doc2',
        filename: 'Rent Roll as of 12.31.22 Office Bldg Z.csv',
        type: 'rent_roll',
        uploadDate: '2024-01-15'
      }
    ],
    valuation: {
      calculatedValue: 3206604,
      confidence: 0.87,
      method: 'Direct Capitalization',
      rationale: [
        'NOI trend shows 5.6% annual growth',
        'Cap rate of 10.6% reflects market conditions',
        'Operating expense ratio of 30% is reasonable for class B office',
        'Market value supports over-assessment claim'
      ]
    },
    readyForPacket: true
  },
  'ABC-2023-002': {
    property: {
      id: 'ABC-2023-002',
      name: 'ABC Company Office Complex',
      address: '4500 Technology Way',
      city: 'Austin',
      state: 'TX',
      assessedValue: 1850000,
      marketValue: 1900000
    },
    financialData: {
      grossIncome2022: 285000,
      grossIncome2021: 270000,
      grossIncome2020: 265000,
      operatingExpenses2022: 95000,
      operatingExpenses2021: 90000,
      operatingExpenses2020: 88000,
      noi2022: 190000,
      noi2021: 180000,
      noi2020: 177000,
      capRate: 0.103,
      expenseRatio: 0.33
    },
    uploadedDocs: [
      {
        id: 'doc3',
        filename: 'P&L ABC Company 2021 & 2022.csv',
        type: 'profit_loss',
        uploadDate: '2024-01-10'
      }
    ],
    valuation: {
      calculatedValue: 1844660,
      confidence: 0.82,
      method: 'Direct Capitalization',
      rationale: [
        'NOI growth of 3.6% annually',
        'Cap rate of 10.3% appropriate for property type',
        'Assessment appears fair market value'
      ]
    },
    readyForPacket: true
  }
};

export function IncomeApproach({ propertyId }: IncomeApproachProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<FinancialData>>({});
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['income-approach', propertyId],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = mockSwartzData[propertyId];
      if (!data) throw new Error('Property not found');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<FinancialData>) => {
      // Simulate API update
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...data?.financialData, ...updates };
    },
    onSuccess: () => {
      addToast({ type: 'success', message: 'Financial data updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['income-approach', propertyId] });
      setEditMode(false);
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to update financial data' });
    }
  });

  useEffect(() => {
    if (data && !formData.grossIncome2022) {
      setFormData(data.financialData);
    }
  }, [data, formData.grossIncome2022]);

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
    return `${(value * 100).toFixed(1)}%`;
  };

  const calculateNOI = (grossIncome: number, expenses: number) => {
    return grossIncome - expenses;
  };

  const calculateValue = (noi: number, capRate: number) => {
    return noi / capRate;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading property analysis...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Property not found or failed to load analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{data.property.name}</h2>
            <p className="text-gray-600">
              {data.property.address}, {data.property.city}, {data.property.state}
            </p>
            <div className="mt-2 flex space-x-4">
              <span className="text-sm text-gray-500">
                Assessed: {formatCurrency(data.property.assessedValue)}
              </span>
              <span className="text-sm text-gray-500">
                Market: {formatCurrency(data.property.marketValue)}
              </span>
            </div>
          </div>
          
          {data.readyForPacket && (
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Ready for Packet
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uploaded Documents Panel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
          <div className="space-y-3">
            {data.uploadedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                  <p className="text-xs text-gray-500">
                    {doc.type.replace('_', ' ')} • {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Data Panel */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Parsed Financials</h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="space-y-4">
            {/* Income Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Gross Income</h4>
              <div className="space-y-2 text-sm">
                {[2022, 2021, 2020].map(year => (
                  <div key={year} className="flex justify-between">
                    <span className="text-gray-600">{year}:</span>
                    {editMode ? (
                      <input
                        type="number"
                        value={formData[`grossIncome${year}` as keyof FinancialData] || 0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [`grossIncome${year}`]: parseInt(e.target.value) || 0
                        }))}
                        className="w-24 px-2 py-1 text-right border border-gray-300 rounded text-xs"
                      />
                    ) : (
                      <span className="font-medium">
                        {formatCurrency(data.financialData[`grossIncome${year}` as keyof FinancialData] as number)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Operating Expenses</h4>
              <div className="space-y-2 text-sm">
                {[2022, 2021, 2020].map(year => (
                  <div key={year} className="flex justify-between">
                    <span className="text-gray-600">{year}:</span>
                    {editMode ? (
                      <input
                        type="number"
                        value={formData[`operatingExpenses${year}` as keyof FinancialData] || 0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [`operatingExpenses${year}`]: parseInt(e.target.value) || 0
                        }))}
                        className="w-24 px-2 py-1 text-right border border-gray-300 rounded text-xs"
                      />
                    ) : (
                      <span className="font-medium">
                        {formatCurrency(data.financialData[`operatingExpenses${year}` as keyof FinancialData] as number)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* NOI Section */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Net Operating Income</h4>
              <div className="space-y-2 text-sm">
                {[2022, 2021, 2020].map(year => (
                  <div key={year} className="flex justify-between">
                    <span className="text-gray-600">{year}:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        calculateNOI(
                          formData[`grossIncome${year}` as keyof FinancialData] as number || 
                          data.financialData[`grossIncome${year}` as keyof FinancialData] as number,
                          formData[`operatingExpenses${year}` as keyof FinancialData] as number || 
                          data.financialData[`operatingExpenses${year}` as keyof FinancialData] as number
                        )
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ratios */}
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Cap Rate:</span>
                <span className="font-medium">{formatPercentage(data.financialData.capRate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expense Ratio:</span>
                <span className="font-medium">{formatPercentage(data.financialData.expenseRatio)}</span>
              </div>
            </div>

            {editMode && (
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Valuation Results Panel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Computed Value</h3>
          
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(data.valuation.calculatedValue)}
              </div>
              <div className="text-sm text-blue-600 mt-1">Market Value (Income Approach)</div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Method:</span>
              <span className="font-medium">{data.valuation.method}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Confidence:</span>
              <span className="font-medium">{formatPercentage(data.valuation.confidence)}</span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rationale</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {data.valuation.rationale.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Assessment Comparison */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Assessed Value:</span>
                <span>{formatCurrency(data.property.assessedValue)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Calculated Value:</span>
                <span>{formatCurrency(data.valuation.calculatedValue)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-900">Variance:</span>
                <span className={
                  data.valuation.calculatedValue < data.property.assessedValue 
                    ? 'text-red-600' : 'text-green-600'
                }>
                  {formatCurrency(Math.abs(data.valuation.calculatedValue - data.property.assessedValue))}
                  {data.valuation.calculatedValue < data.property.assessedValue ? ' Over' : ' Under'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}