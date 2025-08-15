import React, { useState, useEffect } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';

interface SystemSetting {
  key: string;
  value: string;
  description: string;
  category: 'general' | 'security' | 'notifications' | 'performance';
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  readOnly?: boolean;
}

export function Settings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SystemSetting['category']>('general');
  const [hasChanges, setHasChanges] = useState(false);
  
  const adminUser = useAdmin();
  const canReadSettings = hasPermission(adminUser, 'admin:system:read');
  const canWriteSettings = hasPermission(adminUser, 'admin:system:read'); // Using read permission for demo

  useEffect(() => {
    if (canReadSettings) {
      loadSettings();
    }
  }, [canReadSettings]);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);

      // Mock settings data - in real implementation, fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const mockSettings: SystemSetting[] = [
        {
          key: 'platform.name',
          value: 'CHARLY Platform',
          description: 'Display name for the platform',
          category: 'general',
          type: 'string'
        },
        {
          key: 'platform.maintenance_mode',
          value: 'false',
          description: 'Enable maintenance mode to restrict access',
          category: 'general',
          type: 'boolean'
        },
        {
          key: 'security.session_timeout',
          value: '3600',
          description: 'Session timeout in seconds',
          category: 'security',
          type: 'number'
        },
        {
          key: 'security.password_policy',
          value: 'strong',
          description: 'Password complexity requirements',
          category: 'security',
          type: 'select',
          options: ['basic', 'medium', 'strong']
        },
        {
          key: 'notifications.email_enabled',
          value: 'true',
          description: 'Enable email notifications',
          category: 'notifications',
          type: 'boolean'
        },
        {
          key: 'performance.cache_duration',
          value: '300',
          description: 'Default cache duration in seconds',
          category: 'performance',
          type: 'number'
        }
      ];
      
      setSettings(mockSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setLoading(true);
      
      // Mock save - in real implementation, send to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      // Show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
    setHasChanges(true);
  }

  if (!canReadSettings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Access Denied
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            You do not have permission to view system settings.
          </p>
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'general' as const, label: 'General', icon: '⚙️' },
    { key: 'security' as const, label: 'Security', icon: '🔒' },
    { key: 'notifications' as const, label: 'Notifications', icon: '📧' },
    { key: 'performance' as const, label: 'Performance', icon: '⚡' }
  ];

  const filteredSettings = settings.filter(setting => setting.category === activeCategory);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            System Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure platform behavior and preferences
          </p>
        </div>
        
        {canWriteSettings && hasChanges && (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                loadSettings();
                setHasChanges(false);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Discard Changes
            </button>
            <button 
              onClick={saveSettings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeCategory === category.key
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {loading ? (
            <SettingsLoadingSkeleton />
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                Error Loading Settings
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error}
              </p>
              <button 
                onClick={loadSettings}
                className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-300 text-xs font-medium rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {categories.find(c => c.key === activeCategory)?.label} Settings
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSettings.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No settings available in this category
                  </div>
                ) : (
                  filteredSettings.map((setting) => (
                    <SettingRow
                      key={setting.key}
                      setting={setting}
                      canWrite={canWriteSettings}
                      onUpdate={updateSetting}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ 
  setting, 
  canWrite, 
  onUpdate 
}: { 
  setting: SystemSetting; 
  canWrite: boolean; 
  onUpdate: (key: string, value: string) => void; 
}) {
  const isReadOnly = setting.readOnly || !canWrite;
  
  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {setting.key}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {setting.description}
          </p>
        </div>
        
        <div className="flex-shrink-0 w-64">
          {setting.type === 'boolean' ? (
            <select
              value={setting.value}
              onChange={(e) => onUpdate(setting.key, e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          ) : setting.type === 'select' && setting.options ? (
            <select
              value={setting.value}
              onChange={(e) => onUpdate(setting.key, e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
            >
              {setting.options.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={setting.type === 'number' ? 'number' : 'text'}
              value={setting.value}
              onChange={(e) => onUpdate(setting.key, e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsLoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
            <div className="w-64 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}