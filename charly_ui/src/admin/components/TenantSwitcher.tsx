import React, { useState, useEffect } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';

interface TenantInfo {
  type: 'RESIDENTIAL' | 'COMMERCIAL';
  userCount: number;
  activeUsers: number;
  createdAt: string;
}

export function TenantSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [currentTenant, setCurrentTenant] = useState<'RESIDENTIAL' | 'COMMERCIAL' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const adminUser = useAdmin();

  // Determine if user can switch tenants (only superadmin)
  const canSwitchTenants = adminUser.role === 'superadmin';
  
  // For tenant_admin, show their fixed tenant; for auditor, show current context
  const displayTenant = adminUser.tenant_type || currentTenant;

  useEffect(() => {
    // Initialize current tenant context
    if (adminUser.tenant_type) {
      setCurrentTenant(adminUser.tenant_type);
    } else if (adminUser.role === 'superadmin') {
      // Default to COMMERCIAL for superadmin if no specific context
      setCurrentTenant('COMMERCIAL');
    }

    // Load available tenants if user can switch
    if (canSwitchTenants) {
      loadTenants();
    }
  }, [adminUser, canSwitchTenants]);

  async function loadTenants() {
    if (!hasPermission(adminUser, 'admin:tenants:read')) {
      return;
    }

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
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleTenantSwitch(newTenant: 'RESIDENTIAL' | 'COMMERCIAL') {
    if (!canSwitchTenants) return;
    
    setCurrentTenant(newTenant);
    setIsOpen(false);
    
    // Optionally reload the page to apply new tenant context
    // or update application state to reflect the change
    const url = new URL(window.location.href);
    url.searchParams.set('tenant', newTenant);
    window.history.pushState({}, '', url.toString());
    
    // Trigger a custom event that other components can listen to
    window.dispatchEvent(new CustomEvent('tenantChanged', { 
      detail: { tenant: newTenant } 
    }));
  }

  // Don't render anything if user has no tenant context and can't switch
  if (!displayTenant && !canSwitchTenants) {
    return null;
  }

  return (
    <div className="relative">
      {canSwitchTenants ? (
        // Dropdown for superadmin
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-700"
            aria-label="Switch tenant"
          >
            <BuildingIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {displayTenant || 'Select Tenant'}
            </span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Switch Tenant Context
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  View and manage different tenant environments
                </p>
              </div>

              <div className="py-2">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      <span className="text-sm">Loading tenants...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                ) : (
                  tenants.map((tenant) => (
                    <TenantOption
                      key={tenant.type}
                      tenant={tenant}
                      isActive={currentTenant === tenant.type}
                      onClick={() => handleTenantSwitch(tenant.type)}
                    />
                  ))
                )}
              </div>

              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Switching context will update your view to the selected tenant
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Read-only display for tenant_admin and auditor
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BuildingIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {displayTenant}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({adminUser.role === 'tenant_admin' ? 'Tenant Scope' : 'Current View'})
          </span>
        </div>
      )}
    </div>
  );
}

interface TenantOptionProps {
  tenant: TenantInfo;
  isActive: boolean;
  onClick: () => void;
}

function TenantOption({ tenant, isActive, onClick }: TenantOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200
        ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${tenant.type === 'RESIDENTIAL' 
            ? 'bg-green-100 dark:bg-green-900/20' 
            : 'bg-blue-100 dark:bg-blue-900/20'
          }
        `}>
          {tenant.type === 'RESIDENTIAL' ? (
            <HomeIcon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`} />
          ) : (
            <BuildingIcon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`} />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
              {tenant.type}
            </span>
            {isActive && (
              <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {tenant.userCount} users • {tenant.activeUsers} active
          </div>
        </div>
      </div>
    </button>
  );
}

// Utility function
function generateCorrelationId(): string {
  return `tenant-switch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Icon components
function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3zM9 9h1.5m-1.5 3h1.5m-1.5 3h1.5M13.5 9H15m-1.5 3H15m-1.5 3H15" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12L11.204 3.045c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}