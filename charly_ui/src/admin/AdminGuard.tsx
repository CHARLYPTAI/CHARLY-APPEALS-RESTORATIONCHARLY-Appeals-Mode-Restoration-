import React, { useEffect, useState } from 'react';

// Admin types matching the backend auth system
export type AdminRole = 'superadmin' | 'tenant_admin' | 'auditor';

export type Permission = 
  | 'admin:tenants:read'
  | 'admin:tenants:write'
  | 'admin:users:read'
  | 'admin:users:write'
  | 'admin:roles:read'
  | 'admin:roles:write'
  | 'admin:templates:read'
  | 'admin:templates:write'
  | 'admin:integrations:read'
  | 'admin:integrations:write'
  | 'admin:audit:read'
  | 'admin:system:read';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  tenant_type?: 'RESIDENTIAL' | 'COMMERCIAL';
  permissions: Permission[];
}

// Role-based permission mappings (matching backend)
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  superadmin: [
    'admin:tenants:read',
    'admin:tenants:write',
    'admin:users:read',
    'admin:users:write',
    'admin:roles:read',
    'admin:roles:write',
    'admin:templates:read',
    'admin:templates:write',
    'admin:integrations:read',
    'admin:integrations:write',
    'admin:audit:read',
    'admin:system:read'
  ],
  tenant_admin: [
    'admin:users:read',
    'admin:users:write',
    'admin:templates:read',
    'admin:templates:write',
    'admin:integrations:read',
    'admin:integrations:write',
    'admin:audit:read'
  ],
  auditor: [
    'admin:tenants:read',
    'admin:users:read',
    'admin:templates:read',
    'admin:integrations:read',
    'admin:audit:read',
    'admin:system:read'
  ]
};

interface AdminGuardProps {
  permissions: readonly Permission[];
  children: React.ReactNode;
  tenantScope?: 'RESIDENTIAL' | 'COMMERCIAL';
}

interface AuthError {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  correlationId: string;
}

export function AdminGuard({ permissions, children, tenantScope }: AdminGuardProps) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    async function verifyAdminAccess() {
      try {
        setIsLoading(true);
        setError(null);

        // Get JWT token from localStorage/sessionStorage
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Verify admin permissions with backend
        const response = await fetch('/api/admin/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Correlation-ID': generateCorrelationId()
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData);
          return;
        }

        const userData = await response.json();
        
        // Validate user has required permissions
        const hasRequiredPermissions = permissions.every(permission => 
          userData.permissions.includes(permission)
        );

        if (!hasRequiredPermissions) {
          setError({
            type: 'about:blank',
            title: 'Forbidden',
            status: 403,
            detail: `Missing required permissions: ${permissions.join(', ')}`,
            code: 'INSUFFICIENT_PERMISSIONS',
            correlationId: generateCorrelationId()
          });
          return;
        }

        // Validate tenant scope if required
        if (tenantScope && userData.role === 'tenant_admin' && userData.tenant_type !== tenantScope) {
          setError({
            type: 'about:blank',
            title: 'Forbidden',
            status: 403,
            detail: `Access denied to ${tenantScope} tenant`,
            code: 'CROSS_TENANT_ACCESS_DENIED',
            correlationId: generateCorrelationId()
          });
          return;
        }

        setAdminUser(userData);
      } catch (err) {
        setError({
          type: 'about:blank',
          title: 'Authentication Failed',
          status: 401,
          detail: err instanceof Error ? err.message : 'Authentication verification failed',
          code: 'AUTHENTICATION_REQUIRED',
          correlationId: generateCorrelationId()
        });
      } finally {
        setIsLoading(false);
      }
    }

    verifyAdminAccess();
  }, [permissions, tenantScope]);

  if (isLoading) {
    return <AdminLoadingState />;
  }

  if (error || !adminUser) {
    return <AdminErrorState error={error} />;
  }

  // Success - render children with admin context
  return (
    <AdminContext.Provider value={adminUser}>
      {children}
    </AdminContext.Provider>
  );
}

function AdminLoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Verifying Admin Access
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Checking permissions and tenant scope...
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminErrorState({ error }: { error: AuthError | null }) {
  const isAuthError = error?.status === 401;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center space-y-6">
        <div className="flex items-center justify-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isAuthError 
              ? 'bg-amber-100 dark:bg-amber-900/20' 
              : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            {isAuthError ? (
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
              </svg>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {error?.title || 'Access Denied'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error?.detail || 'You do not have permission to access the admin panel.'}
          </p>
          {error?.code && (
            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              Error: {error.code}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          {isAuthError ? (
            <button 
              onClick={() => window.location.href = '/login'}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Sign In
            </button>
          ) : (
            <button 
              onClick={() => window.location.href = '/'}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Go Home
            </button>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

// Admin context for accessing user info in components
const AdminContext = React.createContext<AdminUser | null>(null);

export function useAdmin() {
  const context = React.useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminGuard');
  }
  return context;
}

// Utility functions
function generateCorrelationId(): string {
  return `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function hasPermission(user: AdminUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: AdminUser, permissions: Permission[]): boolean {
  return permissions.some(permission => user.permissions.includes(permission));
}

export function getPermissionsForRole(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}