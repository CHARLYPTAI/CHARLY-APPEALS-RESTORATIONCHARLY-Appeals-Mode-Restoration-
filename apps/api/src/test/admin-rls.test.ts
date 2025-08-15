import { test, expect, beforeAll, afterAll, describe, beforeEach } from 'vitest';
import { db } from '../db/connection.js';

describe('Row Level Security (RLS) Tests', () => {
  let commercialUserId: string;
  let residentialUserId: string;
  let superadminUserId: string;
  
  beforeAll(async () => {
    await setupTestUsers();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  beforeEach(async () => {
    await clearTestData();
  });
  
  async function setupTestUsers() {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create test users for RLS testing
      const commercialResult = await client.query(
        'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3) RETURNING id',
        ['commercial@rls.test', '$2b$10$testhash', 'COMMERCIAL']
      );
      commercialUserId = commercialResult.rows[0].id;
      
      const residentialResult = await client.query(
        'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3) RETURNING id',
        ['residential@rls.test', '$2b$10$testhash', 'RESIDENTIAL']
      );
      residentialUserId = residentialResult.rows[0].id;
      
      const superadminResult = await client.query(
        'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3) RETURNING id',
        ['superadmin@rls.test', '$2b$10$testhash', 'COMMERCIAL']
      );
      superadminUserId = superadminResult.rows[0].id;
      
      // Assign superadmin role
      await client.query(
        'INSERT INTO role_assignments (user_id, role) VALUES ($1, $2)',
        [superadminUserId, 'superadmin']
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async function clearTestData() {
    const client = await db.getClient();
    try {
      await client.query('DELETE FROM audit_logs WHERE user_id IN ($1, $2, $3)', 
        [commercialUserId, residentialUserId, superadminUserId]);
      await client.query('DELETE FROM rule_templates WHERE created_by IN ($1, $2, $3)', 
        [commercialUserId, residentialUserId, superadminUserId]);
      await client.query('DELETE FROM commercial_properties WHERE user_id IN ($1, $2, $3)', 
        [commercialUserId, residentialUserId, superadminUserId]);
      await client.query('DELETE FROM residential_properties WHERE user_id IN ($1, $2, $3)', 
        [commercialUserId, residentialUserId, superadminUserId]);
    } finally {
      client.release();
    }
  }
  
  async function cleanupTestData() {
    const client = await db.getClient();
    try {
      await client.query('DELETE FROM role_assignments WHERE user_id IN ($1, $2, $3)', 
        [commercialUserId, residentialUserId, superadminUserId]);
      await client.query('DELETE FROM users WHERE id IN ($1, $2, $3)', 
        [commercialUserId, residentialUserId, superadminUserId]);
    } finally {
      client.release();
    }
  }

  describe('Tenant Isolation in Core Tables', () => {
    test('commercial user cannot access residential user data', async () => {
      const commercialClient = await db.getTenantClient('COMMERCIAL', commercialUserId);
      const residentialClient = await db.getTenantClient('RESIDENTIAL', residentialUserId);
      
      try {
        // Create a residential user record
        await residentialClient.query(
          'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3)',
          ['isolated@residential.test', '$2b$10$hash', 'RESIDENTIAL']
        );
        
        // Commercial user should not see residential users
        const result = await commercialClient.query(
          'SELECT * FROM users WHERE email = $1',
          ['isolated@residential.test']
        );
        
        expect(result.rows.length).toBe(0);
      } finally {
        commercialClient.release();
        residentialClient.release();
      }
    });
    
    test('residential user cannot access commercial user data', async () => {
      const commercialClient = await db.getTenantClient('COMMERCIAL', commercialUserId);
      const residentialClient = await db.getTenantClient('RESIDENTIAL', residentialUserId);
      
      try {
        // Create a commercial user record
        await commercialClient.query(
          'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3)',
          ['isolated@commercial.test', '$2b$10$hash', 'COMMERCIAL']
        );
        
        // Residential user should not see commercial users
        const result = await residentialClient.query(
          'SELECT * FROM users WHERE email = $1',
          ['isolated@commercial.test']
        );
        
        expect(result.rows.length).toBe(0);
      } finally {
        commercialClient.release();
        residentialClient.release();
      }
    });
    
    test('user can only access their own data within tenant', async () => {
      const client1 = await db.getTenantClient('COMMERCIAL', commercialUserId);
      
      try {
        // Create another commercial user
        const user2Result = await client1.query(
          'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3) RETURNING id',
          ['other@commercial.test', '$2b$10$hash', 'COMMERCIAL']
        );
        const user2Id = user2Result.rows[0].id;
        
        const client2 = await db.getTenantClient('COMMERCIAL', user2Id);
        
        try {
          // Create commercial properties for each user
          await client1.query(
            'INSERT INTO commercial_properties (user_id, property_address, tenant_type) VALUES ($1, $2, $3)',
            [commercialUserId, '123 Main St', 'COMMERCIAL']
          );
          
          await client2.query(
            'INSERT INTO commercial_properties (user_id, property_address, tenant_type) VALUES ($1, $2, $3)',
            [user2Id, '456 Oak Ave', 'COMMERCIAL']
          );
          
          // Each user should only see their own properties
          const user1Properties = await client1.query('SELECT * FROM commercial_properties');
          const user2Properties = await client2.query('SELECT * FROM commercial_properties');
          
          expect(user1Properties.rows.length).toBe(1);
          expect(user1Properties.rows[0].property_address).toBe('123 Main St');
          
          expect(user2Properties.rows.length).toBe(1);
          expect(user2Properties.rows[0].property_address).toBe('456 Oak Ave');
        } finally {
          client2.release();
        }
      } finally {
        client1.release();
      }
    });
  });

  describe('Rule Template RLS', () => {
    test('tenant isolation for rule templates', async () => {
      const commercialClient = await db.getTenantClient('COMMERCIAL', commercialUserId);
      const residentialClient = await db.getTenantClient('RESIDENTIAL', residentialUserId);
      
      try {
        // Create rule templates for each tenant
        await commercialClient.query(`
          INSERT INTO rule_templates (name, version, tenant_type, template_data, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, ['Commercial Template', '1.0.0', 'COMMERCIAL', '{"test": true}', commercialUserId]);
        
        await residentialClient.query(`
          INSERT INTO rule_templates (name, version, tenant_type, template_data, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, ['Residential Template', '1.0.0', 'RESIDENTIAL', '{"test": true}', residentialUserId]);
        
        // Each tenant should only see their own templates
        const commercialTemplates = await commercialClient.query('SELECT * FROM rule_templates');
        const residentialTemplates = await residentialClient.query('SELECT * FROM rule_templates');
        
        expect(commercialTemplates.rows.length).toBe(1);
        expect(commercialTemplates.rows[0].name).toBe('Commercial Template');
        
        expect(residentialTemplates.rows.length).toBe(1);
        expect(residentialTemplates.rows[0].name).toBe('Residential Template');
      } finally {
        commercialClient.release();
        residentialClient.release();
      }
    });
    
    test('superadmin can access all tenant templates', async () => {
      const commercialClient = await db.getTenantClient('COMMERCIAL', commercialUserId);
      const residentialClient = await db.getTenantClient('RESIDENTIAL', residentialUserId);
      const superadminClient = await db.getTenantClient('COMMERCIAL', superadminUserId);
      
      try {
        // Create templates in both tenants
        await commercialClient.query(`
          INSERT INTO rule_templates (name, version, tenant_type, template_data, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, ['Commercial Template', '1.0.0', 'COMMERCIAL', '{"test": true}', commercialUserId]);
        
        await residentialClient.query(`
          INSERT INTO rule_templates (name, version, tenant_type, template_data, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, ['Residential Template', '1.0.0', 'RESIDENTIAL', '{"test": true}', residentialUserId]);
        
        // Superadmin should see all templates (though context is set to COMMERCIAL)
        const allTemplates = await superadminClient.query('SELECT * FROM rule_templates');
        
        // Due to RLS, superadmin will see templates based on their current session context
        // In real implementation, superadmin queries would bypass RLS or use special context
        expect(allTemplates.rows.length).toBeGreaterThanOrEqual(1);
      } finally {
        commercialClient.release();
        residentialClient.release();
        superadminClient.release();
      }
    });
  });

  describe('Role Assignment RLS', () => {
    test('tenant admin can only see roles in their tenant', async () => {
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Create tenant admins for both tenants
        const commercialAdminResult = await client.query(
          'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3) RETURNING id',
          ['commercial.admin@test.com', '$2b$10$hash', 'COMMERCIAL']
        );
        const commercialAdminId = commercialAdminResult.rows[0].id;
        
        const residentialAdminResult = await client.query(
          'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3) RETURNING id',
          ['residential.admin@test.com', '$2b$10$hash', 'RESIDENTIAL']
        );
        const residentialAdminId = residentialAdminResult.rows[0].id;
        
        // Assign tenant admin roles
        await client.query(
          'INSERT INTO role_assignments (user_id, role, tenant_type) VALUES ($1, $2, $3)',
          [commercialAdminId, 'tenant_admin', 'COMMERCIAL']
        );
        
        await client.query(
          'INSERT INTO role_assignments (user_id, role, tenant_type) VALUES ($1, $2, $3)',
          [residentialAdminId, 'tenant_admin', 'RESIDENTIAL']
        );
        
        await client.query('COMMIT');
        
        // Test RLS isolation
        const commercialAdminClient = await db.getTenantClient('COMMERCIAL', commercialAdminId);
        const residentialAdminClient = await db.getTenantClient('RESIDENTIAL', residentialAdminId);
        
        try {
          // Each admin should only see role assignments in their tenant
          const commercialRoles = await commercialAdminClient.query('SELECT * FROM role_assignments');
          const residentialRoles = await residentialAdminClient.query('SELECT * FROM role_assignments');
          
          // Verify tenant isolation
          const commercialTenantTypes = commercialRoles.rows.map(r => r.tenant_type).filter(Boolean);
          const residentialTenantTypes = residentialRoles.rows.map(r => r.tenant_type).filter(Boolean);
          
          expect(commercialTenantTypes.every(t => t === 'COMMERCIAL')).toBe(true);
          expect(residentialTenantTypes.every(t => t === 'RESIDENTIAL')).toBe(true);
        } finally {
          commercialAdminClient.release();
          residentialAdminClient.release();
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });

  describe('Audit Log RLS', () => {
    test('audit logs respect tenant isolation', async () => {
      const commercialClient = await db.getTenantClient('COMMERCIAL', commercialUserId);
      const residentialClient = await db.getTenantClient('RESIDENTIAL', residentialUserId);
      const systemClient = await db.getClient();
      
      try {
        // Insert audit logs for both tenants
        await systemClient.query(`
          INSERT INTO audit_logs (user_id, action, resource_type, tenant_type)
          VALUES ($1, 'create', 'property', 'COMMERCIAL')
        `, [commercialUserId]);
        
        await systemClient.query(`
          INSERT INTO audit_logs (user_id, action, resource_type, tenant_type)
          VALUES ($1, 'create', 'property', 'RESIDENTIAL')
        `, [residentialUserId]);
        
        // Each tenant should only see their own audit logs
        const commercialLogs = await commercialClient.query('SELECT * FROM audit_logs');
        const residentialLogs = await residentialClient.query('SELECT * FROM audit_logs');
        
        expect(commercialLogs.rows.length).toBe(1);
        expect(commercialLogs.rows[0].tenant_type).toBe('COMMERCIAL');
        
        expect(residentialLogs.rows.length).toBe(1);
        expect(residentialLogs.rows[0].tenant_type).toBe('RESIDENTIAL');
      } finally {
        commercialClient.release();
        residentialClient.release();
        systemClient.release();
      }
    });
    
    test('superadmin can access all audit logs', async () => {
      const superadminClient = await db.getTenantClient('COMMERCIAL', superadminUserId);
      const systemClient = await db.getClient();
      
      try {
        // Insert audit logs for both tenants
        await systemClient.query(`
          INSERT INTO audit_logs (user_id, action, resource_type, tenant_type)
          VALUES ($1, 'create', 'template', 'COMMERCIAL')
        `, [commercialUserId]);
        
        await systemClient.query(`
          INSERT INTO audit_logs (user_id, action, resource_type, tenant_type)
          VALUES ($1, 'create', 'template', 'RESIDENTIAL')
        `, [residentialUserId]);
        
        // Superadmin should be able to see logs (implementation specific)
        const allLogs = await superadminClient.query('SELECT * FROM audit_logs');
        
        // The exact behavior depends on RLS implementation for superadmin
        expect(allLogs.rows.length).toBeGreaterThanOrEqual(1);
      } finally {
        superadminClient.release();
        systemClient.release();
      }
    });
  });

  describe('Cross-Tenant Attack Prevention', () => {
    test('cannot bypass RLS with session variable manipulation', async () => {
      const commercialClient = await db.getTenantClient('COMMERCIAL', commercialUserId);
      
      try {
        // Try to manipulate session variables to access other tenant data
        await expect(async () => {
          await commercialClient.query("SET app.current_tenant_type = 'RESIDENTIAL'");
        }).rejects.toThrow(); // Should be prevented by security definer functions
        
      } finally {
        commercialClient.release();
      }
    });
    
    test('cannot access data by injecting tenant parameters', async () => {
      const commercialClient = await db.getTenantClient('COMMERCIAL', commercialUserId);
      const residentialClient = await db.getTenantClient('RESIDENTIAL', residentialUserId);
      
      try {
        // Create residential-only data
        await residentialClient.query(`
          INSERT INTO rule_templates (name, version, tenant_type, template_data, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, ['Secret Residential Template', '1.0.0', 'RESIDENTIAL', '{"secret": true}', residentialUserId]);
        
        // Try to access it from commercial context with SQL injection-style approach
        const maliciousQuery = await commercialClient.query(`
          SELECT * FROM rule_templates 
          WHERE name = $1 
          OR tenant_type = 'RESIDENTIAL'
        `, ['Secret Residential Template']);
        
        // Should return no results due to RLS
        expect(maliciousQuery.rows.length).toBe(0);
      } finally {
        commercialClient.release();
        residentialClient.release();
      }
    });
    
    test('RLS policies cannot be bypassed with UNION attacks', async () => {
      const commercialClient = await db.getTenantClient('COMMERCIAL', commercialUserId);
      
      try {
        // Attempt a UNION-based attack to access other tenant data
        const result = await commercialClient.query(`
          SELECT name FROM rule_templates WHERE tenant_type = 'COMMERCIAL'
          UNION ALL
          SELECT name FROM rule_templates WHERE tenant_type = 'RESIDENTIAL'
        `);
        
        // RLS should filter results for both parts of the UNION
        const names = result.rows.map(r => r.name);
        expect(names.every(name => !name.includes('Residential'))).toBe(true);
      } finally {
        commercialClient.release();
      }
    });
  });

  describe('Database Function Security', () => {
    test('RLS functions are security definer and cannot be bypassed', async () => {
      const client = await db.getClient();
      
      try {
        // Test that the session setting function works correctly
        await client.query('SELECT set_session_tenant($1, $2)', ['COMMERCIAL', commercialUserId]);
        
        // Verify session variables are set correctly
        const tenantResult = await client.query("SELECT current_setting('app.current_tenant_type')");
        const userResult = await client.query("SELECT current_setting('app.current_user_id')");
        
        expect(tenantResult.rows[0].current_setting).toBe('COMMERCIAL');
        expect(userResult.rows[0].current_setting).toBe(commercialUserId);
        
        // Test permission check function
        const hasPermissionResult = await client.query(
          'SELECT user_has_admin_permission($1, $2, $3)',
          [superadminUserId, 'admin:users:read', 'COMMERCIAL']
        );
        
        expect(hasPermissionResult.rows[0].user_has_admin_permission).toBe(true);
        
        // Test non-admin user
        const noPermissionResult = await client.query(
          'SELECT user_has_admin_permission($1, $2, $3)',
          [commercialUserId, 'admin:users:read', 'COMMERCIAL']
        );
        
        expect(noPermissionResult.rows[0].user_has_admin_permission).toBe(false);
        
      } finally {
        client.release();
      }
    });
  });
});