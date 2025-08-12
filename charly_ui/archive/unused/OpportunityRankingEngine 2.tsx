import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface Property {
  id: string;
  address: string;
  marketValue: number;
  assessedValue: number;
  potentialSavings: number;
  successProbability: number;
  aiConfidence: number;
  lastAssessmentDate: string;
  propertyType: string;
  jurisdiction: string;
  overAssessmentRatio: number;
}

interface OpportunityMetrics {
  totalPotentialSavings: number;
  averageSuccessProbability: number;
  highValueOpportunities: number;
  quickWinOpportunities: number;
}

interface OpportunityRankingEngineProps {
  properties?: Property[];
  onPropertySelect?: (property: Property) => void;
  onBulkAction?: (propertyIds: string[], action: string) => void;
}

const mockProperties: Property[] = [
  {
    id: '1',
    address: '123 Corporate Plaza, Austin TX',
    marketValue: 2800000,
    assessedValue: 3200000,
    potentialSavings: 48000,
    successProbability: 87,
    aiConfidence: 94,
    lastAssessmentDate: '2024-01-15',
    propertyType: 'Office',
    jurisdiction: 'Travis County',
    overAssessmentRatio: 14.3
  },
  {
    id: '2', 
    address: '456 Tech Center Dr, Austin TX',
    marketValue: 1900000,
    assessedValue: 2150000,
    potentialSavings: 30000,
    successProbability: 92,
    aiConfidence: 89,
    lastAssessmentDate: '2024-02-01',
    propertyType: 'Industrial',
    jurisdiction: 'Travis County',
    overAssessmentRatio: 13.2
  },
  {
    id: '3',
    address: '789 Business Park Way, Dallas TX',
    marketValue: 4200000,
    assessedValue: 4650000,
    potentialSavings: 54000,
    successProbability: 76,
    aiConfidence: 91,
    lastAssessmentDate: '2024-01-30',
    propertyType: 'Retail',
    jurisdiction: 'Dallas County',
    overAssessmentRatio: 10.7
  },
  {
    id: '4',
    address: '321 Innovation Blvd, Houston TX',
    marketValue: 3500000,
    assessedValue: 3850000,
    potentialSavings: 42000,
    successProbability: 81,
    aiConfidence: 86,
    lastAssessmentDate: '2024-02-10',
    propertyType: 'Mixed Use',
    jurisdiction: 'Harris County',
    overAssessmentRatio: 10.0
  }
];

export function OpportunityRankingEngine({ 
  properties = mockProperties,
  onPropertySelect,
  onBulkAction 
}: OpportunityRankingEngineProps) {
  const [sortBy, setSortBy] = useState<'potentialSavings' | 'successProbability' | 'aiConfidence' | 'overAssessmentRatio'>('potentialSavings');
  const [filterBy, setFilterBy] = useState<'all' | 'highValue' | 'quickWin' | 'lowRisk'>('all');
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

  const sortedAndFilteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Apply filters
    switch (filterBy) {
      case 'highValue':
        filtered = filtered.filter(p => p.potentialSavings > 40000);
        break;
      case 'quickWin':
        filtered = filtered.filter(p => p.successProbability > 85 && p.potentialSavings > 25000);
        break;
      case 'lowRisk':
        filtered = filtered.filter(p => p.aiConfidence > 90);
        break;
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'potentialSavings':
          return b.potentialSavings - a.potentialSavings;
        case 'successProbability':
          return b.successProbability - a.successProbability;
        case 'aiConfidence':
          return b.aiConfidence - a.aiConfidence;
        case 'overAssessmentRatio':
          return b.overAssessmentRatio - a.overAssessmentRatio;
        default:
          return 0;
      }
    });
  }, [properties, sortBy, filterBy]);

  const metrics: OpportunityMetrics = useMemo(() => {
    return {
      totalPotentialSavings: properties.reduce((sum, p) => sum + p.potentialSavings, 0),
      averageSuccessProbability: properties.reduce((sum, p) => sum + p.successProbability, 0) / properties.length,
      highValueOpportunities: properties.filter(p => p.potentialSavings > 40000).length,
      quickWinOpportunities: properties.filter(p => p.successProbability > 85 && p.potentialSavings > 25000).length
    };
  }, [properties]);

  const togglePropertySelection = (propertyId: string) => {
    const newSelection = new Set(selectedProperties);
    if (newSelection.has(propertyId)) {
      newSelection.delete(propertyId);
    } else {
      newSelection.add(propertyId);
    }
    setSelectedProperties(newSelection);
  };

  const handleBulkAction = (action: string) => {
    if (selectedProperties.size > 0 && onBulkAction) {
      onBulkAction(Array.from(selectedProperties), action);
    }
  };

  const getSuccessProbabilityColor = (probability: number) => {
    if (probability >= 85) return 'text-success-600 bg-success-50';
    if (probability >= 70) return 'text-warning-600 bg-warning-50';
    return 'text-danger-600 bg-danger-50';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-success-600';
    if (confidence >= 80) return 'text-warning-600';
    return 'text-danger-600';
  };

  return (
    <div className="space-y-6">
      {/* Intelligence Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💰</span>
              <span className="text-label-medium font-medium text-primary-700">Total Potential</span>
            </div>
            <p className="text-headline-large font-bold text-primary-900">
              ${metrics.totalPotentialSavings.toLocaleString()}
            </p>
            <p className="text-caption text-primary-600">In tax savings identified</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-success-50 to-success-100">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span className="text-label-medium font-medium text-success-700">Avg Success Rate</span>
            </div>
            <p className="text-headline-large font-bold text-success-900">
              {metrics.averageSuccessProbability.toFixed(1)}%
            </p>
            <p className="text-caption text-success-600">AI prediction confidence</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-warning-50 to-warning-100">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <span className="text-label-medium font-medium text-warning-700">Quick Wins</span>
            </div>
            <p className="text-headline-large font-bold text-warning-900">
              {metrics.quickWinOpportunities}
            </p>
            <p className="text-caption text-warning-600">High probability + value</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <span className="text-label-medium font-medium text-neutral-700">High Value</span>
            </div>
            <p className="text-headline-large font-bold text-neutral-900">
              {metrics.highValueOpportunities}
            </p>
            <p className="text-caption text-neutral-600">Properties &gt;$40K savings</p>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-label-medium font-medium text-neutral-700">Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-apple border border-neutral-200 bg-white text-body-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="potentialSavings">Potential Savings</option>
                <option value="successProbability">Success Probability</option>
                <option value="aiConfidence">AI Confidence</option>
                <option value="overAssessmentRatio">Over-Assessment %</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-label-medium font-medium text-neutral-700">Filter:</label>
              <select 
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 rounded-apple border border-neutral-200 bg-white text-body-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Properties</option>
                <option value="highValue">High Value (&gt;$40K)</option>
                <option value="quickWin">Quick Wins</option>
                <option value="lowRisk">Low Risk (&gt;90% confidence)</option>
              </select>
            </div>
          </div>

          {selectedProperties.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-body-medium text-neutral-600">
                {selectedProperties.size} selected
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkAction('generate-appeals')}
              >
                Generate Appeals
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                Export Selection
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Opportunity Rankings */}
      <div className="space-y-4">
        {sortedAndFilteredProperties.map((property, index) => (
          <Card key={property.id} className="p-6 hover:shadow-apple-lg transition-all duration-300">
            <div className="flex items-start space-x-4">
              {/* Selection Checkbox */}
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  checked={selectedProperties.has(property.id)}
                  onChange={() => togglePropertySelection(property.id)}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
              </div>

              {/* Rank Badge */}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-medium font-bold ${
                  index === 0 ? 'bg-primary-500 text-white' : 
                  index === 1 ? 'bg-primary-400 text-white' : 
                  index === 2 ? 'bg-primary-300 text-white' : 
                  'bg-neutral-200 text-neutral-600'
                }`}>
                  {index + 1}
                </div>
              </div>

              {/* Property Details */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-title-medium font-semibold text-neutral-900">
                      {property.address}
                    </h3>
                    <p className="text-body-medium text-neutral-600">
                      {property.propertyType} • {property.jurisdiction}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-headline-medium font-bold text-success-600">
                      ${property.potentialSavings.toLocaleString()}
                    </p>
                    <p className="text-caption text-neutral-500">potential savings</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-caption text-neutral-500">Market Value</p>
                    <p className="text-body-medium font-medium">
                      ${property.marketValue.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-caption text-neutral-500">Assessed Value</p>
                    <p className="text-body-medium font-medium">
                      ${property.assessedValue.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-caption text-neutral-500">Success Probability</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-apple text-caption font-medium ${getSuccessProbabilityColor(property.successProbability)}`}>
                        {property.successProbability}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-caption text-neutral-500">AI Confidence</p>
                    <p className={`text-body-medium font-medium ${getConfidenceColor(property.aiConfidence)}`}>
                      {property.aiConfidence}%
                    </p>
                  </div>
                </div>

                {/* Over-Assessment Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-caption text-neutral-500">Over-assessed by:</span>
                    <span className="px-2 py-1 bg-danger-50 text-danger-600 rounded-apple text-caption font-medium">
                      {property.overAssessmentRatio.toFixed(1)}%
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onPropertySelect?.(property)}
                  >
                    Analyze Property
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sortedAndFilteredProperties.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🔍</div>
            <h3 className="text-title-large font-semibold text-neutral-900">
              No opportunities match your filters
            </h3>
            <p className="text-body-medium text-neutral-600 max-w-md mx-auto">
              Try adjusting your filter criteria to see more properties with appeal potential.
            </p>
            <Button
              variant="secondary"
              onClick={() => setFilterBy('all')}
            >
              Show All Properties
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default OpportunityRankingEngine;