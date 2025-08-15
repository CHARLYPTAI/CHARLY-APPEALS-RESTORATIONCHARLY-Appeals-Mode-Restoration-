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
      action: { type: 'string' },
      resourceType: { type: 'string' },
      from: { type: 'string', format: 'date-time' },
      to: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<TenantInfo[]> => {
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
  }, async (request: FastifyRequest<{
    Querystring: { 
      tenant?: 'RESIDENTIAL' | 'COMMERCIAL'; 
      limit?: number; 
      offset?: number;
      search?: string;
      role?: string;
      status?: 'active' | 'inactive';
      sort?: string;
    }
  }>, reply: FastifyReply) => {
    const { tenant, limit = 20, offset = 0, search, role, status, sort } = request.query;
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
      
      if (status && status !== 'ALL') {
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
          const dbField = {
            email: 'u.email',
            tenantType: 'u.tenant_type',
            role: 'ra.role',
            createdAt: 'u.created_at',
            lastLogin: 'u.updated_at',
            isActive: 'u.created_at' // Placeholder since we don't have is_active column yet
          }[field] || 'u.created_at';
          
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
  }, async (request: FastifyRequest<{ Body: CreateUserRequest }>, reply: FastifyReply) => {
    const { email, password, tenantType, role } = request.body;
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
  }, async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    const { id } = request.params;
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
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: UpdateUserRequest;
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { role, isActive } = request.body;
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
  }, async (request: FastifyRequest<{
    Querystring: { tenant?: 'RESIDENTIAL' | 'COMMERCIAL'; limit?: number; offset?: number; }
  }>, reply: FastifyReply) => {
    const { tenant, limit = 20, offset = 0 } = request.query;
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
      
      const templates: RuleTemplate[] = result.rows.map(row => ({
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
  }, async (request: FastifyRequest<{ Body: ImportTemplatesRequest }>, reply: FastifyReply) => {
    const { templates, conflictResolution } = request.body;
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
  }, async (request: FastifyRequest<{
    Querystring: {
      tenant?: 'RESIDENTIAL' | 'COMMERCIAL';
      userId?: string;
      action?: string;
      resourceType?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    }
  }>, reply: FastifyReply) => {
    const { tenant, userId, action, resourceType, from, to, limit = 50, offset = 0 } = request.query;
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
      
      params.push(limit, offset);
      
      const result = await client.query(`
        SELECT 
          al.id, al.user_id, u.email as user_email,
          al.action, al.resource_type, al.resource_id,
          al.tenant_type, al.details, al.ip_address,
          al.user_agent, al.correlation_id, al.created_at
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, params);
      
      const logs: AuditLogEntry[] = result.rows.map(row => ({
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
        createdAt: row.created_at.toISOString()
      }));
      
      return { logs };
    } finally {
      client.release();
    }
  });
}