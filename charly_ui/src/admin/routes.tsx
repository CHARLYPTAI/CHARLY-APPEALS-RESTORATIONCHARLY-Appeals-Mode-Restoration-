import React, { Suspense } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminGuard } from './AdminGuard';

// Lazy load admin pages for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Tenants = React.lazy(() => import('./pages/Tenants').then(m => ({ default: m.Tenants })));
const Users = React.lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const RolePermissions = React.lazy(() => import('./pages/RolePermissions').then(m => ({ default: m.RolePermissions })));
const RulesTemplates = React.lazy(() => import('./pages/RulesTemplates').then(m => ({ default: m.RulesTemplates })));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

// Admin route definitions with permission requirements
export const adminRoutes = {
  '/admin': {
    component: Dashboard,
    permissions: ['admin:system:read'] as const,
    label: 'Dashboard'
  },
  '/admin/tenants': {
    component: Tenants,
    permissions: ['admin:tenants:read'] as const,
    label: 'Tenants'
  },
  '/admin/users': {
    component: Users,
    permissions: ['admin:users:read'] as const,
    label: 'Users'
  },
  '/admin/roles': {
    component: RolePermissions,
    permissions: ['admin:roles:read'] as const,
    label: 'Roles & Permissions'
  },
  '/admin/rules/templates': {
    component: RulesTemplates,
    permissions: ['admin:templates:read'] as const,
    label: 'Rules Templates'
  },
  '/admin/audit/logs': {
    component: AuditLogs,
    permissions: ['admin:audit:read'] as const,
    label: 'Audit Logs'
  },
  '/admin/settings': {
    component: Settings,
    permissions: ['admin:system:read'] as const,
    label: 'Settings'
  }
};

export type AdminRoute = keyof typeof adminRoutes;

interface AdminRouterProps {
  currentPath: string;
}

export function AdminRouter({ currentPath }: AdminRouterProps) {
  const route = adminRoutes[currentPath as AdminRoute];
  
  if (!route) {
    // Default to dashboard for unknown admin routes
    const DefaultComponent = adminRoutes['/admin'].component;
    return (
      <AdminGuard permissions={adminRoutes['/admin'].permissions}>
        <AdminLayout>
          <Suspense fallback={<AdminLoadingSpinner />}>
            <DefaultComponent />
          </Suspense>
        </AdminLayout>
      </AdminGuard>
    );
  }

  const Component = route.component;

  return (
    <AdminGuard permissions={route.permissions}>
      <AdminLayout>
        <Suspense fallback={<AdminLoadingSpinner />}>
          <Component />
        </Suspense>
      </AdminLayout>
    </AdminGuard>
  );
}

function AdminLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-sm font-medium">Loading admin panel...</span>
      </div>
    </div>
  );
}