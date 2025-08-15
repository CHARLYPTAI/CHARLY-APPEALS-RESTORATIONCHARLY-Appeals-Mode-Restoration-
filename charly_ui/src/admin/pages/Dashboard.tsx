import React, { useState, useEffect } from 'react';
import { useAdmin, hasPermission } from '../AdminGuard';

interface SystemMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const adminUser = useAdmin();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      setMetrics([
        { label: 'Total Users', value: '2,847', change: '+12%', trend: 'up' },
        { label: 'Active Sessions', value: '156', change: '+3%', trend: 'up' },
        { label: 'API Requests/min', value: '1,234', change: '-2%', trend: 'down' },
        { label: 'System Health', value: '99.9%', change: '+0.1%', trend: 'stable' }
      ]);

      setAlerts([
        {
          id: '1',
          type: 'warning',
          title: 'High Memory Usage',
          message: 'Memory usage is at 85% on server cluster-2',
          timestamp: '5 minutes ago'
        },
        {
          id: '2',
          type: 'info',
          title: 'Scheduled Maintenance',
          message: 'Database maintenance scheduled for tonight at 2 AM EST',
          timestamp: '1 hour ago'
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          System overview and administrative controls for CHARLY platform
        </p>
      </div>

      {/* Role-specific welcome message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {adminUser.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Welcome, {formatRole(adminUser.role)}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {getRoleDescription(adminUser.role)}
              {adminUser.tenant_type && ` (${adminUser.tenant_type} tenant)`}
            </p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* System Alerts */}
        <div>
          <SystemAlerts alerts={alerts} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}

function MetricCard({ metric }: { metric: SystemMetric }) {
  const trendColor = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {metric.label}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {metric.value}
          </p>
        </div>
        {metric.change && (
          <span className={`text-sm font-medium ${trendColor[metric.trend || 'stable']}`}>
            {metric.change}
          </span>
        )}
      </div>
    </div>
  );
}

function RecentActivity() {
  const activities = [
    { action: 'User created', target: 'john.doe@company.com', time: '2 minutes ago', type: 'create' },
    { action: 'Role updated', target: 'Admin permissions', time: '15 minutes ago', type: 'update' },
    { action: 'Template imported', target: 'TX-Commercial-2024', time: '1 hour ago', type: 'import' },
    { action: 'Audit log accessed', target: 'System events', time: '2 hours ago', type: 'view' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Activity
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity, index) => (
          <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ActivityIcon type={activity.type} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.target}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemAlerts({ alerts }: { alerts: AlertItem[] }) {
  const alertStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          System Alerts
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No active alerts
          </p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-3 rounded-lg border ${alertStyles[alert.type]}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {alert.title}
                  </p>
                  <p className="text-sm opacity-90 mt-1">
                    {alert.message}
                  </p>
                </div>
              </div>
              <p className="text-xs opacity-75 mt-2">
                {alert.timestamp}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuickActions() {
  const adminUser = useAdmin();
  
  const actions = [
    {
      label: 'Create User',
      description: 'Add new user to the system',
      href: '/admin/users',
      permission: 'admin:users:write' as const,
      icon: '👤'
    },
    {
      label: 'View Audit Logs',
      description: 'Browse system activity logs',
      href: '/admin/audit/logs',
      permission: 'admin:audit:read' as const,
      icon: '📋'
    },
    {
      label: 'Manage Templates',
      description: 'Import and configure rule templates',
      href: '/admin/rules/templates',
      permission: 'admin:templates:write' as const,
      icon: '📄'
    },
    {
      label: 'System Settings',
      description: 'Configure platform settings',
      href: '/admin/settings',
      permission: 'admin:system:read' as const,
      icon: '⚙️'
    }
  ];

  const visibleActions = actions.filter(action => 
    hasPermission(adminUser, action.permission)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleActions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {action.label}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {action.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconMap = {
    create: '➕',
    update: '✏️',
    delete: '🗑️',
    import: '📥',
    export: '📤',
    view: '👁️'
  };

  return (
    <span className="text-lg">
      {iconMap[type as keyof typeof iconMap] || '📄'}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

// Utility functions
function formatRole(role: string): string {
  return role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function getRoleDescription(role: string): string {
  const descriptions = {
    superadmin: 'Full system access across all tenants and administrative functions',
    tenant_admin: 'Administrative access within your tenant scope',
    auditor: 'Read-only access to audit logs and system monitoring'
  };
  
  return descriptions[role as keyof typeof descriptions] || 'Administrative access to CHARLY platform';
}