import React, { useState } from 'react';
import { MapPin, Building2, FileText, TrendingUp, Shield, AlertCircle } from 'lucide-react';

interface JurisdictionData {
  state: string;
  code: string;
  properties: number;
  totalValue: number;
  avgAssessment: number;
  filingDeadline: string;
  appealRate: number;
  successRate: number;
  regulations: string[];
}

const jurisdictionData: JurisdictionData[] = [
  {
    state: 'California',
    code: 'CA',
    properties: 1234,
    totalValue: 450000000,
    avgAssessment: 365000,
    filingDeadline: 'July 2, 2024',
    appealRate: 18.5,
    successRate: 72.3,
    regulations: ['Proposition 13', 'Proposition 8', 'Board of Equalization Rules']
  },
  {
    state: 'Texas',
    code: 'TX',
    properties: 892,
    totalValue: 320000000,
    avgAssessment: 358000,
    filingDeadline: 'May 15, 2024',
    appealRate: 22.1,
    successRate: 68.9,
    regulations: ['Property Tax Code Chapter 41', 'Comptroller Rules', 'Local ARB Procedures']
  },
  {
    state: 'New York',
    code: 'NY',
    properties: 567,
    totalValue: 890000000,
    avgAssessment: 1570000,
    filingDeadline: 'March 1, 2024',
    appealRate: 15.8,
    successRate: 65.4,
    regulations: ['RPTL Article 7', 'NYC Tax Commission Rules', 'SCAR Procedures']
  },
  {
    state: 'Florida',
    code: 'FL',
    properties: 743,
    totalValue: 280000000,
    avgAssessment: 377000,
    filingDeadline: 'September 15, 2024',
    appealRate: 19.7,
    successRate: 70.2,
    regulations: ['Chapter 194 F.S.', 'Value Adjustment Board Rules', 'DOR Guidelines']
  }
];

const MultiStateJurisdiction: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'details' | 'compliance'>('overview');

  const getDeadlineStatus = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { status: 'past', color: 'text-gray-500' };
    if (daysUntil < 30) return { status: 'urgent', color: 'text-red-600' };
    if (daysUntil < 60) return { status: 'soon', color: 'text-yellow-600' };
    return { status: 'upcoming', color: 'text-green-600' };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Multi-State Jurisdiction Management
        </h2>
        <p className="text-gray-600">
          Manage property tax appeals across multiple jurisdictions with state-specific regulations and deadlines
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setViewMode('details')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'details'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          State Details
        </button>
        <button
          onClick={() => setViewMode('compliance')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'compliance'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Compliance
        </button>
      </div>

      {/* Overview Grid */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {jurisdictionData.map((jurisdiction) => {
            const deadlineInfo = getDeadlineStatus(jurisdiction.filingDeadline);
            return (
              <div
                key={jurisdiction.code}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedState(jurisdiction.code);
                  setViewMode('details');
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{jurisdiction.state}</h3>
                    <p className="text-2xl font-bold text-gray-900">{jurisdiction.code}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Properties:</span>
                    <span className="font-medium">{jurisdiction.properties.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Portfolio Value:</span>
                    <span className="font-medium">${(jurisdiction.totalValue / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Appeal Rate:</span>
                    <span className="font-medium">{jurisdiction.appealRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium text-green-600">{jurisdiction.successRate}%</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Filing Deadline:</span>
                    <span className={`text-sm font-medium ${deadlineInfo.color}`}>
                      {jurisdiction.filingDeadline}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* State Details View */}
      {viewMode === 'details' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a state</option>
              {jurisdictionData.map((j) => (
                <option key={j.code} value={j.code}>
                  {j.state}
                </option>
              ))}
            </select>
          </div>
          
          {selectedState && (
            <div className="p-6">
              {(() => {
                const state = jurisdictionData.find((j) => j.code === selectedState);
                if (!state) return null;
                
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Portfolio Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Total Properties</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {state.properties.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Total Portfolio Value</div>
                          <div className="text-2xl font-bold text-gray-900">
                            ${(state.totalValue / 1000000).toFixed(1)}M
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Average Assessment</div>
                          <div className="text-2xl font-bold text-gray-900">
                            ${state.avgAssessment.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Performance Metrics
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Appeal Rate</div>
                          <div className="text-2xl font-bold text-green-700">
                            {state.appealRate}%
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Success Rate</div>
                          <div className="text-2xl font-bold text-green-700">
                            {state.successRate}%
                          </div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Next Filing Deadline</div>
                          <div className="text-xl font-bold text-yellow-700">
                            {state.filingDeadline}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Compliance View */}
      {viewMode === 'compliance' && (
        <div className="space-y-6">
          {jurisdictionData.map((jurisdiction) => (
            <div key={jurisdiction.code} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{jurisdiction.state}</h3>
                    <p className="text-sm text-gray-600">Compliance & Regulations</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getDeadlineStatus(jurisdiction.filingDeadline).status === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {getDeadlineStatus(jurisdiction.filingDeadline).status === 'urgent' ? 'Action Required' : 'Compliant'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Key Regulations</span>
                  </div>
                  <ul className="space-y-1">
                    {jurisdiction.regulations.map((reg, idx) => (
                      <li key={idx} className="text-sm text-gray-600">• {reg}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Important Dates</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>• Filing Deadline: {jurisdiction.filingDeadline}</div>
                    <div>• Evidence Submission: 30 days before hearing</div>
                    <div>• Final Appeal: 30 days after decision</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiStateJurisdiction;