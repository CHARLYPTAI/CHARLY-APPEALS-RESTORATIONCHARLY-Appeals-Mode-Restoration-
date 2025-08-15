import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { useAdmin } from './AdminGuard';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const adminUser = useAdmin();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col lg:pl-64">
        {/* Top bar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Page header space - can be used by pages for breadcrumbs */}
            <div className="mb-6">
              <AdminBreadcrumbs />
            </div>

            {/* Main content area with proper spacing and accessibility */}
            <div className="max-w-7xl mx-auto">
              <div 
                className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-800"
                role="main"
                aria-label="Admin panel content"
              >
                {children}
              </div>
            </div>
          </div>
        </main>

        {/* Footer with admin context info */}
        <AdminFooter />
      </div>
    </div>
  );
}

function AdminBreadcrumbs() {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/').filter(Boolean);
  
  // Generate breadcrumb trail
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = formatBreadcrumbLabel(segment);
    const isLast = index === pathSegments.length - 1;
    
    return { href, label, isLast };
  });

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for top-level admin page
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && (
              <svg 
                className="w-4 h-4 mx-2 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {crumb.isLast ? (
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {crumb.label}
              </span>
            ) : (
              <a 
                href={crumb.href}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
              >
                {crumb.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function AdminFooter() {
  const adminUser = useAdmin();
  
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>
            Admin Panel - {adminUser.role.charAt(0).toUpperCase() + adminUser.role.slice(1).replace('_', ' ')}
          </span>
          {adminUser.tenant_type && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
              {adminUser.tenant_type}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span>
            {adminUser.email}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Utility function to format breadcrumb labels
function formatBreadcrumbLabel(segment: string): string {
  const labelMap: Record<string, string> = {
    'admin': 'Admin',
    'tenants': 'Tenants',
    'users': 'Users',
    'rules': 'Rules',
    'templates': 'Templates',
    'audit': 'Audit',
    'logs': 'Logs',
    'settings': 'Settings'
  };
  
  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}