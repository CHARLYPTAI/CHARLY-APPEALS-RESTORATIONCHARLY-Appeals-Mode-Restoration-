import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';

interface SecurityHeadersOptions {
  csp?: string;
  hsts?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

async function securityHeadersPlugin(
  fastify: FastifyInstance,
  options: SecurityHeadersOptions = {}
) {
  const {
    csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';",
    hsts = 'max-age=31536000; includeSubDomains',
    referrerPolicy = 'strict-origin-when-cross-origin',
    permissionsPolicy = 'camera=(), microphone=(), geolocation=(), payment=()'
  } = options;

  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('Content-Security-Policy', csp);
    reply.header('Strict-Transport-Security', hsts);
    reply.header('Referrer-Policy', referrerPolicy);
    reply.header('Permissions-Policy', permissionsPolicy);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
  });
}

export default fp(securityHeadersPlugin, {
  name: 'security-headers'
});