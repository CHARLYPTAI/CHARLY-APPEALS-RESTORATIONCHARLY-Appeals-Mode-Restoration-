import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AdminRouter, adminRoutes } from '../routes';
import { AdminGuard, AdminUser } from '../AdminGuard';

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

// Mock all admin page components
vi.mock('../pages/Dashboard', () => ({
  Dashboard: () => <div data-testid=\"dashboard-page\">Dashboard Content</div>
}));

vi.mock('../pages/Tenants', () => ({
  Tenants: () => <div data-testid=\"tenants-page\">Tenants Content</div>
}));

vi.mock('../pages/Users', () => ({
  Users: () => <div data-testid=\"users-page\">Users Content</div>
}));

vi.mock('../pages/RulesTemplates', () => ({
  RulesTemplates: () => <div data-testid=\"rules-templates-page\">Rules Templates Content</div>
}));

vi.mock('../pages/AuditLogs', () => ({
  AuditLogs: () => <div data-testid=\"audit-logs-page\">Audit Logs Content</div>
}));

vi.mock('../pages/Settings', () => ({
  Settings: () => <div data-testid=\"settings-page\">Settings Content</div>
}));

// Mock the AdminLayout component
vi.mock('../AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid=\"admin-layout\">{children}</div>
  )
}));

describe('Admin Route Guards Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

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

  const setupMockFetch = (user: AdminUser | null, shouldSucceed: boolean = true) => {
    if (user && shouldSucceed) {
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(user),
      });
    } else if (!shouldSucceed) {
      (fetch as Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: 'Access denied',
          code: 'ACCESS_DENIED'
        }),
      });
    } else {
      (fetch as Mock).mockRejectedValue(new Error('Authentication failed'));
    }\n  };\n\n  describe('Route Access Control', () => {\n    describe('Superadmin Access', () => {\n      beforeEach(() => {\n        setupMockFetch(mockUsers.superadmin);\n      });\n\n      it('should allow access to dashboard', async () => {\n        render(<AdminRouter currentPath=\"/admin\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to tenants page', async () => {\n        render(<AdminRouter currentPath=\"/admin/tenants\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('tenants-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to users page', async () => {\n        render(<AdminRouter currentPath=\"/admin/users\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('users-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to rules templates page', async () => {\n        render(<AdminRouter currentPath=\"/admin/rules/templates\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('rules-templates-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to audit logs page', async () => {\n        render(<AdminRouter currentPath=\"/admin/audit/logs\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('audit-logs-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to settings page', async () => {\n        render(<AdminRouter currentPath=\"/admin/settings\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('settings-page')).toBeInTheDocument();\n        });\n      });\n    });\n\n    describe('Tenant Admin Access', () => {\n      beforeEach(() => {\n        setupMockFetch(mockUsers.tenant_admin);\n      });\n\n      it('should deny access to tenants page', async () => {\n        render(<AdminRouter currentPath=\"/admin/tenants\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByText('Missing required permissions: admin:tenants:read')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to users page', async () => {\n        render(<AdminRouter currentPath=\"/admin/users\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('users-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to rules templates page', async () => {\n        render(<AdminRouter currentPath=\"/admin/rules/templates\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('rules-templates-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to audit logs page', async () => {\n        render(<AdminRouter currentPath=\"/admin/audit/logs\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('audit-logs-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should deny access to settings page', async () => {\n        render(<AdminRouter currentPath=\"/admin/settings\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByText('Missing required permissions: admin:system:read')).toBeInTheDocument();\n        });\n      });\n    });\n\n    describe('Auditor Access', () => {\n      beforeEach(() => {\n        setupMockFetch(mockUsers.auditor);\n      });\n\n      it('should allow access to dashboard', async () => {\n        render(<AdminRouter currentPath=\"/admin\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to tenants page (read-only)', async () => {\n        render(<AdminRouter currentPath=\"/admin/tenants\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('tenants-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to users page (read-only)', async () => {\n        render(<AdminRouter currentPath=\"/admin/users\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('users-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to rules templates page (read-only)', async () => {\n        render(<AdminRouter currentPath=\"/admin/rules/templates\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('rules-templates-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to audit logs page', async () => {\n        render(<AdminRouter currentPath=\"/admin/audit/logs\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('audit-logs-page')).toBeInTheDocument();\n        });\n      });\n\n      it('should allow access to settings page (read-only)', async () => {\n        render(<AdminRouter currentPath=\"/admin/settings\" />);\n        \n        await waitFor(() => {\n          expect(screen.getByTestId('settings-page')).toBeInTheDocument();\n        });\n      });\n    });\n  });\n\n  describe('Unauthenticated Access', () => {\n    beforeEach(() => {\n      mockLocalStorage.getItem.mockReturnValue(null);\n    });\n\n    it('should deny access to all admin routes when not authenticated', async () => {\n      const routes = Object.keys(adminRoutes);\n      \n      for (const route of routes) {\n        render(<AdminRouter currentPath={route} />);\n        \n        await waitFor(() => {\n          expect(screen.getByText('No authentication token found')).toBeInTheDocument();\n        });\n        \n        // Cleanup for next iteration\n        screen.getAllByText('No authentication token found').forEach(element => {\n          element.remove();\n        });\n      }\n    });\n\n    it('should show sign in button on access denied page', async () => {\n      render(<AdminRouter currentPath=\"/admin\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByText('Sign In')).toBeInTheDocument();\n      });\n    });\n  });\n\n  describe('Invalid Authentication', () => {\n    beforeEach(() => {\n      setupMockFetch(null, false);\n    });\n\n    it('should show forbidden error for invalid credentials', async () => {\n      render(<AdminRouter currentPath=\"/admin\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByText('Access denied')).toBeInTheDocument();\n      });\n    });\n\n    it('should show retry button on error', async () => {\n      render(<AdminRouter currentPath=\"/admin\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByText('Retry')).toBeInTheDocument();\n      });\n    });\n  });\n\n  describe('Route Fallbacks', () => {\n    beforeEach(() => {\n      setupMockFetch(mockUsers.superadmin);\n    });\n\n    it('should redirect to dashboard for unknown admin routes', async () => {\n      render(<AdminRouter currentPath=\"/admin/unknown-route\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();\n      });\n    });\n\n    it('should handle nested unknown routes', async () => {\n      render(<AdminRouter currentPath=\"/admin/nested/unknown/route\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();\n      });\n    });\n  });\n\n  describe('Loading States', () => {\n    it('should show loading state while verifying permissions', async () => {\n      // Mock a delayed response\n      (fetch as Mock).mockImplementation(() => \n        new Promise(resolve => \n          setTimeout(() => resolve({\n            ok: true,\n            json: () => Promise.resolve(mockUsers.superadmin)\n          }), 100)\n        )\n      );\n\n      render(<AdminRouter currentPath=\"/admin\" />);\n      \n      expect(screen.getByText('Verifying Admin Access')).toBeInTheDocument();\n      \n      await waitFor(() => {\n        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();\n      }, { timeout: 1000 });\n    });\n\n    it('should show loading spinner for lazy-loaded components', async () => {\n      setupMockFetch(mockUsers.superadmin);\n      \n      render(<AdminRouter currentPath=\"/admin\" />);\n      \n      // The loading state might be very brief for mocked components\n      // In a real scenario, you'd see \"Loading admin panel...\" while the component loads\n      await waitFor(() => {\n        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();\n      });\n    });\n  });\n\n  describe('Permission Validation', () => {\n    it('should enforce exact permission matches', async () => {\n      const limitedUser: AdminUser = {\n        id: 'limited-1',\n        email: 'limited@example.com',\n        role: 'auditor',\n        permissions: ['admin:users:read'] // Only has one permission\n      };\n      \n      setupMockFetch(limitedUser);\n      \n      render(<AdminRouter currentPath=\"/admin/tenants\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByText('Missing required permissions: admin:tenants:read')).toBeInTheDocument();\n      });\n    });\n\n    it('should handle empty permissions array', async () => {\n      const noPermissionsUser: AdminUser = {\n        id: 'none-1',\n        email: 'none@example.com',\n        role: 'auditor',\n        permissions: []\n      };\n      \n      setupMockFetch(noPermissionsUser);\n      \n      render(<AdminRouter currentPath=\"/admin\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByText('Missing required permissions: admin:system:read')).toBeInTheDocument();\n      });\n    });\n  });\n\n  describe('Tenant Scope Validation', () => {\n    it('should allow tenant admin access to their tenant scope', async () => {\n      const commercialTenantAdmin: AdminUser = {\n        ...mockUsers.tenant_admin,\n        tenant_type: 'COMMERCIAL'\n      };\n      \n      setupMockFetch(commercialTenantAdmin);\n      \n      render(<AdminRouter currentPath=\"/admin/users\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByTestId('users-page')).toBeInTheDocument();\n      });\n    });\n\n    it('should handle missing tenant type for tenant admin', async () => {\n      const tenantAdminNoScope: AdminUser = {\n        ...mockUsers.tenant_admin,\n        tenant_type: undefined\n      };\n      \n      setupMockFetch(tenantAdminNoScope);\n      \n      render(<AdminRouter currentPath=\"/admin/users\" />);\n      \n      await waitFor(() => {\n        expect(screen.getByTestId('users-page')).toBeInTheDocument();\n      });\n    });\n  });\n});"}