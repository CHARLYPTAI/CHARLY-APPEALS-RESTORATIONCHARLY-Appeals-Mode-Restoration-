import React, { useMemo } from 'react';
import type { Permission } from '../../pages/RolePermissions';

interface PermissionMatrixProps {
  permissions: Permission[];
  selectedPermissions: string[];
  onPermissionChange: (permissions: string[]) => void;
  roleScope: 'global' | 'tenant';
  tenantType?: 'RESIDENTIAL' | 'COMMERCIAL';
}

interface PermissionGroup {
  category: string;
  permissions: Permission[];
  description: string;
}

export function PermissionMatrix({ 
  permissions, 
  selectedPermissions, 
  onPermissionChange, 
  roleScope, 
  tenantType 
}: PermissionMatrixProps) {
  
  // Group permissions by category and filter based on role scope
  const permissionGroups = useMemo(() => {
    const filtered = permissions.filter(permission => {
      // System permissions are only available for global roles
      if (permission.isSystem && roleScope !== 'global') {
        return false;
      }
      
      // Tenant-specific filtering could be added here if needed
      return true;
    });

    const groups = filtered.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    // Define category descriptions and order
    const categoryInfo: Record<string, { description: string; order: number }> = {
      'admin_system': { 
        description: 'System-wide administration and configuration', 
        order: 1 
      },
      'admin_users': { 
        description: 'User management and role assignments', 
        order: 2 
      },
      'admin_tenants': { 
        description: 'Tenant management and configuration', 
        order: 3 
      },
      'admin_templates': { 
        description: 'Rule template management', 
        order: 4 
      },
      'admin_audit': { 
        description: 'Audit log access and monitoring', 
        order: 5 
      },
      'property_read': { 
        description: 'Property data viewing and searching', 
        order: 6 
      },
      'property_write': { 
        description: 'Property data creation and modification', 
        order: 7 
      },
      'appeals_read': { 
        description: 'Appeal case viewing and tracking', 
        order: 8 
      },
      'appeals_write': { 
        description: 'Appeal case creation and management', 
        order: 9 
      },
      'reports_read': { 
        description: 'Report viewing and export', 
        order: 10 
      },
      'reports_write': { 
        description: 'Report creation and configuration', 
        order: 11 
      },
      'integration': { 
        description: 'External system integrations', 
        order: 12 
      }
    };

    return Object.entries(groups)
      .map(([category, categoryPermissions]) => ({
        category,
        permissions: categoryPermissions.sort((a, b) => a.name.localeCompare(b.name)),
        description: categoryInfo[category]?.description || 'Other permissions',
        order: categoryInfo[category]?.order || 999
      }))
      .sort((a, b) => a.order - b.order);
  }, [permissions, roleScope]);

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    onPermissionChange(newSelected);
  };

  const handleGroupToggle = (groupPermissions: Permission[], allSelected: boolean) => {
    const groupIds = groupPermissions.map(p => p.id);
    
    if (allSelected) {
      // Remove all permissions in this group
      onPermissionChange(selectedPermissions.filter(id => !groupIds.includes(id)));
    } else {
      // Add all permissions in this group
      const newSelected = [...selectedPermissions];
      groupIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      onPermissionChange(newSelected);
    }
  };

  const handleSelectAll = () => {
    const allAvailableIds = permissionGroups.flatMap(group => group.permissions.map(p => p.id));
    const allSelected = allAvailableIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      onPermissionChange([]);
    } else {
      onPermissionChange(allAvailableIds);
    }
  };

  const getGroupStatus = (groupPermissions: Permission[]) => {
    const groupIds = groupPermissions.map(p => p.id);
    const selectedInGroup = groupIds.filter(id => selectedPermissions.includes(id));
    
    if (selectedInGroup.length === 0) return 'none';
    if (selectedInGroup.length === groupIds.length) return 'all';
    return 'partial';
  };

  const allAvailablePermissions = permissionGroups.flatMap(group => group.permissions);
  const allSelectedInAvailable = allAvailablePermissions.every(p => selectedPermissions.includes(p.id));
  const someSelectedInAvailable = allAvailablePermissions.some(p => selectedPermissions.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Header with select all */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Permission Matrix</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {roleScope === 'global' 
              ? 'Global scope: Can access all system features and tenants'
              : `Tenant scope: Limited to ${tenantType} tenant features`
            }
          </p>
        </div>
        
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
            allSelectedInAvailable 
              ? 'bg-blue-600 border-blue-600' 
              : someSelectedInAvailable 
              ? 'bg-blue-100 dark:bg-blue-900 border-blue-600' 
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {allSelectedInAvailable && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {someSelectedInAvailable && !allSelectedInAvailable && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </div>
          {allSelectedInAvailable ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Permission Groups */}
      <div className="space-y-4">
        {permissionGroups.map((group) => {
          const groupStatus = getGroupStatus(group.permissions);
          
          return (
            <div key={group.category} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              {/* Group Header */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleGroupToggle(group.permissions, groupStatus === 'all')}
                      className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-600 p-1 rounded transition-colors"
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        groupStatus === 'all' 
                          ? 'bg-blue-600 border-blue-600' 
                          : groupStatus === 'partial' 
                          ? 'bg-blue-100 dark:bg-blue-900 border-blue-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {groupStatus === 'all' && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {groupStatus === 'partial' && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    </button>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {group.category.replace('_', ' ')}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{group.description}</p>
                    </div>
                  </div>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {group.permissions.filter(p => selectedPermissions.includes(p.id)).length} / {group.permissions.length} selected
                  </span>
                </div>
              </div>

              {/* Group Permissions */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.permissions.map((permission) => {
                    const isSelected = selectedPermissions.includes(permission.id);
                    
                    return (
                      <label
                        key={permission.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="mt-0.5 w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {permission.description}
                          </div>
                          {permission.isSystem && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 mt-1">
                              System
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">
            {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        {selectedPermissions.length > 0 && (
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Users with this role will have access to the selected permissions within the {roleScope} scope.
          </p>
        )}
      </div>
    </div>
  );
}