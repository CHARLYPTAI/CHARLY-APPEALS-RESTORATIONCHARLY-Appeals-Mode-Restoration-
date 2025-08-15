import React, { useState, useEffect } from 'react';
import { PermissionMatrix } from './PermissionMatrix';
import type { Role, Permission } from '../../pages/RolePermissions';

interface RoleEditorProps {
  role: Role | null;
  permissions: Permission[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: Partial<Role>) => Promise<void>;
}

export function RoleEditor({ role, permissions, isOpen, onClose, onSave }: RoleEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'global' | 'tenant'>('tenant');
  const [tenantType, setTenantType] = useState<'RESIDENTIAL' | 'COMMERCIAL'>('COMMERCIAL');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [changeNotes, setChangeNotes] = useState('');
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when role changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (role) {
        setName(role.name);
        setDescription(role.description);
        setScope(role.scope);
        setTenantType(role.tenantType || 'COMMERCIAL');
        setSelectedPermissions([...role.permissions]);
      } else {
        setName('');
        setDescription('');
        setScope('tenant');
        setTenantType('COMMERCIAL');
        setSelectedPermissions([]);
      }
      setChangeNotes('');
      setErrors({});
    }
  }, [role, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (name.length < 3) {
      newErrors.name = 'Role name must be at least 3 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Role description is required';
    }

    if (selectedPermissions.length === 0) {
      newErrors.permissions = 'At least one permission must be selected';
    }

    if (!role && !changeNotes.trim()) {
      newErrors.changeNotes = 'Change notes are required for new roles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const roleData: Partial<Role> = {
        name: name.trim(),
        description: description.trim(),
        scope,
        permissions: selectedPermissions,
        ...(scope === 'tenant' && { tenantType }),
        ...(changeNotes.trim() && { changeNotes: changeNotes.trim() })
      };

      await onSave(roleData);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to save role' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionPreview = () => {
    const categories = permissions.reduce((acc, permission) => {
      if (selectedPermissions.includes(permission.id)) {
        if (!acc[permission.category]) {
          acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
      }
      return acc;
    }, {} as Record<string, Permission[]>);

    return Object.entries(categories);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {role ? 'Edit Role' : 'Create New Role'}
              </h2>
              {role && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Version {role.version} • Last modified by {role.lastEditor}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{errors.general}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., Property Manager"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Describe what this role is for and its responsibilities..."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>}
                </div>

                <div>
                  <label htmlFor="scope" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Scope *
                  </label>
                  <select
                    id="scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value as 'global' | 'tenant')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tenant">Tenant-Scoped</option>
                    <option value="global">Global</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {scope === 'global' 
                      ? 'Global roles can access all tenants and system-wide features'
                      : 'Tenant-scoped roles are limited to a specific tenant type'
                    }
                  </p>
                </div>

                {scope === 'tenant' && (
                  <div>
                    <label htmlFor="tenantType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tenant Type *
                    </label>
                    <select
                      id="tenantType"
                      value={tenantType}
                      onChange={(e) => setTenantType(e.target.value as 'RESIDENTIAL' | 'COMMERCIAL')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="RESIDENTIAL">Residential</option>
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="changeNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Change Notes {!role && '*'}
                  </label>
                  <textarea
                    id="changeNotes"
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.changeNotes ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Describe the changes being made..."
                  />
                  {errors.changeNotes && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.changeNotes}</p>}
                </div>
              </div>

              {/* Permission Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Permission Summary</h3>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    What this role can access:
                  </h4>
                  
                  {selectedPermissions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No permissions selected yet. Use the permission matrix below to assign permissions.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {getPermissionPreview().map(([category, categoryPermissions]) => (
                        <div key={category}>
                          <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                            {category.replace('_', ' ')}
                          </h5>
                          <ul className="space-y-1">
                            {categoryPermissions.map((permission) => (
                              <li key={permission.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {permission.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Permission Matrix */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Permissions</h3>
              <PermissionMatrix
                permissions={permissions}
                selectedPermissions={selectedPermissions}
                onPermissionChange={setSelectedPermissions}
                roleScope={scope}
                tenantType={scope === 'tenant' ? tenantType : undefined}
              />
              {errors.permissions && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.permissions}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}