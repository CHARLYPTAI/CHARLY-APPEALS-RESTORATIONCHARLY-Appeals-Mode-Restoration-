import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface AppealResult {
  id: string;
  propertyAddress: string;
  originalAssessment: number;
  newAssessment: number;
  actualSavings: number;
  status: 'won' | 'settled' | 'lost' | 'pending';
  filingDate: string;
  resolutionDate?: string;
  jurisdiction: string;
  propertyType: string;
  appealType: 'value' | 'exemption' | 'classification';
  clientId: string;
}

interface ClientReport {
  id: string;
  clientName: string;
  reportPeriod: string;
  totalSavings: number;
  propertiesAppealed: number;
  successRate: number;
  averageSavings: number;
  appeals: AppealResult[];
  generatedDate: string;
}

interface ClientReportingEngineProps {
  clientId?: string;
  appeals?: AppealResult[];
  onGenerateReport?: (reportConfig: any) => void;
  onExportReport?: (reportId: string, format: string) => void;
}

const mockAppeals: AppealResult[] = [
  {
    id: 'appeal-1',
    propertyAddress: '123 Corporate Plaza, Austin TX',
    originalAssessment: 3200000,
    newAssessment: 2800000,
    actualSavings: 48000,
    status: 'won',
    filingDate: '2024-02-15',
    resolutionDate: '2024-06-20',
    jurisdiction: 'Travis County',
    propertyType: 'Office',
    appealType: 'value',
    clientId: 'client-1'
  },
  {
    id: 'appeal-2',
    propertyAddress: '456 Tech Center Dr, Austin TX',
    originalAssessment: 2150000,
    newAssessment: 1900000,
    actualSavings: 30000,
    status: 'settled',
    filingDate: '2024-03-01',
    resolutionDate: '2024-07-10',
    jurisdiction: 'Travis County',
    propertyType: 'Industrial',
    appealType: 'value',
    clientId: 'client-1'
  },
  {
    id: 'appeal-3',
    propertyAddress: '789 Business Park Way, Dallas TX',
    originalAssessment: 4650000,
    newAssessment: 4650000,
    actualSavings: 0,
    status: 'lost',
    filingDate: '2024-01-30',
    resolutionDate: '2024-05-15',
    jurisdiction: 'Dallas County',
    propertyType: 'Retail',
    appealType: 'value',
    clientId: 'client-1'
  },
  {
    id: 'appeal-4',
    propertyAddress: '321 Innovation Blvd, Houston TX',
    originalAssessment: 3850000,
    newAssessment: 3500000,
    actualSavings: 42000,
    status: 'won',
    filingDate: '2024-02-10',
    resolutionDate: '2024-06-30',
    jurisdiction: 'Harris County',
    propertyType: 'Mixed Use',
    appealType: 'value',
    clientId: 'client-1'
  },
  {
    id: 'appeal-5',
    propertyAddress: '555 Executive Way, Austin TX',
    originalAssessment: 2200000,
    newAssessment: 2200000,
    actualSavings: 0,
    status: 'pending',
    filingDate: '2024-06-15',
    jurisdiction: 'Travis County',
    propertyType: 'Office',
    appealType: 'value',
    clientId: 'client-1'
  }
];

export function ClientReportingEngine({ 
  clientId = 'client-1',
  appeals = mockAppeals,
  onGenerateReport,
  onExportReport 
}: ClientReportingEngineProps) {
  const [reportPeriod, setReportPeriod] = useState('2024');
  const [selectedFormat, setSelectedFormat] = useState('executive');
  const [customizationOptions, setCustomizationOptions] = useState({
    includeBranding: true,
    includeMetrics: true,
    includeCharts: true,
    includePropertyDetails: true,
    includeMarketAnalysis: false
  });

  const reportMetrics = useMemo(() => {
    const completedAppeals = appeals.filter(a => a.status !== 'pending');
    const wonAppeals = appeals.filter(a => a.status === 'won' || a.status === 'settled');
    
    return {
      totalSavings: appeals.reduce((sum, a) => sum + a.actualSavings, 0),
      propertiesAppealed: appeals.length,
      successRate: completedAppeals.length > 0 ? (wonAppeals.length / completedAppeals.length) * 100 : 0,
      averageSavings: wonAppeals.length > 0 ? wonAppeals.reduce((sum, a) => sum + a.actualSavings, 0) / wonAppeals.length : 0,
      pendingAppeals: appeals.filter(a => a.status === 'pending').length,
      byJurisdiction: appeals.reduce((acc, appeal) => {
        acc[appeal.jurisdiction] = (acc[appeal.jurisdiction] || 0) + appeal.actualSavings;
        return acc;
      }, {} as Record<string, number>),
      byPropertyType: appeals.reduce((acc, appeal) => {
        acc[appeal.propertyType] = (acc[appeal.propertyType] || 0) + appeal.actualSavings;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [appeals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'settled':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'lost':
        return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'pending':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const handleGenerateReport = () => {
    const reportConfig = {
      clientId,
      reportPeriod,
      format: selectedFormat,
      customization: customizationOptions,
      appeals: appeals.filter(a => a.filingDate.includes(reportPeriod))
    };
    
    onGenerateReport?.(reportConfig);
  };

  const handleExportReport = (format: string) => {
    onExportReport?.('current-report', format);
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card className="p-6">
        <h2 className="text-headline-medium font-semibold text-neutral-900 mb-6">
          Client Report Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Report Period */}
          <div className="space-y-2">
            <label className="text-label-medium font-medium text-neutral-700">
              Report Period
            </label>
            <select 
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-apple border border-neutral-200 bg-white text-body-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="2024">Full Year 2024</option>
              <option value="2024-Q4">Q4 2024</option>
              <option value="2024-Q3">Q3 2024</option>
              <option value="2024-Q2">Q2 2024</option>
              <option value="2024-Q1">Q1 2024</option>
            </select>
          </div>

          {/* Report Format */}
          <div className="space-y-2">
            <label className="text-label-medium font-medium text-neutral-700">
              Report Format
            </label>
            <select 
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 rounded-apple border border-neutral-200 bg-white text-body-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="executive">Executive Summary</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="property">Property-by-Property</option>
              <option value="presentation">Client Presentation</option>
            </select>
          </div>

          {/* Customization */}
          <div className="space-y-2">
            <label className="text-label-medium font-medium text-neutral-700">
              Customization
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={customizationOptions.includeBranding}
                  onChange={(e) => setCustomizationOptions(prev => ({ ...prev, includeBranding: e.target.checked }))}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-body-small">Firm Branding</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={customizationOptions.includeCharts}
                  onChange={(e) => setCustomizationOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-body-small">Visual Charts</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={customizationOptions.includeMarketAnalysis}
                  onChange={(e) => setCustomizationOptions(prev => ({ ...prev, includeMarketAnalysis: e.target.checked }))}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-body-small">Market Analysis</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-200">
          <div className="flex items-center space-x-4">
            <Button
              variant="primary"
              onClick={handleGenerateReport}
            >
              Generate Report
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExportReport('pdf')}
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExportReport('excel')}
            >
              Export Excel
            </Button>
          </div>
          
          <div className="text-right">
            <p className="text-caption text-neutral-500">Last generated:</p>
            <p className="text-body-medium font-medium">Today, 2:30 PM</p>
          </div>
        </div>
      </Card>

      {/* Performance Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-success-50 to-success-100">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💰</span>
              <span className="text-label-medium font-medium text-success-700">Total Savings</span>
            </div>
            <p className="text-headline-large font-bold text-success-900">
              ${reportMetrics.totalSavings.toLocaleString()}
            </p>
            <p className="text-caption text-success-600">Achieved this period</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span className="text-label-medium font-medium text-primary-700">Success Rate</span>
            </div>
            <p className="text-headline-large font-bold text-primary-900">
              {reportMetrics.successRate.toFixed(1)}%
            </p>
            <p className="text-caption text-primary-600">Appeals won or settled</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-warning-50 to-warning-100">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <span className="text-label-medium font-medium text-warning-700">Avg Savings</span>
            </div>
            <p className="text-headline-large font-bold text-warning-900">
              ${reportMetrics.averageSavings.toLocaleString()}
            </p>
            <p className="text-caption text-warning-600">Per successful appeal</p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏢</span>
              <span className="text-label-medium font-medium text-neutral-700">Properties</span>
            </div>
            <p className="text-headline-large font-bold text-neutral-900">
              {reportMetrics.propertiesAppealed}
            </p>
            <p className="text-caption text-neutral-600">Total appealed</p>
          </div>
        </Card>
      </div>

      {/* Results by Jurisdiction */}
      <Card className="p-6">
        <h3 className="text-title-medium font-semibold text-neutral-900 mb-4">
          Results by Jurisdiction
        </h3>
        
        <div className="space-y-3">
          {Object.entries(reportMetrics.byJurisdiction).map(([jurisdiction, savings]) => (
            <div key={jurisdiction} className="flex items-center justify-between p-3 bg-neutral-50 rounded-apple">
              <span className="text-body-medium font-medium text-neutral-900">{jurisdiction}</span>
              <span className="text-body-medium font-bold text-success-600">
                ${savings.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Property Results Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-title-medium font-semibold text-neutral-900">
            Property Appeal Results
          </h3>
          
          <div className="flex items-center space-x-2">
            <span className="text-body-small text-neutral-600">
              {appeals.length} properties
            </span>
            {reportMetrics.pendingAppeals > 0 && (
              <span className="px-2 py-1 bg-warning-50 text-warning-600 rounded-apple text-caption font-medium">
                {reportMetrics.pendingAppeals} pending
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-label-medium font-medium text-neutral-700">Property</th>
                <th className="text-left py-3 px-4 text-label-medium font-medium text-neutral-700">Original</th>
                <th className="text-left py-3 px-4 text-label-medium font-medium text-neutral-700">New</th>
                <th className="text-left py-3 px-4 text-label-medium font-medium text-neutral-700">Savings</th>
                <th className="text-left py-3 px-4 text-label-medium font-medium text-neutral-700">Status</th>
                <th className="text-left py-3 px-4 text-label-medium font-medium text-neutral-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal) => (
                <tr key={appeal.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-body-medium font-medium text-neutral-900">
                        {appeal.propertyAddress}
                      </p>
                      <p className="text-caption text-neutral-500">
                        {appeal.propertyType} • {appeal.jurisdiction}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-body-medium text-neutral-700">
                    ${appeal.originalAssessment.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-body-medium text-neutral-700">
                    ${appeal.newAssessment.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-body-medium font-medium ${
                      appeal.actualSavings > 0 ? 'text-success-600' : 'text-neutral-500'
                    }`}>
                      {appeal.actualSavings > 0 ? `$${appeal.actualSavings.toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-apple text-caption font-medium border ${getStatusColor(appeal.status)}`}>
                      {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-body-small text-neutral-600">
                    {new Date(appeal.filingDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Report Preview */}
      <Card className="p-6 bg-gradient-to-br from-primary-50 to-success-50">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">📄</span>
          <h3 className="text-title-medium font-semibold text-neutral-900">
            Report Preview
          </h3>
        </div>
        
        <div className="bg-white rounded-apple-lg p-6 border border-neutral-200">
          <div className="text-center space-y-3">
            <div className="text-6xl">📊</div>
            <h4 className="text-title-medium font-semibold text-neutral-900">
              {selectedFormat === 'executive' ? 'Executive Summary Report' : 
               selectedFormat === 'detailed' ? 'Detailed Analysis Report' :
               selectedFormat === 'property' ? 'Property-by-Property Report' :
               'Client Presentation'}
            </h4>
            <p className="text-body-medium text-neutral-600 max-w-md mx-auto">
              Professional report showing {reportMetrics.totalSavings > 0 ? `$${reportMetrics.totalSavings.toLocaleString()} in tax savings` : 'property tax appeal results'} 
              {customizationOptions.includeBranding ? ' with your firm branding' : ''}.
            </p>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExportReport('pdf')}
              >
                Download PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExportReport('preview')}
              >
                Preview
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ClientReportingEngine;