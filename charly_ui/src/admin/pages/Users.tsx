import React, { useState, useEffect } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';

interface UserInfo {
  id: string;
  email: string;
  tenantType: 'RESIDENTIAL' | 'COMMERCIAL';
  role?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export function Users() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'ALL'>('ALL');
  
  const adminUser = useAdmin();
  const canWriteUsers = hasPermission(adminUser, 'admin:users:write');
  const canReadUsers = hasPermission(adminUser, 'admin:users:read');

  useEffect(() => {
    if (canReadUsers) {
      loadUsers();
    }
  }, [selectedTenant, canReadUsers]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const params = new URLSearchParams({
        limit: '50',
        offset: '0'
      });
      
      if (selectedTenant !== 'ALL') {
        params.set('tenant', selectedTenant);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  if (!canReadUsers) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Access Denied
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            You do not have permission to view user information.
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
            User Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts, roles, and permissions across tenants
          </p>
        </div>
        
        {canWriteUsers && (
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
            Create User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by Tenant:
        </label>
        <select 
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value as typeof selectedTenant)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={adminUser.role === 'tenant_admin'}
        >
          {adminUser.role === 'superadmin' && <option value="ALL">All Tenants</option>}
          <option value="RESIDENTIAL">Residential</option>
          <option value="COMMERCIAL">Commercial</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <UsersLoadingSkeleton />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Error Loading Users
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            {error}
          </p>
          <button 
            onClick={loadUsers}
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
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  {canWriteUsers && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={canWriteUsers ? 6 : 5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <UserRow key={user.id} user={user} canWrite={canWriteUsers} />
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

function UserRow({ user, canWrite }: { user: UserInfo; canWrite: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user.email}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ID: {user.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          user.tenantType === 'RESIDENTIAL'
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
        }`}>
          {user.tenantType}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {user.role || 'No Role'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          user.isActive
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        }`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
      </td>
      {canWrite && (
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2">
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">
              Edit
            </button>
            <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">
              Disable
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

function UsersLoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function generateCorrelationId(): string {
  return `users-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}