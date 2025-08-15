import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppealService, type AppealPacketRequest } from '../services/appeal-service.js';
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

  // Generate comprehensive appeal packet
  fastify.post('/appeal-packet/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['propertyId', 'approaches', 'reconciliation', 'narrativeSections'],
        properties: {
          propertyId: { type: 'string' },
          approaches: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['approach', 'indicatedValue', 'confidence', 'weight', 'completed', 'rationale'],
              properties: {
                approach: { type: 'string', enum: ['income', 'sales', 'cost'] },
                indicatedValue: { type: 'number', minimum: 0 },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                weight: { type: 'number', minimum: 0, maximum: 1 },
                completed: { type: 'boolean' },
                rationale: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          reconciliation: {
            type: 'object',
            required: ['finalValue', 'overallConfidence', 'recommendation', 'savingsEstimate'],
            properties: {
              finalValue: { type: 'number', minimum: 0 },
              overallConfidence: { type: 'number', minimum: 0, maximum: 1 },
              recommendation: { type: 'string', enum: ['APPEAL', 'MONITOR', 'NO_ACTION'] },
              savingsEstimate: { type: 'number', minimum: 0 }
            }
          },
          narrativeSections: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'title', 'content'],
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            packet_id: { type: 'string' },
            status: { type: 'string', enum: ['GENERATED', 'FAILED'] },
            download_url: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: AppealPacketRequest }>, reply: FastifyReply) => {
    try {
      const result = await appealService.generateComprehensivePacket(request.body);
      
      if (result.errors.length > 0) {
        fastify.log.warn('Appeal packet generation validation errors:', sanitizeForLogging(result.errors));
      }
      
      return reply.status(200).send(result);
      
    } catch (error) {
      fastify.log.error('Appeal packet generation failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Appeal Packet Generation Failed',
        status: 500,
        detail: 'An error occurred while generating the appeal packet',
        code: 'PACKET_GENERATION_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });

  // Get appeal packet status
  fastify.get('/appeal-packet/:packet_id/status', {
    schema: {
      params: {
        type: 'object',
        required: ['packet_id'],
        properties: {
          packet_id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            packet_id: { type: 'string' },
            property_id: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'READY', 'GENERATING', 'GENERATED', 'FAILED'] },
            created_at: { type: 'string' },
            completed_at: { type: 'string' },
            download_url: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { packet_id: string } }>, reply: FastifyReply) => {
    try {
      const packetId = request.params.packet_id;
      
      const status = await appealService.getPacketStatus(packetId);
      
      return reply.status(200).send(status);
      
    } catch (error) {
      fastify.log.error('Failed to get packet status:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Packet Status Retrieval Failed',
        status: 404,
        detail: 'Appeal packet not found or status could not be retrieved',
        code: 'PACKET_STATUS_ERROR'
      };
      
      return reply.status(404).send(apiError);
    }
  });

  // Update appeal packet status
  fastify.patch('/appeal-packet/:packet_id/status', {
    schema: {
      params: {
        type: 'object',
        required: ['packet_id'],
        properties: {
          packet_id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'READY', 'GENERATING', 'GENERATED', 'FAILED'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            packet_id: { type: 'string' },
            property_id: { type: 'string' },
            status: { type: 'string' },
            created_at: { type: 'string' },
            completed_at: { type: 'string' },
            download_url: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { packet_id: string }, 
    Body: { status: 'DRAFT' | 'READY' | 'GENERATING' | 'GENERATED' | 'FAILED' } 
  }>, reply: FastifyReply) => {
    try {
      const packetId = request.params.packet_id;
      const newStatus = request.body.status;
      
      const updatedStatus = await appealService.updatePacketStatus(packetId, newStatus);
      
      return reply.status(200).send(updatedStatus);
      
    } catch (error) {
      fastify.log.error('Failed to update packet status:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Packet Status Update Failed',
        status: 500,
        detail: 'An error occurred while updating the packet status',
        code: 'PACKET_STATUS_UPDATE_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });
}