import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Building, MapPin, Calculator, BarChart3, Search, X, SlidersHorizontal, Package } from "lucide-react";
import { getJurisdictionOptions } from "@/services/jurisdictionService";
import { getAllPropertyTypes } from "@/services/propertyTypeService";

interface MockProperty {
  id: string;
  address: string;
  propertyType: string;
  currentAssessment: number;
  estimatedValue: number;
  potentialSavings: number;
  status: string;
  jurisdiction: string;
  parcelNumber: string;
  ownerName: string;
  yearBuilt: number;
  squareFootage: number;
}

interface FilterOptions {
  searchQuery: string;
  selectedJurisdiction: string;
  selectedPropertyType: string;
  filterStatus: string;
  minValue: string;
  maxValue: string;
  sortBy: 'address' | 'value' | 'savings' | 'status';
}

interface PropertyFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedJurisdiction: string;
  setSelectedJurisdiction: (jurisdiction: string) => void;
  selectedPropertyType: string;
  setSelectedPropertyType: (type: string) => void;
  minValue: string;
  setMinValue: (value: string) => void;
  maxValue: string;
  setMaxValue: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  sortBy: 'address' | 'value' | 'savings' | 'status';
  setSortBy: (sort: 'address' | 'value' | 'savings' | 'status') => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  compareProperties: string[];
  setCompareProperties: (properties: string[]) => void;
  setViewMode: (mode: string) => void;
  setShowAddPropertyModal: (show: boolean) => void;
  setShowBulkActionsModal: (show: boolean) => void;
  handleFileUpload: (files: FileList) => void;
  displayProperties: MockProperty[];
}

export function PropertyFilters({
  searchQuery,
  setSearchQuery,
  selectedJurisdiction,
  setSelectedJurisdiction,
  selectedPropertyType,
  setSelectedPropertyType,
  minValue,
  setMinValue,
  maxValue,
  setMaxValue,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  showAdvancedFilters,
  setShowAdvancedFilters,
  compareProperties,
  // setCompareProperties: _setCompareProperties,
  setViewMode,
  setShowAddPropertyModal,
  setShowBulkActionsModal,
  handleFileUpload,
  displayProperties
}: PropertyFiltersProps) {
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedJurisdiction('all');
    setSelectedPropertyType('all');
    setFilterStatus('all');
    setMinValue('');
    setMaxValue('');
  };

  const activeFilters = [
    { key: 'search', value: searchQuery, label: `Search: "${searchQuery}"` },
    { key: 'jurisdiction', value: selectedJurisdiction !== 'all' ? selectedJurisdiction : '', label: `Jurisdiction: ${selectedJurisdiction}` },
    { key: 'type', value: selectedPropertyType !== 'all' ? selectedPropertyType : '', label: `Type: ${selectedPropertyType}` },
    { key: 'status', value: filterStatus !== 'all' ? filterStatus : '', label: `Status: ${filterStatus}` },
    { key: 'min', value: minValue, label: `Min: $${parseInt(minValue).toLocaleString()}` },
    { key: 'max', value: maxValue, label: `Max: $${parseInt(maxValue).toLocaleString()}` }
  ].filter(filter => filter.value);

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Portfolio</h1>
          <p className="text-gray-600">Manage and analyze your property tax appeals</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setViewMode('analytics')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Button>
          
          <Button
            onClick={() => setViewMode('multistate')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Multi-State
          </Button>
          
          {compareProperties.length >= 2 && (
            <Button
              onClick={() => setViewMode('comparison')}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Compare Selected ({compareProperties.length})
            </Button>
          )}
          
          {compareProperties.length > 0 && (
            <Button
              onClick={() => setShowBulkActionsModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Bulk Actions ({compareProperties.length})
            </Button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
          <CardContent className="p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700">Upload Portfolio Data</p>
            <p className="text-sm text-gray-500 mb-4">CSV, Excel, XML files</p>
            <Button 
              onClick={() => document.getElementById('file-upload')?.click()}
              variant="outline"
              size="sm"
            >
              Choose Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.xml"
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <Building className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-700">Add Single Property</p>
            <p className="text-sm text-blue-600 mb-4">Manual property entry</p>
            <Button 
              onClick={() => setShowAddPropertyModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <Calculator className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-700">Portfolio Stats</p>
            <p className="text-sm text-green-600 mb-4">{displayProperties.length} properties loaded</p>
            <Button 
              onClick={() => setViewMode('analytics')}
              variant="outline"
              size="sm"
              className="border-green-600 text-green-700 hover:bg-green-100"
            >
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Search & Filter Properties</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showAdvancedFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by address, owner, or parcel number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Appeal Filed">Appeal Filed</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="address">Address</SelectItem>
                <SelectItem value="value">Estimated Value</SelectItem>
                <SelectItem value="savings">Potential Savings</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center justify-center"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jurisdictions</SelectItem>
                    {getJurisdictionOptions().map((jurisdiction) => (
                      <SelectItem key={jurisdiction.value} value={jurisdiction.label}>
                        {jurisdiction.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Property Types</SelectItem>
                    {getAllPropertyTypes().map((type) => (
                      <SelectItem key={type.iaao_code} value={type.display_name}>
                        {type.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Minimum Value
                  </label>
                  <Input
                    type="number"
                    placeholder="$0"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Maximum Value
                  </label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMinValue('1000000');
                    setFilterStatus('all');
                  }}
                >
                  High Value ($1M+)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterStatus('Under Review');
                  }}
                >
                  Flagged Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedJurisdiction('Harris County');
                  }}
                >
                  Harris County
                </Button>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                {activeFilters.map((filter) => (
                  <Badge 
                    key={filter.key} 
                    variant="secondary" 
                    className="flex items-center gap-1"
                  >
                    {filter.label}
                    <button
                      onClick={() => {
                        switch (filter.key) {
                          case 'search': setSearchQuery(''); break;
                          case 'jurisdiction': setSelectedJurisdiction('all'); break;
                          case 'type': setSelectedPropertyType('all'); break;
                          case 'status': setFilterStatus('all'); break;
                          case 'min': setMinValue(''); break;
                          case 'max': setMaxValue(''); break;
                        }
                      }}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// Static method for filtering and sorting
PropertyFilters.filterAndSortProperties = (
  properties: MockProperty[],
  filters: FilterOptions
): MockProperty[] => {
  return properties
    .filter((property) => {
      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const searchFields = [
          property.address,
          property.ownerName,
          property.parcelNumber,
          property.propertyType,
          property.jurisdiction
        ];
        if (!searchFields.some(field => field.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Jurisdiction filter
      if (filters.selectedJurisdiction !== 'all' && property.jurisdiction !== filters.selectedJurisdiction) {
        return false;
      }

      // Property type filter
      if (filters.selectedPropertyType !== 'all' && property.propertyType !== filters.selectedPropertyType) {
        return false;
      }

      // Status filter
      if (filters.filterStatus !== 'all' && property.status !== filters.filterStatus) {
        return false;
      }

      // Value range filter
      if (filters.minValue && property.estimatedValue < parseInt(filters.minValue)) {
        return false;
      }
      if (filters.maxValue && property.estimatedValue > parseInt(filters.maxValue)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'address':
          return a.address.localeCompare(b.address);
        case 'value':
          return b.estimatedValue - a.estimatedValue;
        case 'savings':
          return b.potentialSavings - a.potentialSavings;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
};