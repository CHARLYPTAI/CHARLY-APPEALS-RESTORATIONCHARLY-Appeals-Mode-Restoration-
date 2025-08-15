import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../main.js';

describe('Admin Audit API Endpoints', () => {
  let app: FastifyInstance;
  
  // Mock database client
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };

  const mockDb = {
    getClient: vi.fn(() => Promise.resolve(mockClient)),
    getTenantClient: vi.fn(() => Promise.resolve(mockClient)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock the database connection
    vi.doMock('../db/connection.js', () => ({
      db: mockDb
    }));

    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.resetAllMocks();
  });

  describe('GET /api/admin/audit/logs', () => {
    const mockSuperadmin = {
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'superadmin',
      permissions: ['admin:audit:read']
    };

    const mockTenantAdmin = {
      id: 'tenant-admin-1',
      email: 'tenant@test.com',
      role: 'tenant_admin',
      tenant_type: 'RESIDENTIAL',
      permissions: ['admin:audit:read']
    };

    const mockAuditor = {
      id: 'auditor-1',
      email: 'auditor@test.com',
      role: 'auditor',
      permissions: ['admin:audit:read']
    };

    const mockAuditLogs = [
      {
        id: 'log-1',
        user_id: 'user-1',
        user_email: 'user1@test.com',
        action: 'CREATE',
        resource_type: 'user',
        resource_id: 'res-1',
        tenant_type: 'COMMERCIAL',
        details: { field: 'value' },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        correlation_id: 'corr-123',
        status: 'SUCCESS',
        route: '/api/admin/users',
        method: 'POST',
        created_at: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 'log-2',
        user_id: 'user-2',
        user_email: 'user2@test.com',
        action: 'DELETE',
        resource_type: 'template',
        resource_id: 'res-2',
        tenant_type: 'RESIDENTIAL',
        details: null,
        ip_address: '192.168.1.101',
        user_agent: 'Chrome/91.0...',
        correlation_id: 'corr-456',
        status: 'DENIED',
        route: '/api/admin/templates',
        method: 'DELETE',
        created_at: new Date('2024-01-01T11:00:00Z')
      }
    ];

    it('should return audit logs for superadmin', async () => {
      // Mock authentication middleware
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      // Mock database queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockAuditLogs }); // Data query

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs',
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-Correlation-ID': 'test-corr-123'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data.logs).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.limit).toBe(50);
      expect(data.offset).toBe(0);
      
      expect(data.logs[0]).toMatchObject({
        id: 'log-1',
        userId: 'user-1',
        userEmail: 'user1@test.com',
        action: 'CREATE',
        resourceType: 'user',
        resourceId: 'res-1',
        tenantType: 'COMMERCIAL',
        status: 'SUCCESS',
        route: '/api/admin/users',
        method: 'POST'
      });
    });

    it('should filter logs by tenant for tenant_admin', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockTenantAdmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockAuditLogs[1]] }); // Only residential log

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].tenantType).toBe('RESIDENTIAL');
      
      // Verify tenant filtering was applied in query
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.tenant_type = $1'),
        expect.arrayContaining(['RESIDENTIAL'])
      );
    });

    it('should filter by action type', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockAuditLogs[0]] });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?action=CREATE',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.action = $'),
        expect.arrayContaining(['CREATE'])
      );
    });

    it('should filter by actor (email/ID)', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockAuditLogs[0]] });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?actor=user1@test.com',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('(u.email ILIKE $'),
        expect.arrayContaining(['%user1@test.com%'])
      );
    });

    it('should filter by correlation ID', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockAuditLogs[0]] });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?correlationId=corr-123',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.correlation_id = $'),
        expect.arrayContaining(['corr-123'])
      );
    });

    it('should filter by status', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockAuditLogs[1]] });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?status=DENIED',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.status = $'),
        expect.arrayContaining(['DENIED'])
      );
    });

    it('should filter by route prefix', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockAuditLogs[0]] });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?route=/api/admin/users',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.route ILIKE $'),
        expect.arrayContaining(['%/api/admin/users%'])
      );
    });

    it('should filter by date range', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockAuditLogs[0]] });

      const fromDate = '2024-01-01T09:00:00Z';
      const toDate = '2024-01-01T12:00:00Z';

      const response = await app.inject({
        method: 'GET',
        url: `/api/admin/audit/logs?from=${fromDate}&to=${toDate}`,
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.created_at >= $'),
        expect.arrayContaining([fromDate])
      );
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.created_at <= $'),
        expect.arrayContaining([toDate])
      );
    });

    it('should support sorting', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] })
        .mockResolvedValueOnce({ rows: mockAuditLogs });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?sort=userEmail:asc',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY u.email ASC'),
        expect.any(Array)
      );
    });

    it('should support pagination', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '100' }] })
        .mockResolvedValueOnce({ rows: mockAuditLogs });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?limit=25&offset=50',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data.limit).toBe(25);
      expect(data.offset).toBe(50);
      expect(data.total).toBe(100);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $'),
        expect.arrayContaining([25, 50])
      );
    });

    it('should deny access without proper permissions', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = {
          ...mockSuperadmin,
          permissions: [] // No audit:read permission
        };
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should validate query parameters', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?limit=200&status=INVALID',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/admin/audit/logs/export', () => {
    const mockSuperadmin = {
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'superadmin',
      permissions: ['admin:audit:read']
    };

    const mockCsvData = [
      {
        created_at: new Date('2024-01-01T10:00:00Z'),
        user_email: 'user1@test.com',
        action: 'CREATE',
        resource_type: 'user',
        resource_id: 'res-1',
        tenant_type: 'COMMERCIAL',
        status: 'SUCCESS',
        route: '/api/admin/users',
        method: 'POST',
        correlation_id: 'corr-123',
        ip_address: '192.168.1.100'
      }
    ];

    it('should export audit logs as CSV', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query.mockResolvedValueOnce({ rows: mockCsvData });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs/export',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment; filename=');

      const csvContent = response.payload;
      expect(csvContent).toContain('Timestamp,User Email,Action');
      expect(csvContent).toContain('user1@test.com');
      expect(csvContent).toContain('CREATE');
      expect(csvContent).toContain('192.168.1.xxx'); // IP should be anonymized
    });

    it('should apply filters to CSV export', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query.mockResolvedValueOnce({ rows: mockCsvData });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs/export?action=CREATE&tenant=COMMERCIAL',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.action = $'),
        expect.arrayContaining(['CREATE'])
      );
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.tenant_type = $'),
        expect.arrayContaining(['COMMERCIAL'])
      );
    });

    it('should limit CSV export to 10,000 records', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query.mockResolvedValueOnce({ rows: mockCsvData });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs/export',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 10000'),
        expect.any(Array)
      );
    });

    it('should properly escape CSV values', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      const csvDataWithSpecialChars = [{
        ...mockCsvData[0],
        user_email: 'user,with@comma.com',
        resource_id: 'res "with quotes"',
        route: '/api/path\nwith\nnewlines'
      }];

      mockClient.query.mockResolvedValueOnce({ rows: csvDataWithSpecialChars });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs/export',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const csvContent = response.payload;
      expect(csvContent).toContain('"user,with@comma.com"');
      expect(csvContent).toContain('"res ""with quotes"""');
      expect(csvContent).toContain('"/api/path\nwith\nnewlines"');
    });

    it('should anonymize IP addresses in CSV export', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      const csvDataWithIPs = [
        {
          ...mockCsvData[0],
          ip_address: '192.168.1.100'
        },
        {
          ...mockCsvData[0],
          ip_address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        }
      ];

      mockClient.query.mockResolvedValueOnce({ rows: csvDataWithIPs });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs/export',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const csvContent = response.payload;
      expect(csvContent).toContain('192.168.1.xxx'); // IPv4 anonymized
      expect(csvContent).toContain('2001:0db8:85a3:0000::xxxx'); // IPv6 anonymized
    });

    it('should deny export without proper permissions', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = {
          ...mockSuperadmin,
          permissions: [] // No audit:read permission
        };
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs/export',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('RLS (Row Level Security) Enforcement', () => {
    it('should enforce tenant isolation for tenant_admin', async () => {
      const mockTenantAdmin = {
        id: 'tenant-admin-1',
        email: 'tenant@test.com',
        role: 'tenant_admin',
        tenant_type: 'RESIDENTIAL',
        permissions: ['admin:audit:read']
      };

      app.addHook('preHandler', async (request) => {
        request.admin = mockTenantAdmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      // Should automatically filter by tenant_type
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.tenant_type = $1'),
        expect.arrayContaining(['RESIDENTIAL'])
      );
    });

    it('should prevent cross-tenant data access', async () => {
      const mockTenantAdmin = {
        id: 'tenant-admin-1',
        email: 'tenant@test.com',
        role: 'tenant_admin',
        tenant_type: 'RESIDENTIAL',
        permissions: ['admin:audit:read']
      };

      app.addHook('preHandler', async (request) => {
        request.admin = mockTenantAdmin;
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      // Try to access COMMERCIAL tenant data
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs?tenant=COMMERCIAL',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      
      // Should still filter by their own tenant, not the requested one
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('al.tenant_type = $1'),
        expect.arrayContaining(['RESIDENTIAL'])
      );
    });
  });

  describe('Database Error Handling', () => {
    const mockSuperadmin = {
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'superadmin',
      permissions: ['admin:audit:read']
    };

    it('should handle database connection errors', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockDb.getClient.mockRejectedValueOnce(new Error('Connection failed'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(500);
    });

    it('should handle query errors', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/audit/logs',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(500);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should always release database connections', async () => {
      app.addHook('preHandler', async (request) => {
        request.admin = mockSuperadmin;
      });

      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));

      try {
        await app.inject({
          method: 'GET',
          url: '/api/admin/audit/logs',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        });
      } catch (error) {
        // Error is expected
      }

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});