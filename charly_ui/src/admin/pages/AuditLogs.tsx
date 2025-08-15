import React, { useState, useEffect } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';

interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  tenantType?: 'RESIDENTIAL' | 'COMMERCIAL';
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  createdAt: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    tenant: 'ALL' as 'RESIDENTIAL' | 'COMMERCIAL' | 'ALL',
    action: '',
    resourceType: '',
    from: '',
    to: ''
  });
  
  const adminUser = useAdmin();
  const canReadAudit = hasPermission(adminUser, 'admin:audit:read');

  useEffect(() => {
    if (canReadAudit) {
      loadAuditLogs();
    }
  }, [filters, canReadAudit]);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const params = new URLSearchParams({
        limit: '50',
        offset: '0'
      });
      
      // Apply filters
      if (filters.tenant !== 'ALL') {
        params.set('tenant', filters.tenant);
      }
      if (filters.action) {
        params.set('action', filters.action);
      }
      if (filters.resourceType) {
        params.set('resourceType', filters.resourceType);
      }
      if (filters.from) {
        params.set('from', filters.from);
      }
      if (filters.to) {
        params.set('to', filters.to);
      }

      const response = await fetch(`/api/admin/audit/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load audit logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  if (!canReadAudit) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Access Denied
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            You do not have permission to view audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Audit Logs
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Monitor system activity and compliance events across all tenants
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tenant
            </label>
            <select 
              value={filters.tenant}
              onChange={(e) => setFilters(prev => ({ ...prev, tenant: e.target.value as typeof filters.tenant }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={adminUser.role === 'tenant_admin'}
            >
              {adminUser.role === 'superadmin' && <option value="ALL">All Tenants</option>}
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action
            </label>
            <select 
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="access">Access</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resource Type
            </label>
            <select 
              value={filters.resourceType}
              onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="template">Template</option>
              <option value="system">System</option>
              <option value="auth">Authentication</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <input 
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <input 
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => setFilters({ tenant: 'ALL', action: '', resourceType: '', from: '', to: '' })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Clear Filters
          </button>
          <button 
            onClick={loadAuditLogs}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <AuditLogsLoadingSkeleton />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <AuditLogRow key={log.id} log={log} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLogEntry }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const actionColor = {
    create: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
    update: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
    delete: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
    login: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
    logout: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    access: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
  };
  
  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
          <div>
            {new Date(log.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(log.createdAt).toLocaleTimeString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {log.userEmail}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {log.userId.slice(0, 8)}...
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            actionColor[log.action as keyof typeof actionColor] || 
            'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
          }`}>
            {log.action}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {log.resourceType}
          </div>
          {log.resourceId && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {log.resourceId.slice(0, 8)}...
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {log.tenantType && (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              log.tenantType === 'RESIDENTIAL'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
            }`}>
              {log.tenantType}
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
            <div className="space-y-2 text-sm">
              {log.correlationId && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Correlation ID:</span>
                  <span className="ml-2 font-mono text-gray-600 dark:text-gray-400">{log.correlationId}</span>
                </div>
              )}
              {log.ipAddress && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">IP Address:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{log.ipAddress}</span>
                </div>
              )}
              {log.userAgent && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">User Agent:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400 break-all">{log.userAgent}</span>
                </div>
              )}
              {log.details && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Additional Details:</span>
                  <pre className="ml-2 mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AuditLogsLoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="grid grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function generateCorrelationId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}