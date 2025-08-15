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

interface UserDetailDrawerProps {
  user: UserInfo;
  onClose: () => void;
  onUserUpdated: (user: UserInfo) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function UserDetailDrawer({ user, onClose, onUserUpdated, showToast }: UserDetailDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(user.role || '');
  const [isActive, setIsActive] = useState(user.isActive);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  
  const adminUser = useAdmin();
  const canWrite = hasPermission(adminUser, 'admin:users:write');
  
  // Determine available roles based on admin permissions
  const availableRoles = React.useMemo(() => {
    const roles = [
      { value: '', label: 'No Role' },
      { value: 'auditor', label: 'Auditor' },
      { value: 'tenant_admin', label: 'Tenant Admin' }
    ];
    
    // Only superadmin can assign superadmin role
    if (adminUser.role === 'superadmin') {
      roles.push({ value: 'superadmin', label: 'Superadmin' });
    }
    
    return roles;
  }, [adminUser.role]);
  
  useEffect(() => {
    loadUserDetails();
  }, [user.id]);
  
  const loadUserDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/users/${user.id}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoleAssignments(data.roleAssignments || []);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
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
          role: selectedRole || null,
          isActive
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to update user' }));
        throw new Error(errorData.detail);
      }
      
      const updatedUser = {
        ...user,
        role: selectedRole || undefined,
        isActive
      };
      
      onUserUpdated(updatedUser);
      showToast(`User ${user.email} updated successfully`, 'success');
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update user', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  const hasChanges = selectedRole !== (user.role || '') || isActive !== user.isActive;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="drawer-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-gray-900 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="drawer-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            User Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close drawer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {user.email}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    ID: {user.id}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tenant:</span>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.tenantType === 'RESIDENTIAL'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                    }`}>
                      {user.tenantType}
                    </span>
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <div className="mt-1 text-gray-900 dark:text-gray-100">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Last Login:</span>
                  <div className="mt-1 text-gray-900 dark:text-gray-100">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Current Status:</span>
                  <div className="mt-1">
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
                  </div>
                </div>
              </div>
            </div>
            
            {/* Role Assignments History */}
            {roleAssignments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Role Assignment History
                </h4>
                <div className="space-y-2">
                  {roleAssignments.map((assignment) => (
                    <div 
                      key={assignment.id}
                      className={`p-3 rounded-lg border ${
                        assignment.revokedAt 
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          assignment.revokedAt ? 'text-gray-600 dark:text-gray-400' : 'text-green-800 dark:text-green-300'
                        }`}>
                          {assignment.role.replace('_', ' ')}
                        </span>
                        <span className={`text-xs ${
                          assignment.revokedAt ? 'text-gray-500' : 'text-green-600 dark:text-green-400'
                        }`}>
                          {assignment.revokedAt ? 'Revoked' : 'Active'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                        {assignment.revokedAt && (
                          <> • Revoked: {new Date(assignment.revokedAt).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Edit Form */}
            {canWrite && (
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Edit User
                </h4>
                
                <div className="space-y-4">
                  {/* Role Assignment */}
                  <div>
                    <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role Assignment
                    </label>
                    <select
                      id="role-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={
                        // Tenant admin can only assign roles within their tenant
                        adminUser.role === 'tenant_admin' && user.tenantType !== adminUser.tenant_type
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      {availableRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {adminUser.role === 'tenant_admin' && user.tenantType !== adminUser.tenant_type && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Cannot modify users in different tenant
                      </p>
                    )}
                  </div>
                  
                  {/* Status Toggle */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        User is active
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        {canWrite && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function generateCorrelationId(): string {
  return `admin-user-detail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}