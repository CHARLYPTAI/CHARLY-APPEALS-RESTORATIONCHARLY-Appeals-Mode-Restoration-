import { test, expect, describe } from 'vitest';
import { getPermissionsForRole, hasPermission, AdminUser, AdminRole } from '../core/auth.js';

describe('Admin RBAC Unit Tests', () => {
  
  describe('Permission System', () => {
    test('superadmin has all permissions', () => {
      const permissions = getPermissionsForRole('superadmin');
      
      expect(permissions).toContain('admin:tenants:read');
      expect(permissions).toContain('admin:tenants:write');
      expect(permissions).toContain('admin:users:read');
      expect(permissions).toContain('admin:users:write');
      expect(permissions).toContain('admin:roles:read');
      expect(permissions).toContain('admin:roles:write');
      expect(permissions).toContain('admin:templates:read');
      expect(permissions).toContain('admin:templates:write');
      expect(permissions).toContain('admin:integrations:read');
      expect(permissions).toContain('admin:integrations:write');
      expect(permissions).toContain('admin:audit:read');
      expect(permissions).toContain('admin:system:read');
    });
    
    test('tenant_admin has limited permissions', () => {
      const permissions = getPermissionsForRole('tenant_admin');
      
      // Should have user management permissions
      expect(permissions).toContain('admin:users:read');
      expect(permissions).toContain('admin:users:write');
      expect(permissions).toContain('admin:templates:read');
      expect(permissions).toContain('admin:templates:write');
      expect(permissions).toContain('admin:integrations:read');
      expect(permissions).toContain('admin:integrations:write');
      expect(permissions).toContain('admin:audit:read');
      
      // Should NOT have tenant or system-wide permissions
      expect(permissions).not.toContain('admin:tenants:read');
      expect(permissions).not.toContain('admin:tenants:write');
      expect(permissions).not.toContain('admin:roles:read');
      expect(permissions).not.toContain('admin:roles:write');
      expect(permissions).not.toContain('admin:system:read');
    });
    
    test('auditor has read-only permissions', () => {
      const permissions = getPermissionsForRole('auditor');
      
      // Should have read permissions
      expect(permissions).toContain('admin:tenants:read');
      expect(permissions).toContain('admin:users:read');
      expect(permissions).toContain('admin:templates:read');
      expect(permissions).toContain('admin:integrations:read');
      expect(permissions).toContain('admin:audit:read');
      expect(permissions).toContain('admin:system:read');
      
      // Should NOT have any write permissions
      expect(permissions).not.toContain('admin:tenants:write');
      expect(permissions).not.toContain('admin:users:write');
      expect(permissions).not.toContain('admin:roles:write');
      expect(permissions).not.toContain('admin:templates:write');
      expect(permissions).not.toContain('admin:integrations:write');
    });
  });

  describe('Permission Checking', () => {
    test('hasPermission works correctly', () => {
      const superadmin: AdminUser = {
        id: 'test-admin',
        email: 'admin@test.com',
        role: 'superadmin',
        permissions: getPermissionsForRole('superadmin')
      };
      
      const tenantAdmin: AdminUser = {
        id: 'test-tenant-admin',
        email: 'tenant@test.com',
        role: 'tenant_admin',
        tenant_type: 'COMMERCIAL',
        permissions: getPermissionsForRole('tenant_admin')
      };
      
      const auditor: AdminUser = {
        id: 'test-auditor',
        email: 'auditor@test.com',
        role: 'auditor',
        permissions: getPermissionsForRole('auditor')
      };
      
      // Superadmin tests
      expect(hasPermission(superadmin, 'admin:tenants:read')).toBe(true);
      expect(hasPermission(superadmin, 'admin:users:write')).toBe(true);
      expect(hasPermission(superadmin, 'admin:system:read')).toBe(true);
      
      // Tenant admin tests
      expect(hasPermission(tenantAdmin, 'admin:users:read')).toBe(true);
      expect(hasPermission(tenantAdmin, 'admin:users:write')).toBe(true);
      expect(hasPermission(tenantAdmin, 'admin:tenants:read')).toBe(false);
      expect(hasPermission(tenantAdmin, 'admin:system:read')).toBe(false);
      
      // Auditor tests
      expect(hasPermission(auditor, 'admin:users:read')).toBe(true);
      expect(hasPermission(auditor, 'admin:audit:read')).toBe(true);
      expect(hasPermission(auditor, 'admin:users:write')).toBe(false);
      expect(hasPermission(auditor, 'admin:templates:write')).toBe(false);
    });
  });

  describe('Role Validation', () => {
    test('all defined roles have valid permissions', () => {
      const roles: AdminRole[] = ['superadmin', 'tenant_admin', 'auditor'];
      
      for (const role of roles) {
        const permissions = getPermissionsForRole(role);
        expect(permissions).toBeDefined();
        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBeGreaterThan(0);
        
        // All permissions should be strings starting with 'admin:'
        for (const permission of permissions) {
          expect(typeof permission).toBe('string');
          expect(permission).toMatch(/^admin:/);
        }
      }
    });
    
    test('unknown role returns empty permissions', () => {
      const permissions = getPermissionsForRole('unknown' as AdminRole);
      expect(permissions).toEqual([]);
    });
  });

  describe('Permission Matrix Validation', () => {
    const testCases = [
      // [role, permission, expected]
      ['superadmin', 'admin:tenants:read', true],
      ['superadmin', 'admin:tenants:write', true],
      ['superadmin', 'admin:users:read', true],
      ['superadmin', 'admin:users:write', true],
      ['superadmin', 'admin:templates:read', true],
      ['superadmin', 'admin:templates:write', true],
      ['superadmin', 'admin:audit:read', true],
      ['superadmin', 'admin:system:read', true],
      
      ['tenant_admin', 'admin:tenants:read', false],
      ['tenant_admin', 'admin:tenants:write', false],
      ['tenant_admin', 'admin:users:read', true],
      ['tenant_admin', 'admin:users:write', true],
      ['tenant_admin', 'admin:templates:read', true],
      ['tenant_admin', 'admin:templates:write', true],
      ['tenant_admin', 'admin:audit:read', true],
      ['tenant_admin', 'admin:system:read', false],
      
      ['auditor', 'admin:tenants:read', true],
      ['auditor', 'admin:tenants:write', false],
      ['auditor', 'admin:users:read', true],
      ['auditor', 'admin:users:write', false],
      ['auditor', 'admin:templates:read', true],
      ['auditor', 'admin:templates:write', false],
      ['auditor', 'admin:audit:read', true],
      ['auditor', 'admin:system:read', true],
    ] as const;

    test.each(testCases)(
      'role %s should %s have permission %s',
      (role, permission, expected) => {
        const permissions = getPermissionsForRole(role);
        const hasIt = permissions.includes(permission);
        expect(hasIt).toBe(expected);
      }
    );
  });

  describe('Tenant Scope Validation', () => {
    test('tenant_admin must have tenant_type', () => {
      const validTenantAdmin: AdminUser = {
        id: 'test',
        email: 'test@test.com',
        role: 'tenant_admin',
        tenant_type: 'COMMERCIAL',
        permissions: getPermissionsForRole('tenant_admin')
      };
      
      expect(validTenantAdmin.tenant_type).toBeDefined();
      expect(['RESIDENTIAL', 'COMMERCIAL']).toContain(validTenantAdmin.tenant_type);
    });
    
    test('superadmin does not require tenant_type', () => {
      const superadmin: AdminUser = {
        id: 'test',
        email: 'test@test.com',
        role: 'superadmin',
        permissions: getPermissionsForRole('superadmin')
      };
      
      expect(superadmin.tenant_type).toBeUndefined();
    });
    
    test('auditor does not require tenant_type', () => {
      const auditor: AdminUser = {
        id: 'test',
        email: 'test@test.com',
        role: 'auditor',
        permissions: getPermissionsForRole('auditor')
      };
      
      expect(auditor.tenant_type).toBeUndefined();
    });
  });
});