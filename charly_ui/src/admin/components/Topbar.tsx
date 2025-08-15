import React, { useState } from 'react';
import { TenantSwitcher } from './TenantSwitcher';
import { useAdmin } from '../AdminGuard';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const adminUser = useAdmin();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu button + Title */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 lg:hidden rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Page title area */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getPageTitle()}
              </h1>
              {/* Optional page status indicator */}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  System Operational
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Tenant Switcher + Actions + User Menu */}
          <div className="flex items-center gap-3">
            {/* Tenant Switcher - only show for superadmin or to display current tenant */}
            <TenantSwitcher />

            {/* Correlation ID indicator (development/debug) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                <span className="text-xs text-gray-500 dark:text-gray-400">ID:</span>
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {generateCorrelationId().slice(-8)}
                </span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative"
                aria-label="Notifications"
              >
                <BellIcon className="w-5 h-5" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  <span className="sr-only">2 notifications</span>
                </span>
              </button>

              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <NotificationItem
                      title="System Update Available"
                      message="A new security patch is ready for installation"
                      time="5 minutes ago"
                      type="info"
                    />
                    <NotificationItem
                      title="High Volume Alert"
                      message="Unusual activity detected in commercial tenant"
                      time="1 hour ago"
                      type="warning"
                    />
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {adminUser.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium truncate max-w-32">
                    {adminUser.email.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRole(adminUser.role)}
                  </div>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {adminUser.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {adminUser.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRole(adminUser.role)}
                        </p>
                        {adminUser.tenant_type && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                            {adminUser.tenant_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <UserMenuItem href="/admin/profile" icon={UserIcon}>
                      Profile Settings
                    </UserMenuItem>
                    <UserMenuItem href="/admin/security" icon={ShieldCheckIcon}>
                      Security
                    </UserMenuItem>
                    <UserMenuItem href="/admin/activity" icon={ClockIcon}>
                      Activity Log
                    </UserMenuItem>
                    <UserMenuItem href="/admin/help" icon={QuestionMarkCircleIcon}>
                      Help & Support
                    </UserMenuItem>
                  </div>
                  
                  <div className="py-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Helper components
interface UserMenuItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function UserMenuItem({ href, icon: Icon, children }: UserMenuItemProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
    >
      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      {children}
    </a>
  );
}

interface NotificationItemProps {
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

function NotificationItem({ title, message, time, type }: NotificationItemProps) {
  const typeColors = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400'
  };

  return (
    <div className="p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${typeColors[type]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {time}
          </p>
        </div>
      </div>
    </div>
  );
}

// Utility functions
function getPageTitle(): string {
  const path = window.location.pathname;
  const titleMap: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/tenants': 'Tenants',
    '/admin/users': 'Users',
    '/admin/rules/templates': 'Rules Templates',
    '/admin/audit/logs': 'Audit Logs',
    '/admin/settings': 'Settings'
  };
  
  return titleMap[path] || 'Admin Panel';
}

function formatRole(role: string): string {
  return role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function generateCorrelationId(): string {
  return `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function handleSignOut() {
  try {
    // Clear auth tokens
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Call logout endpoint
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Sign out error:', error);
    // Still redirect even if API call fails
    window.location.href = '/login';
  }
}

// Icon components
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QuestionMarkCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  );
}

function ArrowRightOnRectangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}