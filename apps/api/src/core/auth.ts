import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthTokenPayload } from '../routes/auth.js';

export type AdminRole = 'superadmin' | 'tenant_admin' | 'auditor';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  tenant_type?: 'RESIDENTIAL' | 'COMMERCIAL'; // Only for tenant_admin
  permissions: Permission[];
}

export type Permission = 
  | 'admin:tenants:read'
  | 'admin:tenants:write'
  | 'admin:users:read'
  | 'admin:users:write'
  | 'admin:roles:read'
  | 'admin:roles:write'
  | 'admin:templates:read'
  | 'admin:templates:write'
  | 'admin:integrations:read'
  | 'admin:integrations:write'
  | 'admin:audit:read'
  | 'admin:system:read';

// Role-based permission mappings
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  superadmin: [
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
  ],
  tenant_admin: [
    'admin:users:read',
    'admin:users:write',
    'admin:templates:read',
    'admin:templates:write',
    'admin:integrations:read',
    'admin:integrations:write',
    'admin:audit:read'
  ],
  auditor: [
    'admin:tenants:read',
    'admin:users:read',
    'admin:templates:read',
    'admin:integrations:read',
    'admin:audit:read',
    'admin:system:read'
  ]
};

export function getPermissionsForRole(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(user: AdminUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function requirePermission(permission: Permission) {
  return async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Verify JWT first
      await request.jwtVerify();
      const payload = request.user as AuthTokenPayload;
      
      // Get admin user info (this would come from database in real implementation)
      const adminUser = await getAdminUser(payload.sub);
      
      if (!adminUser) {
        return reply.status(403).send({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: 'Admin access required',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'ADMIN_ACCESS_REQUIRED'
        });
      }
      
      if (!hasPermission(adminUser, permission)) {
        return reply.status(403).send({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: `Permission '${permission}' required`,
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Add admin context to request
      request.admin = adminUser;
      
    } catch (error) {
      return reply.status(401).send({
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid or missing authentication token',
        instance: request.url,
        correlationId: request.correlationId || 'unknown',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
  };
}

export function requireRole(role: AdminRole) {
  return async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as AuthTokenPayload;
      
      const adminUser = await getAdminUser(payload.sub);
      
      if (!adminUser || adminUser.role !== role) {
        return reply.status(403).send({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: `Role '${role}' required`,
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'INSUFFICIENT_ROLE'
        });
      }
      
      request.admin = adminUser;
      
    } catch (error) {
      return reply.status(401).send({
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid or missing authentication token',
        instance: request.url,
        correlationId: request.correlationId || 'unknown',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
  };
}

export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  // Mock implementation - in real app this would query the database
  // For now, demo user has superadmin role
  if (userId === 'user-123') {
    return {
      id: userId,
      email: 'demo@example.com',
      role: 'superadmin',
      permissions: getPermissionsForRole('superadmin')
    };
  }
  
  return null;
}

export function requireTenantScope(tenantType?: 'RESIDENTIAL' | 'COMMERCIAL') {
  return async function(request: FastifyRequest, reply: FastifyReply) {
    if (!request.admin) {
      return reply.status(403).send({
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'Admin context required',
        instance: request.url,
        correlationId: request.correlationId || 'unknown',
        code: 'ADMIN_CONTEXT_REQUIRED'
      });
    }
    
    // Superadmin can access any tenant
    if (request.admin.role === 'superadmin') {
      return;
    }
    
    // Tenant admin must be scoped to their tenant
    if (request.admin.role === 'tenant_admin') {
      if (!request.admin.tenant_type) {
        return reply.status(403).send({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: 'Tenant admin without tenant scope',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'MISSING_TENANT_SCOPE'
        });
      }
      
      if (tenantType && request.admin.tenant_type !== tenantType) {
        return reply.status(403).send({
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: `Access denied to ${tenantType} tenant`,
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'CROSS_TENANT_ACCESS_DENIED'
        });
      }
    }
  };
}

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AdminUser;
  }
}