import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, Filter } from 'lucide-react';

interface FilterOptions {
  dateRange: string;
  propertyType: string;
  status: string;
}

interface DashboardFiltersProps {
  lastRefresh: Date;
  autoRefresh: boolean;
  filterOptions: FilterOptions;
  exportFormat: 'csv' | 'pdf' | 'excel';
  onRefresh: () => void;
  onToggleAutoRefresh: () => void;
  onFilterChange: (filters: FilterOptions) => void;
  onExportFormatChange: (format: 'csv' | 'pdf' | 'excel') => void;
  onExport: () => void;
  refreshing?: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  lastRefresh,
  autoRefresh,
  filterOptions,
  exportFormat,
  onRefresh,
  onToggleAutoRefresh,
  onFilterChange,
  onExportFormatChange,
  onExport,
  refreshing = false
}) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      
      <Button
        variant={autoRefresh ? "default" : "outline"}
        size="sm"
        onClick={onToggleAutoRefresh}
        className="flex items-center gap-2"
      >
        <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        Auto
      </Button>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
        
        <Select 
          value={filterOptions.dateRange}
          onValueChange={(value) => onFilterChange({ ...filterOptions, dateRange: value })}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7days">Last 7 days</SelectItem>
            <SelectItem value="last30days">Last 30 days</SelectItem>
            <SelectItem value="last90days">Last 90 days</SelectItem>
            <SelectItem value="lastyear">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={exportFormat}
          onValueChange={onExportFormatChange}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </div>
  );
};