import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';
import { UserDetailDrawer } from '../components/UserDetailDrawer';
import { CreateUserModal } from '../components/CreateUserModal';
import { ErrorToast, SuccessToast } from '../components/Toast';

interface UserInfo {
  id: string;
  email: string;
  tenantType: 'RESIDENTIAL' | 'COMMERCIAL';
  role?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  roleAssignments?: RoleAssignment[];
}

interface RoleAssignment {
  id: string;
  role: 'superadmin' | 'tenant_admin' | 'auditor';
  tenantType?: 'RESIDENTIAL' | 'COMMERCIAL';
  assignedBy: string;
  assignedAt: string;
  revokedAt?: string;
}

interface UsersListResponse {
  users: UserInfo[];
  total: number;
  limit: number;
  offset: number;
}

interface SortConfig {
  field: keyof UserInfo;
  direction: 'asc' | 'desc';
}

interface UsersTableFilters {
  search: string;
  tenant: 'RESIDENTIAL' | 'COMMERCIAL' | 'ALL';
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ALL';
}

export function Users() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState<UsersTableFilters>({
    search: '',
    tenant: 'ALL',
    role: 'ALL',
    status: 'ALL'
  });
  
  // Modal/drawer states
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  
  // Toast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const adminUser = useAdmin();
  const canWriteUsers = hasPermission(adminUser, 'admin:users:write');
  const canReadUsers = hasPermission(adminUser, 'admin:users:read');

  // Memoized filter values for tenant admin restriction
  const effectiveFilters = useMemo(() => {
    const effective = { ...filters };
    
    // Tenant admin can only see their own tenant
    if (adminUser.role === 'tenant_admin') {
      effective.tenant = adminUser.tenant_type || 'COMMERCIAL';
    }
    
    return effective;
  }, [filters, adminUser.role, adminUser.tenant_type]);

  useEffect(() => {
    if (canReadUsers) {
      loadUsers();
    }
  }, [currentPage, pageSize, sortConfig, effectiveFilters, canReadUsers]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!canReadUsers) return;
    
    const interval = setInterval(() => {
      loadUsers(true); // Silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, [canReadUsers]);

  const loadUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const offset = (currentPage - 1) * pageSize;
      
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
        sort: `${sortConfig.field}:${sortConfig.direction}`
      });
      
      // Apply filters
      if (effectiveFilters.tenant !== 'ALL') {
        params.set('tenant', effectiveFilters.tenant);
      }
      
      if (effectiveFilters.search.trim()) {
        params.set('search', effectiveFilters.search.trim());
      }
      
      if (effectiveFilters.role !== 'ALL') {
        params.set('role', effectiveFilters.role);
      }
      
      if (effectiveFilters.status !== 'ALL') {
        params.set('status', effectiveFilters.status.toLowerCase());
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to load users' }));
        throw new Error(errorData.detail || 'Failed to load users');
      }

      const data: UsersListResponse = await response.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      if (!silent) {
        showToast('Failed to load users', 'error');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, sortConfig, effectiveFilters]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const handleSort = useCallback((field: keyof UserInfo) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page on sort
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<UsersTableFilters>) => {
    setFilters(current => ({ ...current, ...newFilters }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handleUserSelect = useCallback((user: UserInfo) => {
    setSelectedUser(user);
    setShowDetailDrawer(true);
  }, []);

  const handleUserUpdate = useCallback((updatedUser: UserInfo) => {
    setUsers(current => 
      current.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
    showToast(`User ${updatedUser.email} updated successfully`, 'success');
  }, [showToast]);

  const handleUserCreate = useCallback((newUser: UserInfo) => {
    setUsers(current => [newUser, ...current]);
    setTotal(current => current + 1);
    showToast(`User ${newUser.email} created successfully`, 'success');
  }, [showToast]);

  const totalPages = Math.ceil(total / pageSize);

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
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Total: {total} users</span>
            <span>•</span>
            <span>Page {currentPage} of {totalPages}</span>
            {filters.search && (
              <>
                <span>•</span>
                <span>Filtered by: "{filters.search}"</span>
              </>
            )}
          </div>
        </div>
        
        {canWriteUsers && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-label="Create new user"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create User
          </button>
        )}
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Users
            </label>
            <div className="relative">
              <input
                id="user-search"
                type="text"
                placeholder="Search by email or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Tenant Filter */}
          <div className="w-full lg:w-48">
            <label htmlFor="tenant-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tenant
            </label>
            <select 
              id="tenant-filter"
              value={effectiveFilters.tenant}
              onChange={(e) => handleFilterChange({ tenant: e.target.value as UsersTableFilters['tenant'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={adminUser.role === 'tenant_admin'}
            >
              {adminUser.role === 'superadmin' && <option value="ALL">All Tenants</option>}
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>
          
          {/* Role Filter */}
          <div className="w-full lg:w-48">
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select 
              id="role-filter"
              value={filters.role}
              onChange={(e) => handleFilterChange({ role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="tenant_admin">Tenant Admin</option>
              <option value="auditor">Auditor</option>
              <option value="none">No Role</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select 
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value as UsersTableFilters['status'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        
        {/* Clear filters button */}
        {(filters.search || filters.role !== 'ALL' || filters.status !== 'ALL' || (adminUser.role === 'superadmin' && filters.tenant !== 'ALL')) && (
          <div className="flex justify-end">
            <button
              onClick={() => setFilters({
                search: '',
                tenant: adminUser.role === 'tenant_admin' ? (adminUser.tenant_type || 'COMMERCIAL') : 'ALL',
                role: 'ALL',
                status: 'ALL'
              })}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <UsersLoadingSkeleton />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
              Error Loading Users
            </h3>
          </div>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            {error}
          </p>
          <button 
            onClick={() => loadUsers()}
            className="mt-3 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-300 text-xs font-medium rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <svg className="w-3 h-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <UsersTableHeader 
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  canWrite={canWriteUsers}
                />
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={canWriteUsers ? 6 : 5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {filters.search || filters.role !== 'ALL' || filters.status !== 'ALL' 
                              ? 'No users match your current filters'
                              : 'No users found'
                            }
                          </div>
                          {(filters.search || filters.role !== 'ALL' || filters.status !== 'ALL') && (
                            <button
                              onClick={() => setFilters({
                                search: '',
                                tenant: effectiveFilters.tenant,
                                role: 'ALL',
                                status: 'ALL'
                              })}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <UserRow 
                        key={user.id} 
                        user={user} 
                        canWrite={canWriteUsers}
                        onSelect={() => handleUserSelect(user)}
                        onUpdate={handleUserUpdate}
                        showToast={showToast}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {total > pageSize && (
            <UsersPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}
      
      {/* Modals and Drawers */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreate}
          showToast={showToast}
        />
      )}
      
      {showDetailDrawer && selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          onClose={() => {
            setShowDetailDrawer(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdate}
          showToast={showToast}
        />
      )}
      
      {/* Toast Notifications */}
      {toastMessage && (
        toastType === 'success' ? (
          <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
        ) : (
          <ErrorToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
        )
      )}
    </div>
  );
}

// Sortable table header component
function UsersTableHeader({ 
  sortConfig, 
  onSort, 
  canWrite 
}: { 
  sortConfig: SortConfig;
  onSort: (field: keyof UserInfo) => void;
  canWrite: boolean;
}) {
  const SortButton = ({ field, children }: { field: keyof UserInfo; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      aria-label={`Sort by ${field}`}
    >
      {children}
      <div className="flex flex-col">
        <svg 
          className={`w-3 h-3 ${
            sortConfig.field === field && sortConfig.direction === 'asc' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-300'
          }`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <svg 
          className={`w-3 h-3 -mt-1 ${
            sortConfig.field === field && sortConfig.direction === 'desc' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-300'
          }`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </button>
  );
  
  return (
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <SortButton field="email">User</SortButton>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <SortButton field="tenantType">Tenant</SortButton>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <SortButton field="role">Role</SortButton>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <SortButton field="isActive">Status</SortButton>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <SortButton field="lastLogin">Last Login</SortButton>
        </th>
        {canWrite && (
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Actions
          </th>
        )}
      </tr>
    </thead>
  );
}

// Enhanced user row component
function UserRow({ 
  user, 
  canWrite, 
  onSelect, 
  onUpdate, 
  showToast 
}: { 
  user: UserInfo;
  canWrite: boolean;
  onSelect: () => void;
  onUpdate: (user: UserInfo) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleQuickToggle = async (action: 'activate' | 'deactivate') => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        },
        body: JSON.stringify({
          isActive: action === 'activate'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to update user' }));
        throw new Error(errorData.detail);
      }
      
      const updatedUser = { ...user, isActive: action === 'activate' };
      onUpdate(updatedUser);
      showToast(`User ${action === 'activate' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update user', 'error');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
      <td className="px-6 py-4 whitespace-nowrap">
        <button 
          onClick={onSelect}
          className="flex items-center text-left w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={`View details for ${user.email}`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user.email}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {user.id.slice(0, 8)}...
            </div>
          </div>
        </button>
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
        {user.role ? (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {user.role.replace('_', ' ')}
          </span>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400 italic">No Role</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          user.isActive
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${
            user.isActive ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {user.lastLogin ? (
          <div>
            <div>{new Date(user.lastLogin).toLocaleDateString()}</div>
            <div className="text-xs text-gray-400">
              {new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ) : (
          <span className="italic">Never</span>
        )}
      </td>
      {canWrite && (
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={onSelect}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium px-2 py-1 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Edit ${user.email}`}
            >
              Edit
            </button>
            {user.isActive ? (
              <button 
                onClick={() => handleQuickToggle('deactivate')}
                disabled={isUpdating}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium px-2 py-1 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                aria-label={`Deactivate ${user.email}`}
              >
                {isUpdating ? '...' : 'Deactivate'}
              </button>
            ) : (
              <button 
                onClick={() => handleQuickToggle('activate')}
                disabled={isUpdating}
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium px-2 py-1 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                aria-label={`Activate ${user.email}`}
              >
                {isUpdating ? '...' : 'Activate'}
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

// Pagination component
function UsersPagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);
  
  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results info */}
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </div>
        
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-gray-700 dark:text-gray-300">
            Show:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Previous page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`dots-${index}`} className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1 text-sm rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Next page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced loading skeleton
function UsersLoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table header skeleton */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
        </div>
      </div>
      
      {/* Table rows skeleton */}
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-14"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function generateCorrelationId(): string {
  return `admin-users-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}