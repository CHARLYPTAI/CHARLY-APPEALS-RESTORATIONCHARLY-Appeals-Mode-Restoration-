import React, { useState, useEffect } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';

interface TenantInfo {
  type: 'RESIDENTIAL' | 'COMMERCIAL';
  userCount: number;
  activeUsers: number;
  createdAt: string;
}

export function Tenants() {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const adminUser = useAdmin();
  const canManageTenants = hasPermission(adminUser, 'admin:tenants:write');

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch('/api/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load tenants');
      }

      const data = await response.json();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }

  if (!hasPermission(adminUser, 'admin:tenants:read')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Access Denied
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            You do not have permission to view tenant information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Tenant Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage residential and commercial tenant environments
          </p>
        </div>
        
        {canManageTenants && (
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
            Configure Tenants
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <TenantsLoadingSkeleton />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Error Loading Tenants
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            {error}
          </p>
          <button 
            onClick={loadTenants}
            className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-300 text-xs font-medium rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tenants.map((tenant) => (
            <TenantCard key={tenant.type} tenant={tenant} canManage={canManageTenants} />
          ))}
        </div>
      )}
    </div>
  );
}

function TenantCard({ tenant, canManage }: { tenant: TenantInfo; canManage: boolean }) {
  const isResidential = tenant.type === 'RESIDENTIAL';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isResidential 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : 'bg-blue-100 dark:bg-blue-900/20'
          }`}>
            {isResidential ? (
              <HomeIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <BuildingIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {tenant.type}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isResidential ? 'Residential Properties' : 'Commercial Properties'}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          tenant.activeUsers > 0 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {tenant.activeUsers > 0 ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {tenant.userCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Total Users
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {tenant.activeUsers}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Active Today
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
        Created: {new Date(tenant.createdAt).toLocaleDateString()}
      </div>

      {canManage && (
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            View Details
          </button>
          <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
            Manage
          </button>
        </div>
      )}
    </div>
  );
}

function TenantsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

function generateCorrelationId(): string {
  return `tenants-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Icon components
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12L11.204 3.045c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3zM9 9h1.5m-1.5 3h1.5m-1.5 3h1.5M13.5 9H15m-1.5 3H15m-1.5 3H15" />
    </svg>
  );
}