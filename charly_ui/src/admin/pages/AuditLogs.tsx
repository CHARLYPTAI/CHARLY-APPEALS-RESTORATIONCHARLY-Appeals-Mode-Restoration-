import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';
import { AuditFilters } from '../components/audit/AuditFilters';
import { AuditTable, AuditLogEntry, TablePagination, SortConfig } from '../components/audit/AuditTable';
import { CorrelationBanner } from '../components/audit/CorrelationBanner';

interface AuditResponse {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export function AuditLogs() {
  const adminUser = useAdmin();
  const canReadAudit = hasPermission(adminUser, 'admin:audit:read');
  const canExport = hasPermission(adminUser, 'admin:audit:read'); // Same permission for now

  // State management
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationFilter, setCorrelationFilter] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<AuditFilters>({
    tenant: adminUser.role === 'tenant_admin' ? adminUser.tenant_type! : 'ALL',
    actor: '',
    action: '',
    route: '',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
    correlationId: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState<TablePagination>({
    page: 1,
    pageSize: 25,
    total: 0
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc'
  });

  // Handle URL hash for deep-linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const cidMatch = hash.match(/#cid=([^&]+)/);
      if (cidMatch) {
        const correlationId = decodeURIComponent(cidMatch[1]);
        setCorrelationFilter(correlationId);
        setFilters(prev => ({ ...prev, correlationId }));
      }
    };

    handleHashChange(); // Check initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Generate correlation ID for requests
  const generateCorrelationId = useCallback((): string => {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    if (!canReadAudit) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        limit: pagination.pageSize.toString(),
        offset: ((pagination.page - 1) * pagination.pageSize).toString()
      });

      // Apply filters
      if (filters.tenant !== 'ALL') {
        params.set('tenant', filters.tenant);
      }
      if (filters.actor) {
        params.set('actor', filters.actor);
      }
      if (filters.action) {
        params.set('action', filters.action);
      }
      if (filters.route) {
        params.set('route', filters.route);
      }
      if (filters.status !== 'ALL') {
        params.set('status', filters.status);
      }
      if (filters.dateFrom) {
        params.set('from', new Date(filters.dateFrom).toISOString());
      }
      if (filters.dateTo) {
        params.set('to', new Date(filters.dateTo).toISOString());
      }
      if (filters.correlationId) {
        params.set('correlationId', filters.correlationId);
      }

      // Add sorting
      if (sortConfig.field && sortConfig.direction) {
        params.set('sort', `${sortConfig.field}:${sortConfig.direction}`);
      }

      const response = await fetch(`/api/admin/audit/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to load audit logs`);
      }

      const data: AuditResponse = await response.json();
      setLogs(data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      console.error('Audit logs loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [canReadAudit, filters, pagination.page, pagination.pageSize, sortConfig, generateCorrelationId]);

  // Export logs to CSV
  const exportLogs = useCallback(async () => {
    if (!canExport) return;

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters (same as current filters but without pagination)
      const params = new URLSearchParams();

      if (filters.tenant !== 'ALL') {
        params.set('tenant', filters.tenant);
      }
      if (filters.actor) {
        params.set('actor', filters.actor);
      }
      if (filters.action) {
        params.set('action', filters.action);
      }
      if (filters.route) {
        params.set('route', filters.route);
      }
      if (filters.status !== 'ALL') {
        params.set('status', filters.status);
      }
      if (filters.dateFrom) {
        params.set('from', new Date(filters.dateFrom).toISOString());
      }
      if (filters.dateTo) {
        params.set('to', new Date(filters.dateTo).toISOString());
      }
      if (filters.correlationId) {
        params.set('correlationId', filters.correlationId);
      }

      const response = await fetch(`/api/admin/audit/logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Correlation-ID': generateCorrelationId()
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: HTTP ${response.status}`);
      }

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      console.error('Export error:', err);
    }
  }, [canExport, filters, generateCorrelationId]);

  // Event handlers
  const handleFiltersChange = (newFilters: AuditFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleCorrelationFilter = (correlationId: string) => {
    // Set correlation filter and update URL hash
    setCorrelationFilter(correlationId);
    window.location.hash = `cid=${encodeURIComponent(correlationId)}`;
    
    // Set time window filter (±5 minutes from current event)
    const currentTime = new Date();
    const fromTime = new Date(currentTime.getTime() - (5 * 60 * 1000));
    const toTime = new Date(currentTime.getTime() + (5 * 60 * 1000));
    
    setFilters(prev => ({
      ...prev,
      correlationId,
      dateFrom: fromTime.toISOString().slice(0, 16),
      dateTo: toTime.toISOString().slice(0, 16)
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearCorrelationFilter = () => {
    setCorrelationFilter(null);
    window.location.hash = '';
    setFilters(prev => ({
      ...prev,
      correlationId: '',
      dateFrom: '',
      dateTo: ''
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Load data on filter/pagination/sort changes
  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Permission check
  if (!canReadAudit) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                Access Denied
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                You do not have permission to view audit logs. Contact your administrator to request access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Audit Log Explorer
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor system activity, compliance events, and security incidents across all tenants
            </p>
          </div>
          
          {/* Retention Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                Logs retained 180 days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Correlation Banner */}
      {correlationFilter && (
        <CorrelationBanner
          correlationId={correlationFilter}
          onClear={clearCorrelationFilter}
          eventCount={pagination.total}
          timeWindow="±5 minutes"
        />
      )}

      {/* Filters */}
      <AuditFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={loadAuditLogs}
        isLoading={loading}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                Error Loading Audit Logs
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error}
              </p>
              <button
                onClick={loadAuditLogs}
                className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-300 text-xs font-medium rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Table */}
      <AuditTable
        logs={logs}
        pagination={pagination}
        sortConfig={sortConfig}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        onExport={exportLogs}
        onCorrelationFilter={handleCorrelationFilter}
        isLoading={loading}
        canExport={canExport}
      />
    </div>
  );
}