import React, { useState, useEffect } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';

interface RuleTemplate {
  id: string;
  name: string;
  version: string;
  tenantType: 'RESIDENTIAL' | 'COMMERCIAL';
  description?: string;
  templateData: any;
  schemaVersion: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export function RulesTemplates() {
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'ALL'>('ALL');
  
  const adminUser = useAdmin();
  const canWriteTemplates = hasPermission(adminUser, 'admin:templates:write');
  const canReadTemplates = hasPermission(adminUser, 'admin:templates:read');

  useEffect(() => {
    if (canReadTemplates) {
      loadTemplates();
    }
  }, [selectedTenant, canReadTemplates]);

  async function loadTemplates() {
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

      const response = await fetch(`/api/admin/rules/templates?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': generateCorrelationId()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  if (!canReadTemplates) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Access Denied
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            You do not have permission to view rule templates.
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
            Rules Templates
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage jurisdiction-specific rules and validation templates
          </p>
        </div>
        
        {canWriteTemplates && (
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              Import Templates
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
              Create Template
            </button>
          </div>
        )}
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Tenant
          </label>
          <select 
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value as typeof selectedTenant)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={adminUser.role === 'tenant_admin'}
          >
            {adminUser.role === 'superadmin' && <option value="ALL">All Tenants</option>}
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </div>
        
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TemplateStatCard 
              label="Total Templates" 
              value={templates.length} 
              icon="📄"
            />
            <TemplateStatCard 
              label="Active Templates" 
              value={templates.filter(t => t.isActive).length} 
              icon="✅"
            />
            <TemplateStatCard 
              label="Schema Versions" 
              value={new Set(templates.map(t => t.schemaVersion)).size} 
              icon="🔢"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TemplatesLoadingSkeleton />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Error Loading Templates
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            {error}
          </p>
          <button 
            onClick={loadTemplates}
            className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-300 text-xs font-medium rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="lg:col-span-2 xl:col-span-3 text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Templates Found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedTenant === 'ALL' 
                  ? 'No rule templates have been created yet.' 
                  : `No templates found for ${selectedTenant} tenant.`
                }
              </p>
              {canWriteTemplates && (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                  Create First Template
                </button>
              )}
            </div>
          ) : (
            templates.map((template) => (
              <TemplateCard key={template.id} template={template} canWrite={canWriteTemplates} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TemplateStatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {value}
          </p>
        </div>
        <div className="text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, canWrite }: { template: RuleTemplate; canWrite: boolean }) {
  const isResidential = template.tenantType === 'RESIDENTIAL';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isResidential 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : 'bg-blue-100 dark:bg-blue-900/20'
          }`}>
            <DocumentIcon className={`w-5 h-5 ${
              isResidential 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-blue-600 dark:text-blue-400'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              v{template.version} • {template.tenantType}
            </p>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          template.isActive 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {template.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      {template.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div>
          <span className="text-gray-500 dark:text-gray-500">Schema:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {template.schemaVersion}
          </div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-500">Created:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {new Date(template.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
        Created by: {template.createdBy}
      </div>

      {canWrite ? (
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            View
          </button>
          <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
            Edit
          </button>
        </div>
      ) : (
        <button className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
          View Details
        </button>
      )}
    </div>
  );
}

function TemplatesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

function generateCorrelationId(): string {
  return `templates-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Icon component
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}