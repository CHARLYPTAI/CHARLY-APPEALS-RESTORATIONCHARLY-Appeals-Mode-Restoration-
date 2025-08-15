import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuditLogs } from '../pages/AuditLogs';
import { AuditFilters } from '../components/audit/AuditFilters';
import { AuditTable } from '../components/audit/AuditTable';
import { AuditDetail } from '../components/audit/AuditDetail';
import { CorrelationBanner } from '../components/audit/CorrelationBanner';
import type { AdminUser } from '../AdminGuard';

// Mock AdminGuard context
const mockAdminUser: AdminUser = {
  id: 'test-admin-id',
  email: 'admin@test.com',
  role: 'superadmin',
  tenant_type: 'COMMERCIAL',
  permissions: ['admin:audit:read', 'admin:users:read', 'admin:users:write']
};

const mockTenantAdmin: AdminUser = {
  id: 'test-tenant-admin-id',
  email: 'tenant@test.com',
  role: 'tenant_admin',
  tenant_type: 'RESIDENTIAL',
  permissions: ['admin:audit:read', 'admin:users:read']
};

const mockAuditor: AdminUser = {
  id: 'test-auditor-id',
  email: 'auditor@test.com',
  role: 'auditor',
  permissions: ['admin:audit:read', 'admin:users:read']
};

// Mock the AdminGuard module
vi.mock('../AdminGuard', () => ({
  useAdmin: vi.fn(),
  hasPermission: vi.fn(),
  AdminGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock fetch
global.fetch = vi.fn();

const mockFetch = global.fetch as any;

describe('Admin Audit Log System', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Default admin context
    const { useAdmin, hasPermission } = require('../AdminGuard');
    useAdmin.mockReturnValue(mockAdminUser);
    hasPermission.mockImplementation((user: AdminUser, permission: string) => 
      user.permissions.includes(permission)
    );

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock URL and location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/admin/audit',
        hash: '',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RBAC Access Control', () => {
    it('should allow superadmin full access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      render(<AuditLogs />);

      expect(screen.getByText('Audit Log Explorer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Tenants')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should restrict tenant_admin to their tenant only', async () => {
      const { useAdmin } = require('../AdminGuard');
      useAdmin.mockReturnValue(mockTenantAdmin);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      render(<AuditLogs />);

      // Should not see "All Tenants" option
      expect(screen.queryByDisplayValue('All Tenants')).not.toBeInTheDocument();
      // Should default to their tenant
      expect(screen.getByDisplayValue('RESIDENTIAL')).toBeInTheDocument();
      // Should be disabled
      expect(screen.getByDisplayValue('RESIDENTIAL')).toBeDisabled();
    });

    it('should deny access to users without audit:read permission', () => {
      const { hasPermission } = require('../AdminGuard');
      hasPermission.mockReturnValue(false);

      render(<AuditLogs />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to view audit logs')).toBeInTheDocument();
    });

    it('should allow auditor read-only access', async () => {
      const { useAdmin } = require('../AdminGuard');
      useAdmin.mockReturnValue(mockAuditor);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      render(<AuditLogs />);

      expect(screen.getByText('Audit Log Explorer')).toBeInTheDocument();
      // Auditor should still see export (same permission as read)
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    const mockLogs = [
      {
        id: '1',
        userId: 'user1',
        userEmail: 'user1@test.com',
        action: 'CREATE',
        resourceType: 'user',
        tenantType: 'COMMERCIAL',
        createdAt: '2024-01-01T10:00:00.000Z',
        correlationId: 'corr-123'
      }
    ];

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ logs: mockLogs, total: 1, limit: 25, offset: 0 })
      });
    });

    it('should filter by tenant type', async () => {
      render(<AuditLogs />);

      const tenantSelect = screen.getByDisplayValue('All Tenants');
      fireEvent.change(tenantSelect, { target: { value: 'RESIDENTIAL' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('tenant=RESIDENTIAL'),
          expect.any(Object)
        );
      });
    });

    it('should filter by action type', async () => {
      render(<AuditLogs />);

      const actionSelect = screen.getByDisplayValue('All Actions');
      fireEvent.change(actionSelect, { target: { value: 'CREATE' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('action=CREATE'),
          expect.any(Object)
        );
      });
    });

    it('should filter by status', async () => {
      render(<AuditLogs />);

      const statusSelect = screen.getByDisplayValue('All Status');
      fireEvent.change(statusSelect, { target: { value: 'SUCCESS' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=SUCCESS'),
          expect.any(Object)
        );
      });
    });

    it('should filter by actor email/ID', async () => {
      render(<AuditLogs />);

      // Expand advanced filters
      fireEvent.click(screen.getByText('Advanced'));

      const actorInput = screen.getByPlaceholderText('user@example.com or user ID');
      fireEvent.change(actorInput, { target: { value: 'test@user.com' } });

      // Trigger apply filters
      fireEvent.click(screen.getByText('Apply Filters'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('actor=test%40user.com'),
          expect.any(Object)
        );
      });
    });

    it('should filter by correlation ID', async () => {
      render(<AuditLogs />);

      // Expand advanced filters
      fireEvent.click(screen.getByText('Advanced'));

      const correlationInput = screen.getByPlaceholderText('correlation-id-123');
      fireEvent.change(correlationInput, { target: { value: 'corr-456' } });

      fireEvent.click(screen.getByText('Apply Filters'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('correlationId=corr-456'),
          expect.any(Object)
        );
      });
    });

    it('should clear all filters', async () => {
      render(<AuditLogs />);

      // Set some filters first
      const actionSelect = screen.getByDisplayValue('All Actions');
      fireEvent.change(actionSelect, { target: { value: 'CREATE' } });

      // Clear filters
      fireEvent.click(screen.getByText('Clear Filters'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Correlation ID Deep-linking', () => {
    it('should handle correlation ID from URL hash', async () => {
      // Mock window.location.hash
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/admin/audit#cid=test-correlation-123',
          hash: '#cid=test-correlation-123',
        },
        writable: true,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      render(<AuditLogs />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('correlationId=test-correlation-123'),
          expect.any(Object)
        );
      });
    });

    it('should show correlation banner when filtering by correlation ID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ logs: [], total: 5, limit: 25, offset: 0 })
      });

      render(<AuditLogs />);

      // Simulate clicking "Trace" button (would set correlation filter)
      // This would be triggered by the AuditTable component
      // For this test, we'll simulate the state change directly
      
      // Mock the correlation filter being set
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/admin/audit#cid=corr-123',
          hash: '#cid=corr-123',
        },
        writable: true,
      });

      // Re-render to trigger the hash change effect
      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText('Correlation Trace Active')).toBeInTheDocument();
        expect(screen.getByText('5 events')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination and Sorting', () => {
    const mockManyLogs = Array.from({ length: 3 }, (_, i) => ({
      id: `log-${i}`,
      userId: `user-${i}`,
      userEmail: `user${i}@test.com`,
      action: 'CREATE',
      resourceType: 'user',
      tenantType: 'COMMERCIAL',
      createdAt: new Date(Date.now() - i * 1000).toISOString()
    }));

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ logs: mockManyLogs, total: 100, limit: 25, offset: 0 })
      });
    });

    it('should handle page size changes', async () => {
      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('25')).toBeInTheDocument();
      });

      const pageSizeSelect = screen.getByDisplayValue('25');
      fireEvent.change(pageSizeSelect, { target: { value: '50' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=50'),
          expect.any(Object)
        );
      });
    });

    it('should handle page navigation', async () => {
      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('offset=25'),
          expect.any(Object)
        );
      });
    });

    it('should handle sorting by timestamp', async () => {
      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Timestamp'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('sort=createdAt%3Aasc'),
          expect.any(Object)
        );
      });
    });
  });

  describe('CSV Export', () => {
    it('should export CSV with current filters', async () => {
      // Mock the blob and URL creation
      const mockBlob = new Blob(['test csv content'], { type: 'text/csv' });
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      // Export request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Export CSV'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/audit/logs/export'),
          expect.any(Object)
        );
        expect(mockAnchor.click).toHaveBeenCalled();
      });
    });

    it('should handle export errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      // Export request fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Export CSV'));

      await waitFor(() => {
        expect(screen.getByText('Export failed: HTTP 500')).toBeInTheDocument();
      });
    });
  });

  describe('PII Redaction in Detail View', () => {
    const mockLogWithDetails = {
      id: 'log-1',
      userId: 'user-1',
      userEmail: 'user@example.com',
      action: 'CREATE',
      resourceType: 'user',
      details: {
        email: 'sensitive@user.com',
        password: 'secret123',
        token: 'abc123def456ghi789',
        normalField: 'normal data'
      },
      ipAddress: '192.168.1.100',
      correlationId: 'corr-123',
      createdAt: '2024-01-01T10:00:00.000Z'
    };

    it('should redact PII in details panel', () => {
      render(<AuditDetail log={mockLogWithDetails} onCorrelationFilter={vi.fn()} />);

      // Should show redacted email
      expect(screen.getByText('se...ve@example.com')).toBeInTheDocument();
      
      // Should show redacted password
      expect(screen.getByText('[REDACTED]')).toBeInTheDocument();
      
      // Should show redacted token
      expect(screen.getByText(/abc123de...i789/)).toBeInTheDocument();
      
      // Should show normal field unchanged
      expect(screen.getByText('normal data')).toBeInTheDocument();
    });

    it('should anonymize IP addresses', () => {
      render(<AuditDetail log={mockLogWithDetails} onCorrelationFilter={vi.fn()} />);

      expect(screen.getByText('192.168.1.xxx')).toBeInTheDocument();
    });

    it('should show retention notice', () => {
      render(<AuditDetail log={mockLogWithDetails} onCorrelationFilter={vi.fn()} />);

      expect(screen.getByText('Data Retention & Privacy Notice')).toBeInTheDocument();
      expect(screen.getByText(/Audit logs are retained for 180 days/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' })
      });

      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Audit Logs')).toBeInTheDocument();
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Audit Logs')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should retry failed requests', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      render(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.queryByText('Error Loading Audit Logs')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should show loading skeleton during initial load', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AuditLogs />);

      // Loading skeleton should be visible
      expect(screen.getByText('Audit Log Explorer')).toBeInTheDocument();
      // No data should be shown yet
      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });

    it('should have proper ARIA labels and roles', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      render(<AuditLogs />);

      await waitFor(() => {
        // Table should have proper structure
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /timestamp/i })).toBeInTheDocument();
        
        // Buttons should be accessible
        expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ logs: [], total: 0, limit: 25, offset: 0 })
      });

      render(<AuditLogs />);

      await waitFor(() => {
        const applyButton = screen.getByRole('button', { name: /apply filters/i });
        expect(applyButton).toBeInTheDocument();
        
        // Should be focusable
        applyButton.focus();
        expect(document.activeElement).toBe(applyButton);
      });
    });
  });
});