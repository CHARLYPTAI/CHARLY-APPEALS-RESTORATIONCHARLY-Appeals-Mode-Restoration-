import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthTokenPayload } from '../routes/auth.js';
import { db, TenantClient } from '../db/connection.js';

export interface TenantContext {
  tenantType: 'RESIDENTIAL' | 'COMMERCIAL';
  userId: string;
  audience: string;
  getDbClient: () => Promise<TenantClient>;
}

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantContext;
  }
}

export function createTenantMiddleware(requiredTenant?: 'RESIDENTIAL' | 'COMMERCIAL') {
  return async function tenantAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Verify JWT token first
      await request.jwtVerify();
      
      const payload = request.user as AuthTokenPayload;
      
      // Validate tenant type if required
      if (requiredTenant && payload.tenant_type !== requiredTenant) {
        const problemDetails = {
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          detail: `Access denied. Route requires ${requiredTenant} tenant access.`,
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'TENANT_ACCESS_DENIED'
        };
        
        return reply.status(403).send(problemDetails);
      }
      
      // Validate audience for additional security
      const expectedAudience = payload.tenant_type === 'RESIDENTIAL' 
        ? 'charly-residential' 
        : 'charly-commercial';
      
      if (payload.aud !== expectedAudience) {
        const problemDetails = {
          type: 'about:blank',
          title: 'Forbidden', 
          status: 403,
          detail: 'Invalid token audience for tenant type',
          instance: request.url,
          correlationId: request.correlationId || 'unknown',
          code: 'INVALID_AUDIENCE'
        };
        
        return reply.status(403).send(problemDetails);
      }
      
      // Add tenant context to request with database client factory
      request.tenant = {
        tenantType: payload.tenant_type,
        userId: payload.sub,
        audience: payload.aud,
        getDbClient: () => db.getTenantClient(payload.tenant_type, payload.sub)
      };
      
    } catch (error) {
      const problemDetails = {
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid or missing authentication token',
        instance: request.url,
        correlationId: request.correlationId || 'unknown',
        code: 'AUTHENTICATION_REQUIRED'
      };
      
      return reply.status(401).send(problemDetails);
    }
  };
}

// Pre-configured middleware for each tenant type
export const requireCommercialTenant = createTenantMiddleware('COMMERCIAL');
export const requireResidentialTenant = createTenantMiddleware('RESIDENTIAL');
export const requireAnyTenant = createTenantMiddleware();