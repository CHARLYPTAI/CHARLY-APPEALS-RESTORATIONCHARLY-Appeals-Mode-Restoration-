import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UploadService } from '../services/upload-service.js';
import type { ApiError } from '../types/api.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';

export async function uploadsRoutes(fastify: FastifyInstance) {
  const uploadService = new UploadService();

  fastify.post('/uploads', {
    schema: {
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            upload_id: { type: 'string' },
            signed_urls: { type: 'array', items: { type: 'string' } },
            pipeline: {
              type: 'object',
              properties: {
                av: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
                exif: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
                ocr: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'number' },
            detail: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      const rateLimitKey = request.headers['x-api-key'] || request.ip;
      request.rateLimit = { remaining: 100 };
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        const error: ApiError = {
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'No file provided in request',
          code: 'MISSING_FILE'
        };
        return reply.status(400).send(error);
      }

      const buffer = await data.file.toBuffer();
      const result = await uploadService.processUpload(
        data.filename,
        data.mimetype,
        buffer
      );

      reply.header('X-RateLimit-Remaining', '99');
      return result;
      
    } catch (error) {
      fastify.log.error('Upload failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Upload Failed',
        status: 422,
        detail: error instanceof Error ? error.message : 'Unknown error',
        code: 'UPLOAD_PROCESSING_ERROR'
      };
      
      return reply.status(422).send(apiError);
    }
  });
}