import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/ToastProvider';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  assessedValue: number;
  marketValue: number;
  jurisdiction: string;
}

interface ApproachSummary {
  approach: 'income' | 'sales' | 'cost';
  indicatedValue: number;
  confidence: number;
  weight: number;
  completed: boolean;
  rationale: string[];
}

interface NarrativeSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

interface AppealPacketData {
  property: Property;
  approaches: ApproachSummary[];
  reconciliation: {
    finalValue: number;
    overallConfidence: number;
    recommendation: 'APPEAL' | 'MONITOR' | 'NO_ACTION';
    savingsEstimate: number;
  };
  narrativeSections: NarrativeSection[];
  packetStatus: 'DRAFT' | 'READY' | 'GENERATED';
  readyForGeneration: boolean;
}

interface AppealPacketPrepProps {
  propertyId: string;
}

// Mock SWARTZ data for appeal packet
const mockSwartzPacketData: Record<string, AppealPacketData> = {
  'OBZ-2023-001': {
    property: {
      id: 'OBZ-2023-001',
      name: 'Office Building Z',
      address: '1250 Business Park Drive',
      city: 'Austin',
      state: 'TX',
      assessedValue: 2800000,
      marketValue: 3200000,
      jurisdiction: 'Travis County'
    },
    approaches: [
      {
        approach: 'income',
        indicatedValue: 3206604,
        confidence: 0.87,
        weight: 0.45,
        completed: true,
        rationale: [
          'NOI trend shows 5.6% annual growth',
          'Cap rate of 10.6% reflects market conditions',
          'Operating expense ratio of 30% is reasonable for class B office'
        ]
      },
      {
        approach: 'sales',
        indicatedValue: 3168500,
        confidence: 0.84,
        weight: 0.35,
        completed: true,
        rationale: [
          'Three recent sales within 2 miles of subject property',
          'Comparable properties of similar size and use',
          'Minimal adjustments required - highly comparable properties'
        ]
      },
      {
        approach: 'cost',
        indicatedValue: 2360500,
        confidence: 0.78,
        weight: 0.20,
        completed: true,
        rationale: [
          'Land value based on recent comparable land sales',
          'Replacement cost estimated using Marshall & Swift guidelines',
          'Physical depreciation reflects building age and condition'
        ]
      }
    ],
    reconciliation: {
      finalValue: 3050000,
      overallConfidence: 0.83,
      recommendation: 'APPEAL',
      savingsEstimate: 9375 // Annual tax savings
    },
    narrativeSections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        content: 'Based on comprehensive analysis using income, sales comparison, and cost approaches, the subject property appears to be overassessed by approximately $250,000. The property generates strong rental income with growing NOI, and recent comparable sales support a market value below the current assessment.',
        editable: true
      },
      {
        id: 'property_description',
        title: 'Property Description',
        content: 'Office Building Z is a Class B office building constructed in 2011, containing approximately 28,500 square feet of rentable space. The property is well-maintained and strategically located in Austin\'s Business Park corridor with excellent access to major transportation routes.',
        editable: true
      },
      {
        id: 'market_analysis',
        title: 'Market Analysis',
        content: 'The Austin office market continues to show resilience with steady demand for quality Class B space. Cap rates for similar properties range from 9.5% to 11.5%, with the subject property falling within this range at 10.6%.',
        editable: true
      },
      {
        id: 'valuation_conclusion',
        title: 'Valuation Conclusion',
        content: 'The weighted average of all three approaches indicates a market value of $3,050,000, representing a $250,000 overassessment. This conclusion is supported by strong income performance, recent comparable sales, and replacement cost analysis.',
        editable: true
      }
    ],
    packetStatus: 'READY',
    readyForGeneration: true
  }
};

export function AppealPacketPrep({ propertyId }: AppealPacketPrepProps) {
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['appeal-packet-prep', propertyId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = mockSwartzPacketData[propertyId];
      if (!data) throw new Error('Property not found');
      return data;
    },
  });

  const updateNarrativeMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return updates;
    },
    onSuccess: () => {
      addToast({ type: 'success', message: 'Narrative sections updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['appeal-packet-prep', propertyId] });
      setEditingSections(new Set());
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to update narrative sections' });
    }
  });

  const generatePacketMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate packet generation
      return { success: true, packetId: 'packet-123' };
    },
    onSuccess: () => {
      addToast({ type: 'success', message: 'Appeal packet generated successfully' });
      queryClient.invalidateQueries({ queryKey: ['appeal-packet-prep', propertyId] });
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to generate appeal packet' });
    }
  });

  useEffect(() => {
    if (data) {
      const initialContent: Record<string, string> = {};
      data.narrativeSections.forEach(section => {
        initialContent[section.id] = section.content;
      });
      setSectionContent(initialContent);
    }
  }, [data]);

  const handleEditSection = (sectionId: string) => {
    setEditingSections(prev => new Set([...prev, sectionId]));
  };

  const handleSaveSection = (sectionId: string) => {
    updateNarrativeMutation.mutate({ [sectionId]: sectionContent[sectionId] });
  };

  const handleCancelEdit = (sectionId: string) => {
    if (data) {
      const originalContent = data.narrativeSections.find(s => s.id === sectionId)?.content || '';
      setSectionContent(prev => ({ ...prev, [sectionId]: originalContent }));
      setEditingSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    }
  };

  const handleGeneratePacket = () => {
    generatePacketMutation.mutate();
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
    return `${(value * 100).toFixed(0)}%`;
  };

  const getApproachIcon = (approach: string) => {
    switch (approach) {
      case 'income':
        return '📊';
      case 'sales':
        return '🏢';
      case 'cost':
        return '🔨';
      default:
        return '📋';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'APPEAL':
        return 'bg-green-100 text-green-800';
      case 'MONITOR':
        return 'bg-yellow-100 text-yellow-800';
      case 'NO_ACTION':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading appeal packet preparation...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Property not found or failed to load appeal packet data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appeal Packet Preparation</h1>
            <p className="text-gray-600">
              {data.property.name} - {data.property.address}, {data.property.city}, {data.property.state}
            </p>
            <p className="text-sm text-gray-500">Jurisdiction: {data.property.jurisdiction}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              data.packetStatus === 'READY' ? 'bg-green-100 text-green-800' :
              data.packetStatus === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {data.packetStatus === 'READY' ? '✓ Ready' :
               data.packetStatus === 'DRAFT' ? '📝 Draft' : '📄 Generated'}
            </span>
            
            {data.readyForGeneration && (
              <button
                onClick={handleGeneratePacket}
                disabled={generatePacketMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatePacketMutation.isPending ? 'Generating...' : 'Generate Packet'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Valuation Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Valuation Summary</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Approaches */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {data.approaches.map((approach) => (
                <div key={approach.approach} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getApproachIcon(approach.approach)}</span>
                      <h3 className="font-medium text-gray-900 capitalize">
                        {approach.approach} Approach
                      </h3>
                      {approach.completed && (
                        <span className="text-green-500 text-sm">✓</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(approach.indicatedValue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Weight: {formatPercentage(approach.weight)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <div className="text-gray-600">
                        Confidence: {formatPercentage(approach.confidence)}
                      </div>
                      <div className="mt-1">
                        <ul className="text-xs text-gray-500 space-y-1">
                          {approach.rationale.slice(0, 2).map((point, index) => (
                            <li key={index}>• {point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reconciliation */}
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Final Reconciliation</h3>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(data.reconciliation.finalValue)}
                  </div>
                  <div className="text-sm text-blue-600">Market Value</div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assessed:</span>
                    <span>{formatCurrency(data.property.assessedValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Market:</span>
                    <span>{formatCurrency(data.reconciliation.finalValue)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">Variance:</span>
                    <span className="text-red-600">
                      {formatCurrency(data.property.assessedValue - data.reconciliation.finalValue)} Over
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">{formatPercentage(data.reconciliation.overallConfidence)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Est. Savings:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data.reconciliation.savingsEstimate)}/year
                    </span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getRecommendationColor(data.reconciliation.recommendation)
                  }`}>
                    {data.reconciliation.recommendation.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Sections */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Appeal Narrative</h2>
        
        <div className="space-y-6">
          {data.narrativeSections.map((section) => (
            <div key={section.id} className="border-l-4 border-blue-200 pl-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{section.title}</h3>
                {section.editable && !editingSections.has(section.id) && (
                  <button
                    onClick={() => handleEditSection(section.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {editingSections.has(section.id) ? (
                <div className="space-y-3">
                  <textarea
                    value={sectionContent[section.id] || ''}
                    onChange={(e) => setSectionContent(prev => ({
                      ...prev,
                      [section.id]: e.target.value
                    }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveSection(section.id)}
                      disabled={updateNarrativeMutation.isPending}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updateNarrativeMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleCancelEdit(section.id)}
                      className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {sectionContent[section.id] || section.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generation Status */}
      {data.readyForGeneration && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <div>
              <p className="text-green-800 font-medium">Ready for Packet Generation</p>
              <p className="text-green-600 text-sm">
                All valuation approaches are complete and narrative sections are ready. 
                Click "Generate Packet" to create the final appeal document.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}