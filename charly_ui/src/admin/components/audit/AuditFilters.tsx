import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../AdminGuard';

export interface AuditFilters {
  tenant: 'RESIDENTIAL' | 'COMMERCIAL' | 'ALL';
  actor: string;
  action: string;
  route: string;
  status: 'SUCCESS' | 'DENIED' | 'ERROR' | 'ALL';
  dateFrom: string;
  dateTo: string;
  correlationId: string;
}

interface AuditFiltersProps {
  filters: AuditFilters;
  onFiltersChange: (filters: AuditFilters) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const ACTION_OPTIONS = [
  'CREATE',
  'UPDATE', 
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'PERMISSION_CHANGE',
  'ACCESS',
  'UPLOAD',
  'EXPORT',
  'IMPORT'
];

const STATUS_OPTIONS = [
  { value: 'SUCCESS', label: 'Success', color: 'text-green-600' },
  { value: 'DENIED', label: 'Denied', color: 'text-red-600' },
  { value: 'ERROR', label: 'Error', color: 'text-orange-600' }
];

export function AuditFilters({ filters, onFiltersChange, onRefresh, isLoading = false }: AuditFiltersProps) {
  const adminUser = useAdmin();
  const [expandedFilters, setExpandedFilters] = useState(false);
  
  // Auto-expand if any advanced filters are set
  useEffect(() => {
    if (filters.actor || filters.route || filters.correlationId || filters.dateFrom || filters.dateTo) {
      setExpandedFilters(true);
    }
  }, [filters]);

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      tenant: adminUser.role === 'tenant_admin' ? adminUser.tenant_type! : 'ALL',
      actor: '',
      action: '',
      route: '',
      status: 'ALL',
      dateFrom: '',
      dateTo: '',
      correlationId: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.tenant !== 'ALL' || 
           filters.actor || 
           filters.action || 
           filters.route ||
           filters.status !== 'ALL' ||
           filters.dateFrom || 
           filters.dateTo || 
           filters.correlationId;
  };

  // Set default date range to last 24 hours if no dates set
  const setQuickDateRange = (hours: number) => {
    const now = new Date();
    const from = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    
    onFiltersChange({
      ...filters,
      dateFrom: from.toISOString().slice(0, 16),
      dateTo: now.toISOString().slice(0, 16)
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Audit Log Filters
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
              Filtered
            </span>
          )}
          <button
            onClick={() => setExpandedFilters(!expandedFilters)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            {expandedFilters ? 'Collapse' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* Primary Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Tenant Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tenant
          </label>
          <select
            value={filters.tenant}
            onChange={(e) => handleFilterChange('tenant', e.target.value)}
            disabled={adminUser.role === 'tenant_admin'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500"
          >
            {adminUser.role === 'superadmin' && <option value="ALL">All Tenants</option>}
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Action
          </label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Status</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        {/* Quick Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quick Range
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setQuickDateRange(24)}
              className="px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              24h
            </button>
            <button
              onClick={() => setQuickDateRange(168)}
              className="px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              7d
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {expandedFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Actor (Email/ID) Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Actor (Email/ID)
              </label>
              <input
                type="text"
                value={filters.actor}
                onChange={(e) => handleFilterChange('actor', e.target.value)}
                placeholder="user@example.com or user ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Route/Path Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Route/Path Prefix
              </label>
              <input
                type="text"
                value={filters.route}
                onChange={(e) => handleFilterChange('route', e.target.value)}
                placeholder="/api/admin/users"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Correlation ID */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correlation ID
              </label>
              <input
                type="text"
                value={filters.correlationId}
                onChange={(e) => handleFilterChange('correlationId', e.target.value)}
                placeholder="correlation-id-123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date (UTC)
              </label>
              <input
                type="datetime-local"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date (UTC)
              </label>
              <input
                type="datetime-local"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Filters
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Apply Filters
          </button>
        </div>

        {hasActiveFilters() && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {Object.values(filters).filter(v => v && v !== 'ALL').length} active filter(s)
          </div>
        )}
      </div>
    </div>
  );
}