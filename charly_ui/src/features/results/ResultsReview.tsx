import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '../../components/ToastProvider';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  jurisdiction: string;
  assessedValue: number;
  indicatedValue: number;
  variance: number;
  status: 'DRAFT' | 'READY' | 'PACKET_GENERATED' | 'SUBMITTED' | 'COMPLETED';
  confidence: number;
  lastModified: string;
  packetId?: string;
}

interface FilterOptions {
  jurisdiction: string;
  status: string;
  valueThreshold: number;
  sortBy: 'name' | 'assessedValue' | 'variance' | 'lastModified';
  sortOrder: 'asc' | 'desc';
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface ResultsData {
  properties: Property[];
  pagination: PaginationInfo;
  availableJurisdictions: string[];
  availableStatuses: string[];
}

interface ResultsReviewProps {
  // Props for integration with portfolio context
}

// Mock SWARTZ results data
const mockResultsData: ResultsData = {
  properties: [
    {
      id: 'OBZ-2023-001',
      name: 'Office Building Z',
      address: '1250 Business Park Drive',
      city: 'Austin',
      state: 'TX',
      jurisdiction: 'Travis County',
      assessedValue: 2800000,
      indicatedValue: 3050000,
      variance: -250000, // Overassessed
      status: 'PACKET_GENERATED',
      confidence: 0.83,
      lastModified: '2024-01-15T10:30:00Z',
      packetId: 'packet-123'
    },
    {
      id: 'ABC-2023-002',
      name: 'ABC Company Office Complex',
      address: '4500 Technology Way',
      city: 'Austin',
      state: 'TX',
      jurisdiction: 'Travis County',
      assessedValue: 1850000,
      indicatedValue: 1844660,
      variance: 5340, // Slightly overassessed
      status: 'READY',
      confidence: 0.82,
      lastModified: '2024-01-10T14:20:00Z'
    },
    {
      id: 'RETAIL-2023-003',
      name: 'Downtown Retail Plaza',
      address: '100 Main Street',
      city: 'Austin',
      state: 'TX',
      jurisdiction: 'Travis County',
      assessedValue: 3200000,
      indicatedValue: 3350000,
      variance: -150000, // Overassessed
      status: 'SUBMITTED',
      confidence: 0.76,
      lastModified: '2024-01-08T09:15:00Z',
      packetId: 'packet-456'
    },
    {
      id: 'WAREHOUSE-2023-004',
      name: 'Industrial Warehouse Complex',
      address: '500 Industrial Blvd',
      city: 'Round Rock',
      state: 'TX',
      jurisdiction: 'Williamson County',
      assessedValue: 1500000,
      indicatedValue: 1520000,
      variance: -20000, // Slightly overassessed
      status: 'DRAFT',
      confidence: 0.71,
      lastModified: '2024-01-05T16:45:00Z'
    }
  ],
  pagination: {
    currentPage: 1,
    totalPages: 2,
    totalItems: 6,
    itemsPerPage: 4
  },
  availableJurisdictions: ['All Jurisdictions', 'Travis County', 'Williamson County', 'Hays County'],
  availableStatuses: ['All Statuses', 'DRAFT', 'READY', 'PACKET_GENERATED', 'SUBMITTED', 'COMPLETED']
};

export function ResultsReview(props: ResultsReviewProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    jurisdiction: 'All Jurisdictions',
    status: 'All Statuses',
    valueThreshold: 10000,
    sortBy: 'lastModified',
    sortOrder: 'desc'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results-review', filters, currentPage],
    queryFn: async () => {
      // Simulate API call with filters and pagination
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Apply filters to mock data
      let filteredProperties = mockResultsData.properties;
      
      if (filters.jurisdiction !== 'All Jurisdictions') {
        filteredProperties = filteredProperties.filter(p => p.jurisdiction === filters.jurisdiction);
      }
      
      if (filters.status !== 'All Statuses') {
        filteredProperties = filteredProperties.filter(p => p.status === filters.status);
      }
      
      // Filter by variance threshold (absolute value)
      filteredProperties = filteredProperties.filter(p => Math.abs(p.variance) >= filters.valueThreshold);
      
      // Sort
      filteredProperties.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (filters.sortBy) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'assessedValue':
            aVal = a.assessedValue;
            bVal = b.assessedValue;
            break;
          case 'variance':
            aVal = Math.abs(a.variance);
            bVal = Math.abs(b.variance);
            break;
          case 'lastModified':
            aVal = new Date(a.lastModified);
            bVal = new Date(b.lastModified);
            break;
          default:
            aVal = a.name;
            bVal = b.name;
        }
        
        if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      // Paginate
      const startIndex = (currentPage - 1) * mockResultsData.pagination.itemsPerPage;
      const endIndex = startIndex + mockResultsData.pagination.itemsPerPage;
      const paginatedProperties = filteredProperties.slice(startIndex, endIndex);
      
      return {
        ...mockResultsData,
        properties: paginatedProperties,
        pagination: {
          ...mockResultsData.pagination,
          currentPage,
          totalItems: filteredProperties.length,
          totalPages: Math.ceil(filteredProperties.length / mockResultsData.pagination.itemsPerPage)
        }
      };
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'csv') => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { downloadUrl: `/api/v1/results/export.${format}`, format };
    },
    onSuccess: (result) => {
      addToast({ 
        type: 'success', 
        message: `Export completed. ${result.format.toUpperCase()} file ready for download.` 
      });
      // In real implementation, trigger download
      window.open(result.downloadUrl, '_blank');
    },
    onError: () => {
      addToast({ type: 'error', message: 'Export failed. Please try again.' });
    }
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!data) return;
    
    const allSelected = data.properties.every(p => selectedProperties.has(p.id));
    if (allSelected) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(data.properties.map(p => p.id)));
    }
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    exportMutation.mutate(format);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'READY':
        return 'bg-yellow-100 text-yellow-800';
      case 'PACKET_GENERATED':
        return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED':
        return 'bg-purple-100 text-purple-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceColor = (variance: number) => {
    return variance < 0 ? 'text-red-600' : 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading results...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Failed to load results data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Results Review & Export</h1>
            <p className="text-gray-600">
              Review completed property analyses and export reports
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExport('csv')}
              disabled={exportMutation.isPending}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exportMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {exportMutation.isPending ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters & Sorting</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jurisdiction
            </label>
            <select
              value={filters.jurisdiction}
              onChange={(e) => handleFilterChange('jurisdiction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {data.availableJurisdictions.map(jurisdiction => (
                <option key={jurisdiction} value={jurisdiction}>
                  {jurisdiction}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {data.availableStatuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Variance
            </label>
            <input
              type="number"
              value={filters.valueThreshold}
              onChange={(e) => handleFilterChange('valueThreshold', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="assessedValue">Assessed Value</option>
              <option value="variance">Variance</option>
              <option value="lastModified">Last Modified</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Properties ({data.pagination.totalItems} total)
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {selectedProperties.size} selected
              </span>
              {selectedProperties.size > 0 && (
                <button
                  onClick={() => setSelectedProperties(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={data.properties.length > 0 && data.properties.every(p => selectedProperties.has(p.id))}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jurisdiction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Indicated Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.properties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProperties.has(property.id)}
                      onChange={() => handleSelectProperty(property.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{property.name}</div>
                      <div className="text-sm text-gray-500">
                        {property.address}, {property.city}, {property.state}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{property.jurisdiction}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(property.assessedValue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(property.indicatedValue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getVarianceColor(property.variance)}`}>
                      {formatCurrency(Math.abs(property.variance))}
                      {property.variance < 0 ? ' Over' : ' Under'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                      {property.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(property.confidence * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`/property/${property.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {property.packetId && (
                        <button
                          onClick={() => window.open(`/api/v1/appeal-packet/${property.packetId}`, '_blank')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(data.pagination.totalPages, currentPage + 1))}
                disabled={currentPage === data.pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((currentPage - 1) * data.pagination.itemsPerPage) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * data.pagination.itemsPerPage, data.pagination.totalItems)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{data.pagination.totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ← Previous
                  </button>
                  {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(data.pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === data.pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}