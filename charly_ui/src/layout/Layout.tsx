import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Scale,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';

const Layout = () => {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Portfolio', href: '/portfolio', icon: FolderOpen },
    { name: 'Appeals', href: '/appeals', icon: Scale },
    { name: 'Filing', href: '/filing', icon: FileText },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Skip to content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded">
        Skip to content
      </a>

      {/* Sidebar */}
      <nav className="flex flex-col w-60 bg-gray-900" aria-label="Main navigation">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-white">CHARLY</h1>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1" aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-5 w-5"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;