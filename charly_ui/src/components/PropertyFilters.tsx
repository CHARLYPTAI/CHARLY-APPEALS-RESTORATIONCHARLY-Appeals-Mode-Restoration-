import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import JurisdictionDropdown from "./JurisdictionDropdown";

interface PropertyFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedJurisdiction: string;
  setSelectedJurisdiction: (jurisdiction: string) => void;
  selectedPropertyType: string;
  setSelectedPropertyType: (type: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  minValue: string;
  setMinValue: (value: string) => void;
  maxValue: string;
  setMaxValue: (value: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  sortBy: 'address' | 'value' | 'savings' | 'status';
  setSortBy: (sort: 'address' | 'value' | 'savings' | 'status') => void;
}

export function PropertyFilters({
  searchQuery,
  setSearchQuery,
  selectedJurisdiction,
  setSelectedJurisdiction,
  selectedPropertyType,
  setSelectedPropertyType,
  filterStatus,
  setFilterStatus,
  minValue,
  setMinValue,
  maxValue,
  setMaxValue,
  showAdvancedFilters,
  setShowAdvancedFilters,
  sortBy,
  setSortBy
}: PropertyFiltersProps) {
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedJurisdiction('all');
    setSelectedPropertyType('all');
    setFilterStatus('all');
    setMinValue('');
    setMaxValue('');
  };

  const hasActiveFilters = searchQuery || selectedJurisdiction !== 'all' || 
    selectedPropertyType !== 'all' || filterStatus !== 'all' || minValue || maxValue;

  return (
    <div className="space-y-4">
      {/* Basic Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search properties by address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="ready">Appeal Ready</SelectItem>
            <SelectItem value="filed">Filed</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(value: 'address' | 'value' | 'savings' | 'status') => setSortBy(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="address">Address</SelectItem>
            <SelectItem value="value">Value</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Advanced
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Jurisdiction Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jurisdiction
              </label>
              <JurisdictionDropdown
                value={selectedJurisdiction}
                onValueChange={setSelectedJurisdiction}
                placeholder="All Jurisdictions"
                includeAll={true}
                simplified={true}
              />
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Value Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Value Range
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Min"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  type="number"
                />
                <Input
                  placeholder="Max"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Active filters:</span>
                {searchQuery && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Search: "{searchQuery}"</span>}
                {selectedJurisdiction !== 'all' && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Jurisdiction: {selectedJurisdiction}</span>}
                {selectedPropertyType !== 'all' && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Type: {selectedPropertyType}</span>}
                {filterStatus !== 'all' && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Status: {filterStatus}</span>}
                {(minValue || maxValue) && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Value: {minValue || '0'} - {maxValue || '∞'}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PropertyFilters;