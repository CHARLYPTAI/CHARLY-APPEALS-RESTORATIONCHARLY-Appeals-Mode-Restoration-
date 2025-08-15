import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppealService } from '../services/appeal-service.js';
import type { ApiError } from '../types/api.js';
import { validateUUID } from '../utils/validation.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';

export async function appealPacketRoutes(fastify: FastifyInstance) {
  const appealService = new AppealService();

  fastify.get('/appeal-packet/:workfile_id', {
    schema: {
      params: {
        type: 'object',
        required: ['workfile_id'],
        properties: {
          workfile_id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'string',
          format: 'binary'
        },
        404: {
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
    }
  }, async (request: FastifyRequest<{ Params: { workfile_id: string } }>, reply: FastifyReply) => {
    try {
      const workfileIdValidation = validateUUID(request.params.workfile_id, 'workfile_id');
      if (!workfileIdValidation.valid) {
        const apiError: ApiError = {
          type: 'about:blank',
          title: 'Invalid Request',
          status: 400,
          detail: workfileIdValidation.errors?.join(', ') || 'Invalid workfile ID format',
          code: 'INVALID_WORKFILE_ID'
        };
        return reply.status(400).send(apiError);
      }
      
      const pdfBuffer = await appealService.generateAppealPacket(workfileIdValidation.data!);
      
      reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="appeal-dossier-${workfileIdValidation.data}.pdf"`)
        .header('Cache-Control', 'private, no-cache')
        .send(pdfBuffer);
        
    } catch (error) {
      fastify.log.error('Appeal packet generation failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Appeal Packet Generation Failed',
        status: 404,
        detail: 'Workfile not found or appeal packet could not be generated',
        code: 'WORKFILE_NOT_FOUND'
      };
      
      return reply.status(404).send(apiError);
    }
  });
}