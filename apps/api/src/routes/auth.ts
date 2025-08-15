import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface AuthTokenPayload {
  sub: string;
  tenant_type: 'RESIDENTIAL' | 'COMMERCIAL';
  aud: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_type: 'RESIDENTIAL' | 'COMMERCIAL';
}

export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  tenant_type: 'RESIDENTIAL' | 'COMMERCIAL';
}

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'tenant_type'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      tenant_type: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] }
    }
  }
};

const tenantSpecificLoginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 }
    }
  }
};

const responseSchema = {
  200: {
    type: 'object',
    properties: {
      access_token: { type: 'string' },
      token_type: { type: 'string' },
      expires_in: { type: 'number' },
      tenant_type: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] }
    }
  },
  401: {
    type: 'object',
    properties: {
      type: { type: 'string' },
      title: { type: 'string' },
      status: { type: 'number' },
      detail: { type: 'string' },
      correlationId: { type: 'string' },
      code: { type: 'string' }
    }
  }
};

function createLoginHandler(fastify: FastifyInstance) {
  return async function loginHandler(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ): Promise<LoginResponse> {
    const { email, password, tenant_type } = request.body;
    
    // Mock auth for now - in production this would validate against real auth provider
    if (email === 'demo@example.com' && password === 'password123') {
      const audience = tenant_type === 'RESIDENTIAL' ? 'charly-residential' : 'charly-commercial';
      const expiresIn = 3600; // 1 hour
      
      const payload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
        sub: 'user-123',
        tenant_type,
        aud: audience
      };
      
      const token = fastify.jwt.sign(payload, { expiresIn });
      
      return {
        access_token: token,
        token_type: 'Bearer',
        expires_in: expiresIn,
        tenant_type
      };
    }
    
    const problemDetails = {
      type: 'about:blank',
      title: 'Authentication Failed',
      status: 401,
      detail: 'Invalid email or password',
      instance: request.url,
      correlationId: request.correlationId || 'unknown',
      code: 'INVALID_CREDENTIALS'
    };
    
    return reply.status(401).send(problemDetails);
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  const loginHandler = createLoginHandler(fastify);

  // Commercial login route
  fastify.post('/auth/commercial/login', {
    schema: {
      ...tenantSpecificLoginSchema,
      response: responseSchema
    }
  }, async (request: FastifyRequest<{ Body: Omit<LoginRequest, 'tenant_type'> }>, reply) => {
    const loginRequest: LoginRequest = {
      ...request.body,
      tenant_type: 'COMMERCIAL'
    };
    return loginHandler({ ...request, body: loginRequest } as any, reply);
  });

  // Residential login route
  fastify.post('/auth/residential/login', {
    schema: {
      ...tenantSpecificLoginSchema,
      response: responseSchema
    }
  }, async (request: FastifyRequest<{ Body: Omit<LoginRequest, 'tenant_type'> }>, reply) => {
    const loginRequest: LoginRequest = {
      ...request.body,
      tenant_type: 'RESIDENTIAL'
    };
    return loginHandler({ ...request, body: loginRequest } as any, reply);
  });

  // Token validation endpoint
  fastify.get('/auth/validate', async (request, reply) => {
    try {
      await request.jwtVerify();
      return { 
        valid: true, 
        user: request.user,
        tenant_type: (request.user as AuthTokenPayload).tenant_type
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
  });
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}