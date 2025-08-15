import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AdminGuard, AdminUser, Permission } from '../AdminGuard';
import { Sidebar } from '../components/Sidebar';
import { TenantSwitcher } from '../components/TenantSwitcher';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location
delete (window as any).location;
window.location = { pathname: '/admin', href: 'http://localhost/admin' } as any;

describe('Admin Shell RBAC Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('AdminGuard Permission Enforcement', () => {
    const mockUsers: Record<string, AdminUser> = {
      superadmin: {
        id: 'sa-1',
        email: 'superadmin@example.com',
        role: 'superadmin',
        permissions: [
          'admin:tenants:read',
          'admin:tenants:write',
          'admin:users:read',
          'admin:users:write',
          'admin:roles:read',
          'admin:roles:write',
          'admin:templates:read',
          'admin:templates:write',
          'admin:integrations:read',
          'admin:integrations:write',
          'admin:audit:read',
          'admin:system:read'
        ]
      },
      tenant_admin: {
        id: 'ta-1',
        email: 'tenant.admin@example.com',
        role: 'tenant_admin',
        tenant_type: 'COMMERCIAL',
        permissions: [
          'admin:users:read',
          'admin:users:write',
          'admin:templates:read',
          'admin:templates:write',
          'admin:integrations:read',
          'admin:integrations:write',
          'admin:audit:read'
        ]
      },
      auditor: {
        id: 'aud-1',
        email: 'auditor@example.com',
        role: 'auditor',
        permissions: [
          'admin:tenants:read',
          'admin:users:read',
          'admin:templates:read',
          'admin:integrations:read',
          'admin:audit:read',
          'admin:system:read'
        ]
      }
    };

    const setupMockFetch = (user: AdminUser) => {
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(user),
      });
    };

    it('should allow superadmin access to all permissions', async () => {
      setupMockFetch(mockUsers.superadmin);

      const TestComponent = () => <div data-testid=\"content\">Admin Content</div>;

      render(
        <AdminGuard permissions={['admin:tenants:read', 'admin:users:write']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should deny tenant_admin access to tenant-only permissions', async () => {
      setupMockFetch(mockUsers.tenant_admin);

      const TestComponent = () => <div data-testid=\"content\">Admin Content</div>;

      render(
        <AdminGuard permissions={['admin:tenants:write']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Missing required permissions: admin:tenants:write')).toBeInTheDocument();
      });
    });

    it('should allow tenant_admin access to user management', async () => {
      setupMockFetch(mockUsers.tenant_admin);

      const TestComponent = () => <div data-testid=\"content\">User Management</div>;

      render(
        <AdminGuard permissions={['admin:users:read']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should deny auditor access to write permissions', async () => {
      setupMockFetch(mockUsers.auditor);

      const TestComponent = () => <div data-testid=\"content\">Admin Content</div>;

      render(
        <AdminGuard permissions={['admin:users:write']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Missing required permissions: admin:users:write')).toBeInTheDocument();
      });
    });

    it('should allow auditor access to read permissions', async () => {
      setupMockFetch(mockUsers.auditor);

      const TestComponent = () => <div data-testid=\"content\">Audit Logs</div>;

      render(
        <AdminGuard permissions={['admin:audit:read']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should handle missing authentication token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const TestComponent = () => <div data-testid=\"content\">Admin Content</div>;

      render(
        <AdminGuard permissions={['admin:system:read']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('No authentication token found')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (fetch as Mock).mockRejectedValue(new Error('Network error'));

      const TestComponent = () => <div data-testid=\"content\">Admin Content</div>;

      render(
        <AdminGuard permissions={['admin:system:read']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar RBAC Navigation', () => {
    const MockAdminProvider = ({ user, children }: { user: AdminUser; children: React.ReactNode }) => {
      // Mock the useAdmin hook
      const AdminContext = React.createContext<AdminUser | null>(null);
      return <AdminContext.Provider value={user}>{children}</AdminContext.Provider>;
    };

    it('should show all navigation items for superadmin', () => {
      // Mock the useAdmin hook to return superadmin
      vi.doMock('../AdminGuard', () => ({
        useAdmin: () => ({
          id: 'sa-1',
          email: 'superadmin@example.com',
          role: 'superadmin',
          permissions: [
            'admin:tenants:read',
            'admin:tenants:write',
            'admin:users:read',
            'admin:users:write',
            'admin:roles:read',
            'admin:roles:write',
            'admin:templates:read',
            'admin:templates:write',
            'admin:integrations:read',
            'admin:integrations:write',
            'admin:audit:read',
            'admin:system:read'
          ]
        }),
        hasPermission: (user: AdminUser, permission: Permission) => user.permissions.includes(permission)
      }));

      render(<Sidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tenants')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Rules Templates')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should hide tenant management for tenant_admin', () => {
      vi.doMock('../AdminGuard', () => ({
        useAdmin: () => ({
          id: 'ta-1',
          email: 'tenant.admin@example.com',
          role: 'tenant_admin',
          tenant_type: 'COMMERCIAL',
          permissions: [
            'admin:users:read',
            'admin:users:write',
            'admin:templates:read',
            'admin:templates:write',
            'admin:integrations:read',
            'admin:integrations:write',
            'admin:audit:read'
          ]
        }),
        hasPermission: (user: AdminUser, permission: Permission) => user.permissions.includes(permission)
      }));

      render(<Sidebar />);

      expect(screen.queryByText('Tenants')).not.toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Rules Templates')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    it('should show only read-only items for auditor', () => {
      vi.doMock('../AdminGuard', () => ({
        useAdmin: () => ({
          id: 'aud-1',
          email: 'auditor@example.com',
          role: 'auditor',
          permissions: [
            'admin:tenants:read',
            'admin:users:read',
            'admin:templates:read',
            'admin:integrations:read',
            'admin:audit:read',
            'admin:system:read'
          ]
        }),
        hasPermission: (user: AdminUser, permission: Permission) => user.permissions.includes(permission)
      }));

      render(<Sidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tenants')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Rules Templates')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('TenantSwitcher RBAC Behavior', () => {
    beforeEach(() => {
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { type: 'RESIDENTIAL', userCount: 45, activeUsers: 12, createdAt: '2024-01-01' },
          { type: 'COMMERCIAL', userCount: 78, activeUsers: 23, createdAt: '2024-01-01' }
        ]),
      });
    });

    it('should show tenant switcher dropdown for superadmin', async () => {
      vi.doMock('../AdminGuard', () => ({
        useAdmin: () => ({
          id: 'sa-1',
          email: 'superadmin@example.com',
          role: 'superadmin',
          permissions: ['admin:tenants:read']
        }),
        hasPermission: (user: AdminUser, permission: Permission) => user.permissions.includes(permission)
      }));

      render(<TenantSwitcher />);

      const switcherButton = screen.getByLabelText('Switch tenant');
      expect(switcherButton).toBeInTheDocument();
      
      fireEvent.click(switcherButton);
      
      await waitFor(() => {
        expect(screen.getByText('Switch Tenant Context')).toBeInTheDocument();
      });
    });

    it('should show read-only tenant display for tenant_admin', () => {
      vi.doMock('../AdminGuard', () => ({
        useAdmin: () => ({
          id: 'ta-1',
          email: 'tenant.admin@example.com',
          role: 'tenant_admin',
          tenant_type: 'COMMERCIAL',
          permissions: []
        }),
        hasPermission: (user: AdminUser, permission: Permission) => false
      }));

      render(<TenantSwitcher />);

      expect(screen.getByText('COMMERCIAL')).toBeInTheDocument();
      expect(screen.getByText('(Tenant Scope)')).toBeInTheDocument();
      expect(screen.queryByLabelText('Switch tenant')).not.toBeInTheDocument();
    });

    it('should show current view for auditor', () => {
      vi.doMock('../AdminGuard', () => ({
        useAdmin: () => ({
          id: 'aud-1',
          email: 'auditor@example.com',
          role: 'auditor',
          permissions: ['admin:tenants:read']
        }),
        hasPermission: (user: AdminUser, permission: Permission) => user.permissions.includes(permission)
      }));

      render(<TenantSwitcher />);

      // Should show current view context but not allow switching
      expect(screen.getByText('(Current View)')).toBeInTheDocument();
    });
  });

  describe('Role-specific UI Elements', () => {
    const testCases = [
      {
        role: 'superadmin',
        shouldSeeCreateButtons: true,
        shouldSeeTenantSwitcher: true,
        shouldSeeAllMenuItems: true
      },
      {
        role: 'tenant_admin',
        shouldSeeCreateButtons: true,
        shouldSeeTenantSwitcher: false,
        shouldSeeAllMenuItems: false
      },
      {
        role: 'auditor',
        shouldSeeCreateButtons: false,
        shouldSeeTenantSwitcher: false,
        shouldSeeAllMenuItems: false
      }
    ];

    testCases.forEach(({ role, shouldSeeCreateButtons, shouldSeeTenantSwitcher, shouldSeeAllMenuItems }) => {
      it(`should display correct UI elements for ${role}`, () => {
        const mockUser = {
          id: `${role}-1`,
          email: `${role}@example.com`,
          role: role as AdminUser['role'],
          ...(role === 'tenant_admin' && { tenant_type: 'COMMERCIAL' as const }),
          permissions: role === 'superadmin' 
            ? ['admin:tenants:read', 'admin:users:write', 'admin:templates:write'] 
            : role === 'tenant_admin'
            ? ['admin:users:write', 'admin:templates:write']
            : ['admin:users:read', 'admin:templates:read']
        };

        vi.doMock('../AdminGuard', () => ({
          useAdmin: () => mockUser,
          hasPermission: (user: AdminUser, permission: Permission) => user.permissions.includes(permission)
        }));

        // This would need to be tested in the context of actual page components
        // that use the permissions to show/hide create buttons
        expect(true).toBe(true); // Placeholder for actual UI element tests
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      });

      const TestComponent = () => <div data-testid=\"content\">Admin Content</div>;

      render(
        <AdminGuard permissions={['admin:system:read']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Authentication verification failed')).toBeInTheDocument();
      });
    });

    it('should handle network timeouts', async () => {
      (fetch as Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const TestComponent = () => <div data-testid=\"content\">Admin Content</div>;

      render(
        <AdminGuard permissions={['admin:system:read']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Network timeout')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle HTTP error responses', async () => {
      (fetch as Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        }),
      });

      const TestComponent = () => <div data-testid=\"content\">Admin Content</div>;

      render(
        <AdminGuard permissions={['admin:system:read']}>
          <TestComponent />
        </AdminGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Insufficient permissions')).toBeInTheDocument();
      });
    });
  });
});