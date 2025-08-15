import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requirePermission, requireRole, requireTenantScope } from '../core/auth.js';
import type { AdminUser } from '../core/auth.js';
import { db } from '../db/connection.js';

interface TenantInfo {
  type: 'RESIDENTIAL' | 'COMMERCIAL';
  userCount: number;
  activeUsers: number;
  createdAt: string;
}

interface UserInfo {
  id: string;
  email: string;
  tenantType: 'RESIDENTIAL' | 'COMMERCIAL';
  role?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

interface RuleTemplate {
  id: string;
  name: string;
  version: string;
  tenantType: 'RESIDENTIAL' | 'COMMERCIAL';
  description?: string;
  templateData: any;
  schemaVersion: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  tenantType?: 'RESIDENTIAL' | 'COMMERCIAL';
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  createdAt: string;
}

interface CreateUserRequest {
  email: string;
  password: string;
  tenantType: 'RESIDENTIAL' | 'COMMERCIAL';
  role?: 'superadmin' | 'tenant_admin' | 'auditor';
  sendInvite?: boolean;
}

interface UpdateUserRequest {
  role?: 'superadmin' | 'tenant_admin' | 'auditor' | null;
  isActive?: boolean;
}

interface RoleAssignment {
  id: string;
  role: 'superadmin' | 'tenant_admin' | 'auditor';
  tenantType?: 'RESIDENTIAL' | 'COMMERCIAL';
  assignedBy: string;
  assignedAt: string;
  revokedAt?: string;
}

interface ImportTemplatesRequest {
  templates: RuleTemplate[];
  conflictResolution: 'replace' | 'new_version' | 'skip';
}

const tenantListSchema = {
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
          userCount: { type: 'number' },
          activeUsers: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

const userListSchema = {
  querystring: {
    type: 'object',
    properties: {
      tenant: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'number', minimum: 0, default: 0 },
      search: { type: 'string' },
      role: { type: 'string' },
      status: { type: 'string', enum: ['active', 'inactive'] },
      sort: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              tenantType: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
              role: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              lastLogin: { type: 'string', format: 'date-time' },
              isActive: { type: 'boolean' }
            }
          }
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' }
      }
    }
  }
};

const createUserSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'tenantType'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      tenantType: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
      role: { type: 'string', enum: ['superadmin', 'tenant_admin', 'auditor'] },
      sendInvite: { type: 'boolean' }
    }
  }
};

const updateUserSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      role: { type: 'string', enum: ['superadmin', 'tenant_admin', 'auditor'], nullable: true },
      isActive: { type: 'boolean' }
    }
  }
};

const userRolesSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        roleAssignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              role: { type: 'string' },
              tenantType: { type: 'string' },
              assignedBy: { type: 'string' },
              assignedAt: { type: 'string', format: 'date-time' },
              revokedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }
};

const templateListSchema = {
  querystring: {
    type: 'object',
    properties: {
      tenant: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'number', minimum: 0, default: 0 }
    }
  }
};

const auditLogSchema = {
  querystring: {
    type: 'object',
    properties: {
      tenant: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
      userId: { type: 'string', format: 'uuid' },
      actor: { type: 'string' },
      action: { type: 'string' },
      resourceType: { type: 'string' },
      route: { type: 'string' },
      status: { type: 'string', enum: ['SUCCESS', 'DENIED', 'ERROR'] },
      correlationId: { type: 'string' },
      from: { type: 'string', format: 'date-time' },
      to: { type: 'string', format: 'date-time' },
      sort: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      offset: { type: 'number', minimum: 0, default: 0 }
    }
  }
};

export async function adminRoutes(fastify: FastifyInstance) {
  
  // GET /api/admin/tenants - List tenant information (superadmin only)
  fastify.get('/admin/tenants', {
    preHandler: [requireRole('superadmin')],
    schema: tenantListSchema
  }, async (request, reply) => {
    const client = await db.getClient();
    
    try {
      const result = await client.query(`
        SELECT 
          'RESIDENTIAL' as type,
          COUNT(*) as user_count,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_users,
          MIN(created_at) as created_at
        FROM users WHERE tenant_type = 'RESIDENTIAL'
        UNION ALL
        SELECT 
          'COMMERCIAL' as type,
          COUNT(*) as user_count,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_users,
          MIN(created_at) as created_at
        FROM users WHERE tenant_type = 'COMMERCIAL'
      `);
      
      return result.rows.map(row => ({
        type: row.type,
        userCount: parseInt(row.user_count),
        activeUsers: parseInt(row.active_users),
        createdAt: row.created_at?.toISOString() || new Date().toISOString()
      }));
    } finally {
      client.release();
    }
  });

  // GET /api/admin/users - List users (scoped by tenant for tenant_admin)
  fastify.get('/admin/users', {
    preHandler: [requirePermission('admin:users:read'), requireTenantScope()],
    schema: userListSchema
  }, async (request, reply) => {
    const { tenant, limit = 20, offset = 0, search, role, status, sort } = request.query as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    
    try {
      let tenantFilter = '';
      let params: any[] = [limit, offset];
      
      // Apply tenant filtering based on admin role and request
      if (admin.role === 'tenant_admin') {
        tenantFilter = 'WHERE u.tenant_type = $3';
        params.push(admin.tenant_type);
      } else if (tenant) {
        tenantFilter = 'WHERE u.tenant_type = $3';
        params.push(tenant);
      }
      
      // Build dynamic WHERE clauses for search and filters
      let additionalFilters = '';
      let additionalParams: any[] = [];
      let paramIndex = tenantFilter ? 4 : 3; // Account for limit, offset, and optional tenant
      
      if (search) {
        additionalFilters += ` AND (u.email ILIKE $${paramIndex} OR u.id::text ILIKE $${paramIndex})`;
        additionalParams.push(`%${search}%`);
        paramIndex++;
      }
      
      if (role && role !== 'ALL') {
        if (role === 'none') {
          additionalFilters += ` AND ra.role IS NULL`;
        } else {
          additionalFilters += ` AND ra.role = $${paramIndex}`;
          additionalParams.push(role);
          paramIndex++;
        }
      }
      
      if (status && status !== 'all') {
        // For now, we'll assume all users are active unless explicitly marked inactive
        // This can be enhanced with a proper is_active column
        if (status === 'inactive') {
          additionalFilters += ` AND u.updated_at < NOW() - INTERVAL '90 days'`;
        }
      }
      
      // Parse sort parameter
      let orderBy = 'u.created_at DESC';
      if (sort) {
        const [field, direction] = sort.split(':');
        const validFields = ['email', 'tenantType', 'role', 'createdAt', 'lastLogin', 'isActive'];
        const validDirections = ['asc', 'desc'];
        
        if (validFields.includes(field) && validDirections.includes(direction)) {
          const dbFieldMap: Record<string, string> = {
            email: 'u.email',
            tenantType: 'u.tenant_type',
            role: 'ra.role',
            createdAt: 'u.created_at',
            lastLogin: 'u.updated_at',
            isActive: 'u.created_at' // Placeholder since we don't have is_active column yet
          };
          const dbField = dbFieldMap[field] || 'u.created_at';
          
          orderBy = `${dbField} ${direction.toUpperCase()}`;
        }
      }
      
      const allParams = [...params, ...additionalParams];
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN role_assignments ra ON u.id = ra.user_id AND ra.revoked_at IS NULL
        ${tenantFilter}${additionalFilters}
      `;
      
      const dataQuery = `
        SELECT 
          u.id,
          u.email,
          u.tenant_type,
          ra.role,
          u.created_at,
          u.updated_at,
          true as is_active
        FROM users u
        LEFT JOIN role_assignments ra ON u.id = ra.user_id AND ra.revoked_at IS NULL
        ${tenantFilter}${additionalFilters}
        ORDER BY ${orderBy}
        LIMIT $1 OFFSET $2
      `;
      
      const [countResult, dataResult] = await Promise.all([
        client.query(countQuery, tenantFilter ? [params[2], ...additionalParams] : additionalParams),
        client.query(dataQuery, allParams)
      ]);
      
      const users: UserInfo[] = dataResult.rows.map(row => ({
        id: row.id,
        email: row.email,
        tenantType: row.tenant_type,
        role: row.role,
        createdAt: row.created_at.toISOString(),
        lastLogin: row.updated_at?.toISOString(),
        isActive: row.is_active
      }));
      
      return {
        users,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      };
    } finally {
      client.release();
    }
  });

  // POST /api/admin/users - Create user in tenant
  fastify.post('/admin/users', {
    preHandler: [requirePermission('admin:users:write'), requireTenantScope()],
    schema: createUserSchema
  }, async (request, reply) => {
    const { email, password, tenantType, role } = request.body as any;
    const admin = request.admin!;
    
    // Tenant admin can only create users in their tenant
    if (admin.role === 'tenant_admin' && tenantType !== admin.tenant_type) {
      return reply.status(403).send({
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: `Cannot create users in ${tenantType} tenant`,
        instance: request.url,
        correlationId: request.correlationId || 'unknown',
        code: 'CROSS_TENANT_CREATE_DENIED'
      });
    }
    
    // Only superadmin can create superadmin users
    if (role === 'superadmin' && admin.role !== 'superadmin') {
      return reply.status(403).send({
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'Only superadmin can create superadmin users',
        instance: request.url,
        correlationId: request.correlationId || 'unknown',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Check for existing user
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return reply.status(409).send({
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: 'A user with this email already exists',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'USER_EMAIL_EXISTS'
        });
      }
      
      // Create user (mock password hashing for now)
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, tenant_type) VALUES ($1, $2, $3) RETURNING id',
        [email, `$2b$10$${password}hash`, tenantType]
      );
      
      const userId = userResult.rows[0].id;
      
      // Assign role if provided
      if (role) {
        await client.query(
          'INSERT INTO role_assignments (user_id, role, tenant_type, assigned_by) VALUES ($1, $2, $3, $4)',
          [userId, role, role === 'superadmin' ? null : tenantType, admin.id]
        );
      }
      
      // Log user creation
      await client.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, tenant_type, details, correlation_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          admin.id,
          'create',
          'user',
          userId,
          tenantType,
          JSON.stringify({ email, role, tenantType }),
          request.correlationId || 'unknown'
        ]
      );
      
      await client.query('COMMIT');
      
      return reply.status(201).send({
        id: userId,
        email,
        tenantType,
        role,
        isActive: true
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  // GET /api/admin/users/:id/roles - Get user role assignments
  fastify.get('/admin/users/:id/roles', {
    preHandler: [requirePermission('admin:users:read'), requireTenantScope()],
    schema: userRolesSchema
  }, async (request, reply) => {
    const { id } = request.params as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    
    try {
      // Check if user exists and admin has access
      const userCheck = await client.query(
        `SELECT u.id, u.tenant_type 
         FROM users u 
         WHERE u.id = $1 ${admin.role === 'tenant_admin' ? 'AND u.tenant_type = $2' : ''}`,
        admin.role === 'tenant_admin' ? [id, admin.tenant_type] : [id]
      );
      
      if (userCheck.rows.length === 0) {
        return reply.status(404).send({
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'User not found or access denied',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Get role assignments history
      const rolesResult = await client.query(`
        SELECT 
          ra.id,
          ra.role,
          ra.tenant_type,
          ra.assigned_by,
          ra.assigned_at,
          ra.revoked_at,
          u.email as assigned_by_email
        FROM role_assignments ra
        LEFT JOIN users u ON ra.assigned_by = u.id
        WHERE ra.user_id = $1
        ORDER BY ra.assigned_at DESC
      `, [id]);
      
      const roleAssignments: RoleAssignment[] = rolesResult.rows.map(row => ({
        id: row.id,
        role: row.role,
        tenantType: row.tenant_type,
        assignedBy: row.assigned_by_email || row.assigned_by,
        assignedAt: row.assigned_at.toISOString(),
        revokedAt: row.revoked_at?.toISOString()
      }));
      
      return { roleAssignments };
    } finally {
      client.release();
    }
  });

  // PATCH /api/admin/users/:id - Update user role/status
  fastify.patch('/admin/users/:id', {
    preHandler: [requirePermission('admin:users:write'), requireTenantScope()],
    schema: updateUserSchema
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { role, isActive } = request.body as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    
    try {
      // Check if user exists and admin has access
      const userCheck = await client.query(
        `SELECT u.id, u.tenant_type 
         FROM users u 
         WHERE u.id = $1 ${admin.role === 'tenant_admin' ? 'AND u.tenant_type = $2' : ''}`,
        admin.role === 'tenant_admin' ? [id, admin.tenant_type] : [id]
      );
      
      if (userCheck.rows.length === 0) {
        return reply.status(404).send({
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'User not found or access denied',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'USER_NOT_FOUND'
        });
      }
      
      const userTenantType = userCheck.rows[0].tenant_type;
      
      await client.query('BEGIN');
      
      // Update role if provided
      if (role !== undefined) {
        // Check permissions for role assignment
        if (role === 'superadmin' && admin.role !== 'superadmin') {
          await client.query('ROLLBACK');
          return reply.status(403).send({
            type: 'about:blank',
            title: 'Forbidden',
            status: 403,
            detail: 'Only superadmin can assign superadmin role',
            instance: request.url,
            correlationId: request.correlationId || 'unknown',
            code: 'INSUFFICIENT_PRIVILEGES'
          });
        }
        
        if (role === null) {
          // Revoke existing roles
          await client.query(
            'UPDATE role_assignments SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
            [id]
          );
        } else {
          // Revoke existing roles and assign new one
          await client.query(
            'UPDATE role_assignments SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
            [id]
          );
          
          await client.query(
            'INSERT INTO role_assignments (user_id, role, tenant_type, assigned_by) VALUES ($1, $2, $3, $4)',
            [id, role, role === 'superadmin' ? null : userTenantType, admin.id]
          );
        }
      }
      
      // Log user update
      await client.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, tenant_type, details, correlation_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          admin.id,
          'update',
          'user',
          id,
          userTenantType,
          JSON.stringify({ role, isActive }),
          request.correlationId || 'unknown'
        ]
      );
      
      await client.query('COMMIT');
      
      return reply.send({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  // GET /api/admin/rules/templates - List rule templates
  fastify.get('/admin/rules/templates', {
    preHandler: [requirePermission('admin:templates:read'), requireTenantScope()],
    schema: templateListSchema
  }, async (request, reply) => {
    const { tenant, limit = 20, offset = 0 } = request.query as any;
    const admin = request.admin!;
    
    const tenantClient = await db.getTenantClient(
      admin.tenant_type || tenant || 'COMMERCIAL',
      admin.id
    );
    
    try {
      let tenantFilter = '';
      let params: any[] = [limit, offset];
      
      if (admin.role === 'tenant_admin') {
        tenantFilter = 'WHERE tenant_type = $3';
        params.push(admin.tenant_type);
      } else if (tenant) {
        tenantFilter = 'WHERE tenant_type = $3';
        params.push(tenant);
      }
      
      const result = await tenantClient.query(`
        SELECT 
          id, name, version, tenant_type, description,
          template_data, schema_version, created_by,
          created_at, updated_at, is_active
        FROM rule_templates
        ${tenantFilter}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, params);
      
      const templates: RuleTemplate[] = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        version: row.version,
        tenantType: row.tenant_type,
        description: row.description,
        templateData: row.template_data,
        schemaVersion: row.schema_version,
        createdBy: row.created_by,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        isActive: row.is_active
      }));
      
      return { templates };
    } finally {
      tenantClient.release();
    }
  });

  // POST /api/admin/rules/templates:import - Import rule templates
  fastify.post('/admin/rules/templates:import', {
    preHandler: [requirePermission('admin:templates:write'), requireTenantScope()],
    schema: {
      body: {
        type: 'object',
        required: ['templates', 'conflictResolution'],
        properties: {
          templates: {
            type: 'array',
            items: { type: 'object' }
          },
          conflictResolution: {
            type: 'string',
            enum: ['replace', 'new_version', 'skip']
          }
        }
      }
    }
  }, async (request, reply) => {
    const { templates, conflictResolution } = request.body as any;
    const admin = request.admin!;
    
    // Import logic would go here - this is a placeholder
    return reply.send({
      imported: templates.length,
      conflicts: 0,
      skipped: 0
    });
  });

  // GET /api/admin/audit/logs - Get audit logs
  fastify.get('/admin/audit/logs', {
    preHandler: [requirePermission('admin:audit:read'), requireTenantScope()],
    schema: auditLogSchema
  }, async (request, reply) => {
    const { 
      tenant, 
      userId, 
      actor, 
      action, 
      resourceType, 
      route, 
      status, 
      correlationId, 
      from, 
      to, 
      sort,
      limit = 50, 
      offset = 0 
    } = request.query as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    
    try {
      let whereClause = 'WHERE 1=1';
      let params: any[] = [];
      let paramIndex = 1;
      
      // Apply tenant filtering for tenant_admin
      if (admin.role === 'tenant_admin') {
        whereClause += ` AND al.tenant_type = $${paramIndex}`;
        params.push(admin.tenant_type);
        paramIndex++;
      } else if (tenant) {
        whereClause += ` AND al.tenant_type = $${paramIndex}`;
        params.push(tenant);
        paramIndex++;
      }
      
      // Add other filters
      if (userId) {
        whereClause += ` AND al.user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }
      
      if (actor) {
        whereClause += ` AND (u.email ILIKE $${paramIndex} OR al.user_id::text ILIKE $${paramIndex})`;
        params.push(`%${actor}%`);
        paramIndex++;
      }
      
      if (action) {
        whereClause += ` AND al.action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }
      
      if (resourceType) {
        whereClause += ` AND al.resource_type = $${paramIndex}`;
        params.push(resourceType);
        paramIndex++;
      }

      if (route) {
        whereClause += ` AND al.route ILIKE $${paramIndex}`;
        params.push(`%${route}%`);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND al.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (correlationId) {
        whereClause += ` AND al.correlation_id = $${paramIndex}`;
        params.push(correlationId);
        paramIndex++;
      }
      
      if (from) {
        whereClause += ` AND al.created_at >= $${paramIndex}`;
        params.push(from);
        paramIndex++;
      }
      
      if (to) {
        whereClause += ` AND al.created_at <= $${paramIndex}`;
        params.push(to);
        paramIndex++;
      }

      // Parse sort parameter
      let orderBy = 'al.created_at DESC';
      if (sort) {
        const [field, direction] = sort.split(':');
        const validFields = ['createdAt', 'userEmail', 'action', 'resourceType', 'status'];
        const validDirections = ['asc', 'desc'];
        
        if (validFields.includes(field) && validDirections.includes(direction)) {
          const dbFieldMap: Record<string, string> = {
            createdAt: 'al.created_at',
            userEmail: 'u.email',
            action: 'al.action',
            resourceType: 'al.resource_type',
            status: 'al.status'
          };
          const dbField = dbFieldMap[field] || 'al.created_at';
          orderBy = `${dbField} ${direction.toUpperCase()}`;
        }
      }
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        ${whereClause}
      `;
      
      const dataQuery = `
        SELECT 
          al.id, al.user_id, u.email as user_email,
          al.action, al.resource_type, al.resource_id,
          al.tenant_type, al.details, al.ip_address,
          al.user_agent, al.correlation_id, al.created_at,
          al.status, al.route, al.method
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        client.query(countQuery, params.slice(0, -2)), // Remove limit/offset for count
        client.query(dataQuery, params)
      ]);
      
      const logs: AuditLogEntry[] = dataResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        tenantType: row.tenant_type,
        details: row.details,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        correlationId: row.correlation_id,
        status: row.status,
        route: row.route,
        method: row.method,
        createdAt: row.created_at.toISOString()
      }));
      
      return { 
        logs, 
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      };
    } finally {
      client.release();
    }
  });

  // GET /api/admin/audit/logs/export - Export audit logs as CSV
  fastify.get('/admin/audit/logs/export', {
    preHandler: [requirePermission('admin:audit:read'), requireTenantScope()],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          tenant: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
          actor: { type: 'string' },
          action: { type: 'string' },
          resourceType: { type: 'string' },
          route: { type: 'string' },
          status: { type: 'string', enum: ['SUCCESS', 'DENIED', 'ERROR'] },
          correlationId: { type: 'string' },
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' }
        }
      }
    }
  }, async (request, reply) => {
    const { 
      tenant, 
      actor, 
      action, 
      resourceType, 
      route, 
      status, 
      correlationId, 
      from, 
      to 
    } = request.query as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    
    try {
      let whereClause = 'WHERE 1=1';
      let params: any[] = [];
      let paramIndex = 1;
      
      // Apply tenant filtering for tenant_admin
      if (admin.role === 'tenant_admin') {
        whereClause += ` AND al.tenant_type = $${paramIndex}`;
        params.push(admin.tenant_type);
        paramIndex++;
      } else if (tenant) {
        whereClause += ` AND al.tenant_type = $${paramIndex}`;
        params.push(tenant);
        paramIndex++;
      }
      
      // Add filters (same as regular endpoint)
      if (actor) {
        whereClause += ` AND (u.email ILIKE $${paramIndex} OR al.user_id::text ILIKE $${paramIndex})`;
        params.push(`%${actor}%`);
        paramIndex++;
      }
      
      if (action) {
        whereClause += ` AND al.action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }
      
      if (resourceType) {
        whereClause += ` AND al.resource_type = $${paramIndex}`;
        params.push(resourceType);
        paramIndex++;
      }

      if (route) {
        whereClause += ` AND al.route ILIKE $${paramIndex}`;
        params.push(`%${route}%`);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND al.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (correlationId) {
        whereClause += ` AND al.correlation_id = $${paramIndex}`;
        params.push(correlationId);
        paramIndex++;
      }
      
      if (from) {
        whereClause += ` AND al.created_at >= $${paramIndex}`;
        params.push(from);
        paramIndex++;
      }
      
      if (to) {
        whereClause += ` AND al.created_at <= $${paramIndex}`;
        params.push(to);
        paramIndex++;
      }
      
      const dataQuery = `
        SELECT 
          al.created_at,
          u.email as user_email,
          al.action,
          al.resource_type,
          al.resource_id,
          al.tenant_type,
          al.status,
          al.route,
          al.method,
          al.correlation_id,
          al.ip_address
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT 10000
      `;
      
      const result = await client.query(dataQuery, params);
      
      // Generate CSV
      const csvHeaders = [
        'Timestamp',
        'User Email',
        'Action',
        'Resource Type',
        'Resource ID', 
        'Tenant Type',
        'Status',
        'Route',
        'Method',
        'Correlation ID',
        'IP Address (Anonymized)'
      ];

      const anonymizeIP = (ip: string): string => {
        if (!ip) return '';
        if (ip.includes('.')) {
          const parts = ip.split('.');
          if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
          }
        }
        if (ip.includes(':')) {
          const parts = ip.split(':');
          if (parts.length >= 4) {
            return `${parts.slice(0, 4).join(':')}::xxxx`;
          }
        }
        return 'xxx.xxx.xxx.xxx';
      };

      const csvRows = result.rows.map(row => [
        row.created_at?.toISOString() || '',
        row.user_email || '',
        row.action || '',
        row.resource_type || '',
        row.resource_id || '',
        row.tenant_type || '',
        row.status || '',
        row.route || '',
        row.method || '',
        row.correlation_id || '',
        anonymizeIP(row.ip_address)
      ]);

      // Escape CSV values
      const escapeCsvValue = (value: string): string => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        csvHeaders.map(escapeCsvValue).join(','),
        ...csvRows.map(row => row.map(cell => escapeCsvValue(String(cell))).join(','))
      ].join('\n');

      // Set headers for file download
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      reply.header('Cache-Control', 'no-cache');
      
      return csvContent;
    } finally {
      client.release();
    }
  });

  // Role & Permission Management Endpoints

  // GET /api/admin/roles - List roles
  fastify.get('/admin/roles', {
    preHandler: [requirePermission('admin:roles:read'), requireTenantScope()]
  }, async (request, reply) => {
    const { tenant, limit = 20, offset = 0, search, scope, sort } = request.query as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    
    try {
      let query = `
        SELECT r.id, r.name, r.description, r.scope, r.tenant_type, 
               r.version, r.last_editor, r.updated_at, r.created_at,
               COALESCE(array_agg(rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL), '{}') as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      // Tenant admin can only see their tenant's roles and global roles
      if (admin.role === 'tenant_admin') {
        query += ` AND (r.scope = 'global' OR (r.scope = 'tenant' AND r.tenant_type = $${paramIndex}))`;
        params.push(admin.tenant_type);
        paramIndex++;
      }
      
      // Filter by search term
      if (search) {
        query += ` AND (r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      // Filter by scope
      if (scope && scope !== 'all') {
        query += ` AND r.scope = $${paramIndex}`;
        params.push(scope);
        paramIndex++;
      }
      
      // Filter by tenant type
      if (tenant && tenant !== 'all') {
        query += ` AND (r.scope = 'global' OR r.tenant_type = $${paramIndex})`;
        params.push(tenant);
        paramIndex++;
      }
      
      query += ` GROUP BY r.id, r.name, r.description, r.scope, r.tenant_type, r.version, r.last_editor, r.updated_at, r.created_at`;
      
      // Add sorting
      let orderBy = 'r.name ASC';
      if (sort) {
        const [field, direction] = sort.split(':');
        const validFields = ['name', 'scope', 'lastModified'];
        const validDirections = ['asc', 'desc'];
        
        if (validFields.includes(field) && validDirections.includes(direction)) {
          const dbFieldMap: Record<string, string> = {
            name: 'r.name',
            scope: 'r.scope',
            lastModified: 'r.updated_at'
          };
          orderBy = `${dbFieldMap[field]} ${direction.toUpperCase()}`;
        }
      }
      
      query += ` ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const result = await client.query(query, params);
      
      const roles = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        scope: row.scope,
        tenantType: row.tenant_type,
        permissions: row.permissions || [],
        version: row.version,
        lastEditor: row.last_editor,
        lastModified: row.updated_at.toISOString()
      }));
      
      return { roles };
    } finally {
      client.release();
    }
  });

  // GET /api/admin/permissions - List permissions
  fastify.get('/admin/permissions', {
    preHandler: [requirePermission('admin:roles:read')]
  }, async (request, reply) => {
    const client = await db.getClient();
    
    try {
      const result = await client.query(`
        SELECT id, name, category, description, is_system
        FROM permissions
        ORDER BY category, name
      `);
      
      const permissions = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        isSystem: row.is_system
      }));
      
      return { permissions };
    } finally {
      client.release();
    }
  });

  // POST /api/admin/roles - Create role
  fastify.post('/admin/roles', {
    preHandler: [requirePermission('admin:roles:write'), requireTenantScope()]
  }, async (request, reply) => {
    const { name, description, scope, tenantType, permissions, changeNotes } = request.body as any;
    const admin = request.admin!;
    
    // Validation
    if (admin.role === 'tenant_admin' && scope === 'global') {
      return reply.status(403).send({
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'Tenant administrators cannot create global roles',
        instance: request.url,
        correlationId: request.correlationId || 'unknown',
        code: 'GLOBAL_ROLE_DENIED'
      });
    }
    
    if (admin.role === 'tenant_admin' && scope === 'tenant' && tenantType !== admin.tenant_type) {
      return reply.status(403).send({
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: `Cannot create roles for ${tenantType} tenant`,
        instance: request.url,
        correlationId: request.correlationId || 'unknown',
        code: 'CROSS_TENANT_ROLE_DENIED'
      });
    }
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Check for duplicate name
      const existingRole = await client.query(`
        SELECT id FROM roles 
        WHERE name = $1 AND scope = $2 AND ($3::text IS NULL OR tenant_type = $3)
      `, [name, scope, tenantType]);
      
      if (existingRole.rows.length > 0) {
        await client.query('ROLLBACK');
        return reply.status(409).send({
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: 'A role with this name already exists in the specified scope',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'ROLE_NAME_CONFLICT'
        });
      }
      
      // Create role
      const roleResult = await client.query(`
        INSERT INTO roles (name, description, scope, tenant_type, version, last_editor, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 1, $5, NOW(), NOW())
        RETURNING id, version, created_at, updated_at
      `, [name, description, scope, tenantType, admin.email]);
      
      const roleId = roleResult.rows[0].id;
      
      // Add permissions
      if (permissions && permissions.length > 0) {
        for (const permissionId of permissions) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
          `, [roleId, permissionId]);
        }
      }
      
      await client.query('COMMIT');
      
      const newRole = {
        id: roleId,
        name,
        description,
        scope,
        tenantType,
        permissions,
        version: 1,
        lastEditor: admin.email,
        lastModified: roleResult.rows[0].updated_at.toISOString()
      };
      
      return reply.status(201).send(newRole);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  // PATCH /api/admin/roles/:id - Update role
  fastify.patch('/admin/roles/:id', {
    preHandler: [requirePermission('admin:roles:write'), requireTenantScope()]
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { name, description, permissions, changeNotes } = request.body as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get existing role
      const existingResult = await client.query(`
        SELECT * FROM roles WHERE id = $1
      `, [id]);
      
      if (existingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Role not found',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'ROLE_NOT_FOUND'
        });
      }
      
      const existingRole = existingResult.rows[0];
      
      // Check permissions for tenant admin
      if (admin.role === 'tenant_admin') {
        if (existingRole.scope === 'global' || 
           (existingRole.scope === 'tenant' && existingRole.tenant_type !== admin.tenant_type)) {
          await client.query('ROLLBACK');
          return reply.status(403).send({
            type: 'about:blank',
            title: 'Forbidden',
            status: 403,
            detail: 'Cannot modify this role',
            instance: request.url,
            correlationId: request.correlationId || 'unknown',
            code: 'ROLE_MODIFY_DENIED'
          });
        }
      }
      
      // Update role
      const updateResult = await client.query(`
        UPDATE roles 
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            version = version + 1,
            last_editor = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING version, updated_at
      `, [name, description, admin.email, id]);
      
      // Update permissions if provided
      if (permissions) {
        // Remove existing permissions
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
        
        // Add new permissions
        for (const permissionId of permissions) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
          `, [id, permissionId]);
        }
      }
      
      await client.query('COMMIT');
      
      const updatedRole = {
        ...existingRole,
        name: name || existingRole.name,
        description: description || existingRole.description,
        permissions: permissions || [],
        version: updateResult.rows[0].version,
        lastEditor: admin.email,
        lastModified: updateResult.rows[0].updated_at.toISOString()
      };
      
      return updatedRole;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  // DELETE /api/admin/roles/:id - Delete role
  fastify.delete('/admin/roles/:id', {
    preHandler: [requirePermission('admin:roles:write'), requireTenantScope()]
  }, async (request, reply) => {
    const { id } = request.params as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    
    try {
      // Check if role exists and permissions
      const roleResult = await client.query(`
        SELECT * FROM roles WHERE id = $1
      `, [id]);
      
      if (roleResult.rows.length === 0) {
        return reply.status(404).send({
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Role not found',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'ROLE_NOT_FOUND'
        });
      }
      
      const role = roleResult.rows[0];
      
      // Check permissions for tenant admin
      if (admin.role === 'tenant_admin') {
        if (role.scope === 'global' || 
           (role.scope === 'tenant' && role.tenant_type !== admin.tenant_type)) {
          return reply.status(403).send({
            type: 'about:blank',
            title: 'Forbidden',
            status: 403,
            detail: 'Cannot delete this role',
            instance: request.url,
            correlationId: request.correlationId || 'unknown',
            code: 'ROLE_DELETE_DENIED'
          });
        }
      }
      
      // Check if role is assigned to any users
      const assignmentResult = await client.query(`
        SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1
      `, [id]);
      
      if (parseInt(assignmentResult.rows[0].count) > 0) {
        return reply.status(409).send({
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: 'Cannot delete role that is assigned to users',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'ROLE_IN_USE'
        });
      }
      
      await client.query('BEGIN');
      
      // Delete role permissions
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      
      // Delete role
      await client.query('DELETE FROM roles WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      return reply.status(204).send();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  // POST /api/admin/roles/import - Import roles
  fastify.post('/admin/roles/import', {
    preHandler: [requirePermission('admin:roles:write'), requireTenantScope()]
  }, async (request, reply) => {
    const { roles, conflictResolution } = request.body as any;
    const admin = request.admin!;
    
    const client = await db.getClient();
    const importResults = {
      imported: 0,
      skipped: 0,
      conflicts: [] as string[],
      errors: [] as string[]
    };
    
    try {
      await client.query('BEGIN');
      
      for (const roleData of roles) {
        try {
          // Validate role permissions for tenant admin
          if (admin.role === 'tenant_admin') {
            if (roleData.scope === 'global') {
              importResults.errors.push(`Skipped "${roleData.name}": Tenant admin cannot import global roles`);
              continue;
            }
            if (roleData.scope === 'tenant' && roleData.tenantType !== admin.tenant_type) {
              importResults.errors.push(`Skipped "${roleData.name}": Cannot import role for different tenant type`);
              continue;
            }
          }
          
          // Check for existing role
          const existingResult = await client.query(`
            SELECT id, name FROM roles 
            WHERE name = $1 AND scope = $2 AND ($3::text IS NULL OR tenant_type = $3)
          `, [roleData.name, roleData.scope, roleData.tenantType]);
          
          if (existingResult.rows.length > 0) {
            if (conflictResolution === 'skip') {
              importResults.skipped++;
              continue;
            } else if (conflictResolution === 'rename') {
              // Find unique name
              let counter = 1;
              let newName = `${roleData.name} (${counter})`;
              while (true) {
                const checkResult = await client.query(`
                  SELECT id FROM roles 
                  WHERE name = $1 AND scope = $2 AND ($3::text IS NULL OR tenant_type = $3)
                `, [newName, roleData.scope, roleData.tenantType]);
                
                if (checkResult.rows.length === 0) break;
                counter++;
                newName = `${roleData.name} (${counter})`;
              }
              
              roleData.name = newName;
              importResults.conflicts.push(`Role "${roleData.name}" renamed to "${newName}"`);
            } else if (conflictResolution === 'overwrite') {
              // Delete existing role and permissions
              const existingId = existingResult.rows[0].id;
              await client.query('DELETE FROM role_permissions WHERE role_id = $1', [existingId]);
              await client.query('DELETE FROM roles WHERE id = $1', [existingId]);
              importResults.conflicts.push(`Role "${roleData.name}" overwritten`);
            }
          }
          
          // Create new role
          const roleResult = await client.query(`
            INSERT INTO roles (name, description, scope, tenant_type, version, last_editor, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 1, $5, NOW(), NOW())
            RETURNING id
          `, [roleData.name, roleData.description, roleData.scope, roleData.tenantType, admin.email]);
          
          const roleId = roleResult.rows[0].id;
          
          // Add permissions
          if (roleData.permissions && roleData.permissions.length > 0) {
            for (const permissionId of roleData.permissions) {
              try {
                await client.query(`
                  INSERT INTO role_permissions (role_id, permission_id)
                  VALUES ($1, $2)
                `, [roleId, permissionId]);
              } catch (permError) {
                importResults.errors.push(`Invalid permission "${permissionId}" in role "${roleData.name}"`);
              }
            }
          }
          
          importResults.imported++;
        } catch (roleError) {
          const errorMessage = roleError instanceof Error ? roleError.message : 'Unknown error';
          importResults.errors.push(`Failed to import role "${roleData.name}": ${errorMessage}`);
        }
      }
      
      await client.query('COMMIT');
      
      return importResults;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });
}