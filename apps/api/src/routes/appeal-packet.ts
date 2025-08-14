import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppealService } from '../services/appeal-service.js';
import type { ApiError } from '../types/api.js';

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
      const { workfile_id } = request.params;
      
      const pdfBuffer = await appealService.generateAppealPacket(workfile_id);
      
      reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="appeal-dossier-${workfile_id}.pdf"`)
        .header('Cache-Control', 'private, no-cache')
        .send(pdfBuffer);
        
    } catch (error) {
      fastify.log.error('Appeal packet generation failed:', error);
      
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