import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Users } from '../pages/Users';

// Mock the admin context
const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'superadmin' as const,
  tenant_type: 'COMMERCIAL' as const,
  permissions: [
    'admin:users:read',
    'admin:users:write',
    'admin:tenants:read',
    'admin:tenants:write'
  ] as const
};

const mockUsers = [
  {
    id: 'user-1',
    email: 'user1@example.com',
    tenantType: 'COMMERCIAL' as const,
    role: 'tenant_admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T10:30:00Z',
    isActive: true
  }
];

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => 'mock-token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
});

// Mock the AdminGuard context
vi.mock('../AdminGuard', () => ({
  useAdmin: () => mockAdminUser,
  hasPermission: (user: any, permission: string) => user.permissions.includes(permission),
  AdminGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('Admin Users Console', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful API response
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/admin/users?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            users: mockUsers,
            total: mockUsers.length,
            limit: 20,
            offset: 0
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  describe('Basic Functionality', () => {
    it('should render users table', async () => {
      render(<Users />);
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('should show create button for users with write permissions', async () => {
      render(<Users />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new user/i })).toBeInTheDocument();
      });
    });

    it('should load users from API', async () => {
      render(<Users />);
      
      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should call API with search parameter', async () => {
      render(<Users />);
      
      await waitFor(() => {
        const searchInput = screen.getByLabelText(/search users/i);
        fireEvent.change(searchInput, { target: { value: 'user1' } });
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=user1'),
          expect.any(Object)
        );
      });
    });

    it('should call API with role filter', async () => {
      render(<Users />);
      
      await waitFor(() => {
        const roleFilter = screen.getByLabelText(/^role$/i);
        fireEvent.change(roleFilter, { target: { value: 'tenant_admin' } });
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('role=tenant_admin'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      render(<Users />);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      render(<Users />);
      
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      render(<Users />);
      
      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent('User Management');
      });
    });

    it('should have proper labels on form elements', async () => {
      render(<Users />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/search users/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tenant/i)).toBeInTheDocument();
      });
    });
  });
});