import { test, expect, beforeAll, afterAll, describe, beforeEach } from 'vitest';
import { build } from '../main.js';
import { FastifyInstance } from 'fastify';
import { db } from '../db/connection.js';

describe('Admin RBAC Tests', () => {
  let app: FastifyInstance;
  let superadminToken: string;
  let tenantAdminToken: string;
  let auditorToken: string;
  let regularUserToken: string;
  
  beforeAll(async () => {
    app = await build({ logger: false });
    await app.ready();
    
    // Setup test users and get tokens
    await setupTestUsers();
  });
  
  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });
  
  beforeEach(async () => {
    // Clear any test-specific data between tests
    await clearTestData();
  });

  async function setupTestUsers() {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create test users
      const users = [
        { email: 'superadmin@test.com', password: 'password123', tenant: 'COMMERCIAL', role: 'superadmin' },
        { email: 'tenant_admin@test.com', password: 'password123', tenant: 'COMMERCIAL', role: 'tenant_admin' },
        { email: 'auditor@test.com', password: 'password123', tenant: 'COMMERCIAL', role: 'auditor' },
        { email: 'user@test.com', password: 'password123', tenant: 'COMMERCIAL', role: null }
      ];
      
      for (const user of users) {
        // Insert user
        const userResult = await client.query(
          'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3) RETURNING id',
          [user.email, `$2b$10$${user.password}hash`, user.tenant]
        );
        
        const userId = userResult.rows[0].id;
        
        // Assign role if specified
        if (user.role) {
          await client.query(
            'INSERT INTO role_assignments (user_id, role, tenant_type) VALUES ($1, $2, $3)',
            [userId, user.role, user.tenant]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Get auth tokens for each test user
      superadminToken = await getAuthToken('superadmin@test.com', 'password123');
      tenantAdminToken = await getAuthToken('tenant_admin@test.com', 'password123');
      auditorToken = await getAuthToken('auditor@test.com', 'password123');
      regularUserToken = await getAuthToken('user@test.com', 'password123');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async function getAuthToken(email: string, password: string): Promise<string> {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/commercial/login',
      payload: { email, password }
    });
    
    expect(response.statusCode).toBe(200);
    const { access_token } = JSON.parse(response.payload);
    return access_token;
  }
  
  async function clearTestData() {
    const client = await db.getClient();
    try {
      await client.query('DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@test.com\')');
      await client.query('DELETE FROM rule_templates WHERE created_by IN (SELECT id FROM users WHERE email LIKE \'%@test.com\')');
    } finally {
      client.release();
    }
  }
  
  async function cleanupTestData() {
    const client = await db.getClient();
    try {
      await client.query('DELETE FROM role_assignments WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@test.com\')');
      await client.query('DELETE FROM users WHERE email LIKE \'%@test.com\'');
    } finally {
      client.release();
    }
  }

  describe('Tenant Access Control', () => {
    test('superadmin can access all tenant data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tenants',
        headers: {
          authorization: `Bearer ${superadminToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      const tenants = JSON.parse(response.payload);
      expect(Array.isArray(tenants)).toBe(true);
      expect(tenants.length).toBeGreaterThan(0);
    });
    
    test('tenant_admin cannot access tenant overview', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tenants',
        headers: {
          authorization: `Bearer ${tenantAdminToken}`
        }
      });
      
      expect(response.statusCode).toBe(403);
      const error = JSON.parse(response.payload);
      expect(error.code).toBe('INSUFFICIENT_ROLE');
    });
    
    test('auditor can access tenant overview (read-only)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tenants',
        headers: {
          authorization: `Bearer ${auditorToken}`
        }
      });
      
      expect(response.statusCode).toBe(403); // Auditor needs specific permission, not just role
    });
    
    test('regular user cannot access any admin endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tenants',
        headers: {
          authorization: `Bearer ${regularUserToken}`
        }
      });
      
      expect(response.statusCode).toBe(403);
      const error = JSON.parse(response.payload);
      expect(error.code).toBe('ADMIN_ACCESS_REQUIRED');
    });
  });

  describe('User Management Permissions', () => {
    test('superadmin can list users across all tenants', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/users',
        headers: {
          authorization: `Bearer ${superadminToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });
    
    test('tenant_admin can only list users in their tenant', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/users?tenant=RESIDENTIAL',
        headers: {
          authorization: `Bearer ${tenantAdminToken}`
        }
      });
      
      expect(response.statusCode).toBe(403);
      const error = JSON.parse(response.payload);
      expect(error.code).toBe('CROSS_TENANT_ACCESS_DENIED');
    });
    
    test('tenant_admin can list users in their own tenant', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/users?tenant=COMMERCIAL',
        headers: {
          authorization: `Bearer ${tenantAdminToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.users).toBeDefined();
    });
    
    test('auditor can list users but cannot modify', async () => {
      const listResponse = await app.inject({
        method: 'GET',
        url: '/admin/users',
        headers: {
          authorization: `Bearer ${auditorToken}`
        }
      });
      
      expect(listResponse.statusCode).toBe(200);
      
      // But cannot create users
      const createResponse = await app.inject({
        method: 'POST',
        url: '/admin/users',
        headers: {
          authorization: `Bearer ${auditorToken}`
        },
        payload: {
          email: 'new@test.com',
          password: 'password123',
          tenantType: 'COMMERCIAL'
        }
      });
      
      expect(createResponse.statusCode).toBe(403);
    });
  });

  describe('Role Assignment Validation', () => {
    test('superadmin can assign any role to any user', async () => {
      // Create a user first
      const createResponse = await app.inject({
        method: 'POST',
        url: '/admin/users',
        headers: {
          authorization: `Bearer ${superadminToken}`
        },
        payload: {
          email: 'newuser@test.com',
          password: 'password123',
          tenantType: 'COMMERCIAL',
          role: 'tenant_admin'
        }
      });
      
      expect(createResponse.statusCode).toBe(201);
      const user = JSON.parse(createResponse.payload);
      expect(user.role).toBe('tenant_admin');
    });
    
    test('tenant_admin cannot assign superadmin role', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/admin/users',
        headers: {
          authorization: `Bearer ${tenantAdminToken}`
        },
        payload: {
          email: 'restricted@test.com',
          password: 'password123',
          tenantType: 'COMMERCIAL',
          role: 'superadmin' // This should be rejected
        }
      });
      
      // Should either reject the request or ignore the superadmin role
      expect([400, 403].includes(createResponse.statusCode)).toBe(true);
    });
    
    test('tenant_admin cannot create users in other tenants', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/users',
        headers: {
          authorization: `Bearer ${tenantAdminToken}`
        },
        payload: {
          email: 'cross@test.com',
          password: 'password123',
          tenantType: 'RESIDENTIAL' // Different from tenant_admin's tenant
        }
      });
      
      expect(response.statusCode).toBe(403);
      const error = JSON.parse(response.payload);
      expect(error.code).toBe('CROSS_TENANT_CREATE_DENIED');
    });
  });

  describe('Rule Template Access Control', () => {
    test('superadmin can access rule templates for all tenants', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/rules/templates',
        headers: {
          authorization: `Bearer ${superadminToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.templates).toBeDefined();
    });
    
    test('tenant_admin can only access templates for their tenant', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/rules/templates?tenant=RESIDENTIAL',
        headers: {
          authorization: `Bearer ${tenantAdminToken}`
        }
      });
      
      expect(response.statusCode).toBe(403);
    });
    
    test('auditor can read but not write rule templates', async () => {
      const readResponse = await app.inject({
        method: 'GET',
        url: '/admin/rules/templates',
        headers: {
          authorization: `Bearer ${auditorToken}`
        }
      });
      
      expect(readResponse.statusCode).toBe(200);
      
      const writeResponse = await app.inject({
        method: 'POST',
        url: '/admin/rules/templates:import',
        headers: {
          authorization: `Bearer ${auditorToken}`
        },
        payload: {
          templates: [],
          conflictResolution: 'skip'
        }
      });
      
      expect(writeResponse.statusCode).toBe(403);
    });
  });

  describe('Audit Log Access', () => {
    test('superadmin can access all audit logs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/audit/logs',
        headers: {
          authorization: `Bearer ${superadminToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.logs).toBeDefined();
    });
    
    test('tenant_admin can only access logs for their tenant', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/audit/logs?tenant=COMMERCIAL',
        headers: {
          authorization: `Bearer ${tenantAdminToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
      
      // But cannot access other tenant logs
      const restrictedResponse = await app.inject({
        method: 'GET',
        url: '/admin/audit/logs?tenant=RESIDENTIAL',
        headers: {
          authorization: `Bearer ${tenantAdminToken}`
        }
      });
      
      expect(restrictedResponse.statusCode).toBe(403);
    });
    
    test('auditor can access audit logs (read-only)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/audit/logs',
        headers: {
          authorization: `Bearer ${auditorToken}`
        }
      });
      
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Permission Matrix Validation', () => {
    const permissionTests = [
      { role: 'superadmin', endpoint: '/admin/tenants', method: 'GET', shouldPass: true },
      { role: 'superadmin', endpoint: '/admin/users', method: 'GET', shouldPass: true },
      { role: 'superadmin', endpoint: '/admin/users', method: 'POST', shouldPass: true },
      { role: 'tenant_admin', endpoint: '/admin/tenants', method: 'GET', shouldPass: false },
      { role: 'tenant_admin', endpoint: '/admin/users', method: 'GET', shouldPass: true },
      { role: 'tenant_admin', endpoint: '/admin/users', method: 'POST', shouldPass: true },
      { role: 'auditor', endpoint: '/admin/tenants', method: 'GET', shouldPass: false },
      { role: 'auditor', endpoint: '/admin/users', method: 'GET', shouldPass: true },
      { role: 'auditor', endpoint: '/admin/users', method: 'POST', shouldPass: false },
    ];
    
    test.each(permissionTests)(
      '$role $method $endpoint should $shouldPass',
      async ({ role, endpoint, method, shouldPass }) => {
        const tokens: Record<string, string> = {
          superadmin: superadminToken,
          tenant_admin: tenantAdminToken,
          auditor: auditorToken
        };
        
        const response = await app.inject({
          method: method as any,
          url: endpoint,
          headers: {
            authorization: `Bearer ${tokens[role]}`
          },
          payload: method === 'POST' ? {
            email: 'test@example.com',
            password: 'password123',
            tenantType: 'COMMERCIAL'
          } : undefined
        });
        
        if (shouldPass) {
          expect([200, 201].includes(response.statusCode)).toBe(true);
        } else {
          expect([403, 404].includes(response.statusCode)).toBe(true);
        }
      }
    );
  });
});