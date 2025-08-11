import React, { useState } from 'react';
import { Building, TrendingUp, DollarSign, BarChart3, FileText, AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface PropertyMetrics {
  noi: number;
  capRate: number;
  occupancyRate: number;
  rentPerSqFt: number;
  expenseRatio: number;
  dscr: number;
  assessmentToValue: number;
  marketRentGrowth: number;
}

interface PropertyAnalysis {
  propertyType: string;
  metrics: PropertyMetrics;
  comparables: {
    address: string;
    salePrice: number;
    capRate: number;
    pricePerSqFt: number;
    distance: number;
  }[];
  risks: {
    level: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
  }[];
  recommendations: string[];
}

const sampleAnalysis: Record<string, PropertyAnalysis> = {
  office: {
    propertyType: 'Office Building',
    metrics: {
      noi: 2850000,
      capRate: 6.8,
      occupancyRate: 92,
      rentPerSqFt: 42.5,
      expenseRatio: 38,
      dscr: 1.45,
      assessmentToValue: 115,
      marketRentGrowth: 3.2
    },
    comparables: [
      { address: '100 Tech Plaza', salePrice: 45000000, capRate: 6.5, pricePerSqFt: 450, distance: 0.8 },
      { address: '200 Innovation Drive', salePrice: 38000000, capRate: 7.1, pricePerSqFt: 420, distance: 1.2 },
      { address: '300 Business Park', salePrice: 52000000, capRate: 6.3, pricePerSqFt: 480, distance: 1.5 }
    ],
    risks: [
      { level: 'medium', description: 'Tenant concentration risk', impact: '35% of NOI from single tenant' },
      { level: 'low', description: 'Market vacancy trending down', impact: 'Positive rent growth expected' },
      { level: 'high', description: 'Major lease expiration 2025', impact: 'Potential 20% NOI reduction' }
    ],
    recommendations: [
      'Appeal based on 15% over-assessment relative to market comparables',
      'Emphasize upcoming lease expiration risk in valuation argument',
      'Request income approach with 7.0% cap rate based on tenant risk'
    ]
  },
  retail: {
    propertyType: 'Retail Center',
    metrics: {
      noi: 1950000,
      capRate: 7.5,
      occupancyRate: 88,
      rentPerSqFt: 28.5,
      expenseRatio: 42,
      dscr: 1.25,
      assessmentToValue: 108,
      marketRentGrowth: 2.1
    },
    comparables: [
      { address: '500 Shopping Center', salePrice: 28000000, capRate: 7.2, pricePerSqFt: 320, distance: 2.1 },
      { address: '600 Main Street Mall', salePrice: 32000000, capRate: 7.8, pricePerSqFt: 300, distance: 1.8 },
      { address: '700 Town Square', salePrice: 26000000, capRate: 8.0, pricePerSqFt: 280, distance: 2.5 }
    ],
    risks: [
      { level: 'high', description: 'E-commerce competition', impact: 'Declining foot traffic trends' },
      { level: 'medium', description: 'Anchor tenant instability', impact: 'Credit watch on major tenant' },
      { level: 'low', description: 'Strong demographics', impact: 'Growing population in trade area' }
    ],
    recommendations: [
      'Highlight e-commerce impact on retail valuations',
      'Request 8% cap rate adjustment for market conditions',
      'Provide evidence of declining retail sales in submarket'
    ]
  },
  industrial: {
    propertyType: 'Industrial/Warehouse',
    metrics: {
      noi: 3200000,
      capRate: 5.5,
      occupancyRate: 98,
      rentPerSqFt: 12.5,
      expenseRatio: 25,
      dscr: 1.65,
      assessmentToValue: 103,
      marketRentGrowth: 4.8
    },
    comparables: [
      { address: '1000 Logistics Way', salePrice: 58000000, capRate: 5.3, pricePerSqFt: 180, distance: 3.2 },
      { address: '1100 Distribution Blvd', salePrice: 62000000, capRate: 5.7, pricePerSqFt: 175, distance: 2.8 },
      { address: '1200 Warehouse Drive', salePrice: 55000000, capRate: 5.8, pricePerSqFt: 170, distance: 3.5 }
    ],
    risks: [
      { level: 'low', description: 'E-commerce driven demand', impact: 'Continued rent growth expected' },
      { level: 'low', description: 'Long-term triple net lease', impact: 'Stable income stream' },
      { level: 'medium', description: 'Functional obsolescence', impact: 'Clear height below modern standards' }
    ],
    recommendations: [
      'Assessment appears reasonable given strong market fundamentals',
      'Consider functional obsolescence adjustment for ceiling height',
      'Limited appeal opportunity - focus on physical depreciation'
    ]
  }
};

const CommercialPropertyAnalysis: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('office');
  const [activeTab, setActiveTab] = useState<'metrics' | 'comparables' | 'risks'>('metrics');
  const analysis = sampleAnalysis[selectedType];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Building className="h-6 w-6 text-blue-600" />
          Commercial Property Specialized Analysis
        </h2>
        <p className="text-gray-600">
          Advanced analysis tools for commercial real estate tax appeals
        </p>
      </div>

      {/* Property Type Selector */}
      <div className="mb-6">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="office">Office Building</SelectItem>
            <SelectItem value="retail">Retail Center</SelectItem>
            <SelectItem value="industrial">Industrial/Warehouse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'metrics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('metrics')}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Key Metrics
        </Button>
        <Button
          variant={activeTab === 'comparables' ? 'default' : 'outline'}
          onClick={() => setActiveTab('comparables')}
          className="flex items-center gap-2"
        >
          <Building className="h-4 w-4" />
          Comparables
        </Button>
        <Button
          variant={activeTab === 'risks' ? 'default' : 'outline'}
          onClick={() => setActiveTab('risks')}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Risk Analysis
        </Button>
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Net Operating Income</span>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analysis.metrics.noi)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Annual NOI</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Cap Rate</span>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analysis.metrics.capRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Market cap rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Occupancy Rate</span>
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{analysis.metrics.occupancyRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Current occupancy</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Rent PSF</span>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">${analysis.metrics.rentPerSqFt}</p>
                <p className="text-xs text-gray-500 mt-1">Per square foot</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Expense Ratio</span>
                  <span className="text-sm font-medium">{analysis.metrics.expenseRatio}%</span>
                </div>
                <Progress value={analysis.metrics.expenseRatio} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">DSCR (Debt Service Coverage)</span>
                  <span className="text-sm font-medium">{analysis.metrics.dscr}x</span>
                </div>
                <Progress value={analysis.metrics.dscr * 40} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Assessment to Market Value</span>
                  <span className="text-sm font-medium">{analysis.metrics.assessmentToValue}%</span>
                </div>
                <Progress 
                  value={analysis.metrics.assessmentToValue} 
                  className="h-2"
                  style={{ 
                    backgroundColor: analysis.metrics.assessmentToValue > 100 ? '#FEE2E2' : '#E5E7EB' 
                  }}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Market Rent Growth</span>
                  <span className="text-sm font-medium">{analysis.metrics.marketRentGrowth}%</span>
                </div>
                <Progress value={analysis.metrics.marketRentGrowth * 10} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparables Tab */}
      {activeTab === 'comparables' && (
        <div className="space-y-4">
          {analysis.comparables.map((comp, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{comp.address}</h3>
                    <p className="text-sm text-gray-500">{comp.distance} miles away</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(comp.salePrice)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cap Rate</span>
                    <p className="font-semibold">{comp.capRate}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Price per SF</span>
                    <p className="font-semibold">${comp.pricePerSqFt}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Distance</span>
                    <p className="font-semibold">{comp.distance} mi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Risk Analysis Tab */}
      {activeTab === 'risks' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {analysis.risks.map((risk, index) => (
              <Card key={index} className={getRiskColor(risk.level).split(' ')[1]}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${getRiskColor(risk.level).split(' ')[0]}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{risk.description}</h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskColor(risk.level)}`}>
                          {risk.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{risk.impact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Appeal Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CommercialPropertyAnalysis;