import React, { useState, useEffect } from 'react';
import { RoleList } from '../components/roles/RoleList';
import { RoleEditor } from '../components/roles/RoleEditor';
import { ImportExportControls } from '../components/roles/ImportExportControls';

export interface Role {
  id: string;
  name: string;
  description: string;
  scope: 'global' | 'tenant';
  permissions: string[];
  version: number;
  lastEditor: string;
  lastModified: string;
  tenantType?: 'RESIDENTIAL' | 'COMMERCIAL';
}

export interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
  isSystem: boolean;
}

export function RolePermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles and permissions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [rolesResponse, permissionsResponse] = await Promise.all([
          fetch('/api/admin/roles', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/admin/permissions', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (!rolesResponse.ok || !permissionsResponse.ok) {
          throw new Error('Failed to fetch roles or permissions');
        }

        const rolesData = await rolesResponse.json();
        const permissionsData = await permissionsResponse.json();
        
        setRoles(rolesData.roles || []);
        setPermissions(permissionsData.permissions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsEditorOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setSelectedRole(null);
    setIsEditorOpen(false);
  };

  const handleSaveRole = async (roleData: Partial<Role>) => {
    try {
      const isUpdate = !!selectedRole;
      const url = isUpdate ? `/api/admin/roles/${selectedRole.id}` : '/api/admin/roles';
      const method = isUpdate ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save role');
      }

      const savedRole = await response.json();
      
      if (isUpdate) {
        setRoles(roles.map(r => r.id === savedRole.id ? savedRole : r));
      } else {
        setRoles([...roles, savedRole]);
      }
      
      handleCloseEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete role');
      }

      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const handleImportRoles = async (importData: { roles: Partial<Role>[], conflictResolution: 'rename' | 'overwrite' | 'skip' }) => {
    try {
      const response = await fetch('/api/admin/roles/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to import roles');
      }

      const result = await response.json();
      
      // Refresh roles list after import
      const rolesResponse = await fetch('/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import roles');
      throw err;
    }
  };

  const handleExportRoles = async (roleIds: string[]) => {
    try {
      const exportRoles = roles.filter(r => roleIds.includes(r.id));
      const dataStr = JSON.stringify({ roles: exportRoles }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roles-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export roles');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">Loading roles and permissions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <svg className="flex-shrink-0 w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Roles</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 text-sm bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage role definitions and permission assignments for the platform
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ImportExportControls
            roles={roles}
            onImport={handleImportRoles}
            onExport={handleExportRoles}
          />
          <button
            onClick={handleCreateRole}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Role
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        <RoleList
          roles={roles}
          onEditRole={handleEditRole}
          onDeleteRole={handleDeleteRole}
        />
      </div>

      {/* Role Editor Modal */}
      {isEditorOpen && (
        <RoleEditor
          role={selectedRole}
          permissions={permissions}
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
}