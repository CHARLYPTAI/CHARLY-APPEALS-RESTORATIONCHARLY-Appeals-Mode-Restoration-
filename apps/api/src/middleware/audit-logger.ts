import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/connection.js';
import type { AuthTokenPayload } from '../routes/auth.js';

export interface AuditLogData {
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'permission_denied';
  resourceType: string;
  resourceId?: string;
  tenantType?: 'RESIDENTIAL' | 'COMMERCIAL';
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    const client = await db.getClient();
    
    try {
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id,
          tenant_type, details, ip_address, user_agent, correlation_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        data.userId,
        data.action,
        data.resourceType,
        data.resourceId,
        data.tenantType,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress,
        data.userAgent,
        data.correlationId
      ]);
    } catch (error) {
      // Log audit failures but don't fail the request
      console.error('Audit logging failed:', error);
    } finally {
      client.release();
    }
  }

  static async logFromRequest(
    request: FastifyRequest,
    action: AuditLogData['action'],
    resourceType: string,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    try {
      const user = request.user as AuthTokenPayload;
      const tenantContext = request.tenant;
      
      if (!user) {
        return; // No user context, can't audit
      }
      
      const auditData: AuditLogData = {
        userId: user.sub,
        action,
        resourceType,
        resourceId,
        tenantType: tenantContext?.tenantType || user.tenant_type,
        details,
        ipAddress: this.getClientIP(request),
        userAgent: request.headers['user-agent'],
        correlationId: request.correlationId
      };
      
      await this.log(auditData);
    } catch (error) {
      console.error('Request audit logging failed:', error);
    }
  }

  private static getClientIP(request: FastifyRequest): string | undefined {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket?.remoteAddress
    );
  }
}

export function createAuditMiddleware(
  action: AuditLogData['action'],
  resourceType: string,
  getResourceId?: (request: FastifyRequest) => string | undefined,
  getDetails?: (request: FastifyRequest) => any
) {
  return async function auditMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const resourceId = getResourceId ? getResourceId(request) : undefined;
    const details = getDetails ? getDetails(request) : undefined;
    
    await AuditLogger.logFromRequest(request, action, resourceType, resourceId, details);
  };
}

// Pre-configured audit middleware for common admin actions
export const auditUserRead = createAuditMiddleware('read', 'user');
export const auditUserCreate = createAuditMiddleware(
  'create', 
  'user',
  undefined,
  (req) => ({ email: (req.body as any)?.email })
);
export const auditUserUpdate = createAuditMiddleware(
  'update',
  'user', 
  (req) => (req.params as any)?.id,
  (req) => ({ changes: req.body })
);
export const auditTemplateRead = createAuditMiddleware('read', 'rule_template');
export const auditTemplateCreate = createAuditMiddleware(
  'create',
  'rule_template',
  undefined,
  (req) => ({ name: (req.body as any)?.name })
);
export const auditTemplateImport = createAuditMiddleware(
  'create',
  'rule_template_import',
  undefined,
  (req) => ({ 
    templateCount: (req.body as any)?.templates?.length,
    conflictResolution: (req.body as any)?.conflictResolution
  })
);

// Hook-based audit logging for automatic capture
export function registerAuditHooks(fastify: FastifyInstance) {
  // Log permission denied attempts
  fastify.addHook('onError', async (request, reply, error) => {
    if (reply.statusCode === 403 && request.user) {
      await AuditLogger.logFromRequest(
        request,
        'permission_denied',
        'endpoint',
        request.url,
        { 
          error: error.message,
          statusCode: reply.statusCode,
          method: request.method
        }
      );
    }
  });

  // Log successful admin actions on admin routes
  fastify.addHook('onResponse', async (request, reply) => {
    if (request.url.startsWith('/admin/') && reply.statusCode < 400 && request.user) {
      const method = request.method.toLowerCase();
      const url = request.url;
      
      // Determine action based on HTTP method
      let action: AuditLogData['action'] = 'read';
      if (method === 'post') action = 'create';
      else if (method === 'put' || method === 'patch') action = 'update';
      else if (method === 'delete') action = 'delete';
      
      // Determine resource type from URL
      let resourceType = 'unknown';
      if (url.includes('/users')) resourceType = 'user';
      else if (url.includes('/templates')) resourceType = 'rule_template';
      else if (url.includes('/tenants')) resourceType = 'tenant';
      else if (url.includes('/audit')) resourceType = 'audit_log';
      
      await AuditLogger.logFromRequest(
        request,
        action,
        resourceType,
        undefined,
        {
          endpoint: url,
          method: request.method,
          statusCode: reply.statusCode,
          responseTime: reply.getResponseTime()
        }
      );
    }
  });

  // Log authentication events
  fastify.addHook('onResponse', async (request, reply) => {
    if (request.url.includes('/auth/') && reply.statusCode < 400) {
      const user = request.user as AuthTokenPayload;
      if (user && request.url.includes('/login')) {
        await AuditLogger.log({
          userId: user.sub,
          action: 'login',
          resourceType: 'auth',
          tenantType: user.tenant_type,
          ipAddress: AuditLogger['getClientIP'](request),
          userAgent: request.headers['user-agent'],
          correlationId: request.correlationId,
          details: {
            loginType: user.tenant_type.toLowerCase(),
            endpoint: request.url
          }
        });
      }
    }
  });
}