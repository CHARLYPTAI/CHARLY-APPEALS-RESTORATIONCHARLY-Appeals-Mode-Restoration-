import React, { useState } from 'react';
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

interface CreateUserModalProps {
  onClose: () => void;
  onUserCreated: (user: UserInfo) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  tenantType: 'RESIDENTIAL' | 'COMMERCIAL';
  role: string;
  sendInvite: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  tenantType?: string;
  role?: string;
}

export function CreateUserModal({ onClose, onUserCreated, showToast }: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [form, setForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    tenantType: 'COMMERCIAL',
    role: '',
    sendInvite: true
  });
  
  const adminUser = useAdmin();
  const canWrite = hasPermission(adminUser, 'admin:users:write');
  
  const availableTenants = React.useMemo(() => {
    const tenants = [];
    
    if (adminUser.role === 'superadmin') {
      tenants.push(
        { value: 'RESIDENTIAL', label: 'Residential' },
        { value: 'COMMERCIAL', label: 'Commercial' }
      );
    } else if (adminUser.role === 'tenant_admin') {
      tenants.push({
        value: adminUser.tenant_type || 'COMMERCIAL',
        label: adminUser.tenant_type || 'Commercial'
      });
    }
    
    return tenants;
  }, [adminUser.role, adminUser.tenant_type]);
  
  const availableRoles = React.useMemo(() => {
    const roles = [
      { value: '', label: 'No Role (Basic User)' },
      { value: 'auditor', label: 'Auditor' },
      { value: 'tenant_admin', label: 'Tenant Admin' }
    ];
    
    if (adminUser.role === 'superadmin') {
      roles.push({ value: 'superadmin', label: 'Superadmin' });
    }
    
    return roles;
  }, [adminUser.role]);
  
  React.useEffect(() => {
    if (adminUser.role === 'tenant_admin' && adminUser.tenant_type) {
      setForm(prev => ({ ...prev, tenantType: adminUser.tenant_type as 'RESIDENTIAL' | 'COMMERCIAL' }));
    }
  }, [adminUser.role, adminUser.tenant_type]);
  
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!form.tenantType) {
      newErrors.tenantType = 'Tenant type is required';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canWrite) {
      showToast('You do not have permission to create users', 'error');
      return;
    }
    
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          tenantType: form.tenantType,
          role: form.role || undefined,
          sendInvite: form.sendInvite
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create user' }));
        
        if (response.status === 409) {
          setErrors({ email: 'A user with this email already exists' });
          return;
        }
        
        throw new Error(errorData.detail || 'Failed to create user');
      }
      
      const newUser = await response.json();
      
      const userInfo: UserInfo = {
        id: newUser.id,
        email: newUser.email,
        tenantType: newUser.tenantType,
        role: newUser.role,
        createdAt: new Date().toISOString(),
        isActive: newUser.isActive || true
      };
      
      onUserCreated(userInfo);
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (field: keyof CreateUserForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  if (!canWrite) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create New User
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="user@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.email}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.password}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="tenantType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tenant Type *
              </label>
              <select
                id="tenantType"
                value={form.tenantType}
                onChange={(e) => handleInputChange('tenantType', e.target.value)}
                disabled={adminUser.role === 'tenant_admin'}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 ${
                  errors.tenantType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {availableTenants.map((tenant) => (
                  <option key={tenant.value} value={tenant.value}>
                    {tenant.label}
                  </option>
                ))}
              </select>
              {errors.tenantType && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.tenantType}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Assignment
              </label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                {availableRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.sendInvite}
                  onChange={(e) => handleInputChange('sendInvite', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Send invitation email to user
                </span>
              </label>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function generateCorrelationId(): string {
  return `admin-create-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}