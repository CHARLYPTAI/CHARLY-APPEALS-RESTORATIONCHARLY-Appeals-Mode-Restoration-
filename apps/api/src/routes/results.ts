import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ApiError } from '../types/api.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';
import { generateWorkfileId } from '../utils/id-generator.js';

export interface ExportRequest {
  format: 'pdf' | 'csv';
  filters?: {
    jurisdiction?: string;
    status?: string;
    valueThreshold?: number;
  };
  propertyIds?: string[];
}

export interface ExportResponse {
  export_id: string;
  download_url: string;
  format: string;
  expires_at: string;
}

export async function resultsRoutes(fastify: FastifyInstance) {
  
  // Get results with filtering and pagination
  fastify.get('/results', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          jurisdiction: { type: 'string' },
          status: { type: 'string' },
          valueThreshold: { type: 'number', minimum: 0 },
          sortBy: { type: 'string', enum: ['name', 'assessedValue', 'variance', 'lastModified'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            properties: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'integer' },
                totalPages: { type: 'integer' },
                totalItems: { type: 'integer' },
                itemsPerPage: { type: 'integer' }
              }
            },
            availableJurisdictions: { type: 'array', items: { type: 'string' } },
            availableStatuses: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Querystring: {
      page?: number;
      limit?: number;
      jurisdiction?: string;
      status?: string;
      valueThreshold?: number;
      sortBy?: string;
      sortOrder?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const {
        page = 1,
        limit = 20,
        jurisdiction,
        status,
        valueThreshold = 0,
        sortBy = 'lastModified',
        sortOrder = 'desc'
      } = request.query;

      // Mock implementation - in production this would query a database
      const mockData = {
        properties: [
          {
            id: 'OBZ-2023-001',
            name: 'Office Building Z',
            address: '1250 Business Park Drive',
            city: 'Austin',
            state: 'TX',
            jurisdiction: 'Travis County',
            assessedValue: 2800000,
            indicatedValue: 3050000,
            variance: -250000,
            status: 'PACKET_GENERATED',
            confidence: 0.83,
            lastModified: '2024-01-15T10:30:00Z',
            packetId: 'packet-123'
          },
          {
            id: 'ABC-2023-002',
            name: 'ABC Company Office Complex',
            address: '4500 Technology Way',
            city: 'Austin',
            state: 'TX',
            jurisdiction: 'Travis County',
            assessedValue: 1850000,
            indicatedValue: 1844660,
            variance: 5340,
            status: 'READY',
            confidence: 0.82,
            lastModified: '2024-01-10T14:20:00Z'
          }
        ],
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(2 / limit),
          totalItems: 2,
          itemsPerPage: limit
        },
        availableJurisdictions: ['All Jurisdictions', 'Travis County', 'Williamson County'],
        availableStatuses: ['All Statuses', 'DRAFT', 'READY', 'PACKET_GENERATED', 'SUBMITTED', 'COMPLETED']
      };

      return reply.status(200).send(mockData);
      
    } catch (error) {
      fastify.log.error('Failed to get results:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Results Retrieval Failed',
        status: 500,
        detail: 'An error occurred while retrieving results data',
        code: 'RESULTS_RETRIEVAL_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });

  // Export results
  fastify.post('/results/export', {
    schema: {
      body: {
        type: 'object',
        required: ['format'],
        properties: {
          format: { type: 'string', enum: ['pdf', 'csv'] },
          filters: {
            type: 'object',
            properties: {
              jurisdiction: { type: 'string' },
              status: { type: 'string' },
              valueThreshold: { type: 'number', minimum: 0 }
            }
          },
          propertyIds: { type: 'array', items: { type: 'string' } }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            export_id: { type: 'string' },
            download_url: { type: 'string' },
            format: { type: 'string' },
            expires_at: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: ExportRequest }>, reply: FastifyReply) => {
    try {
      const { format, filters, propertyIds } = request.body;
      
      // Generate export
      const exportId = generateWorkfileId();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry
      
      const exportResponse: ExportResponse = {
        export_id: exportId,
        download_url: `/api/v1/results/export/${exportId}/download`,
        format,
        expires_at: expiresAt.toISOString()
      };

      // In production, this would:
      // 1. Queue an export job
      // 2. Process the data with filters
      // 3. Generate the file (PDF/CSV)
      // 4. Store it temporarily
      // 5. Return download URL
      
      fastify.log.info('Export initiated', {
        exportId,
        format,
        filters: sanitizeForLogging(filters),
        propertyCount: propertyIds?.length || 'all'
      });
      
      return reply.status(200).send(exportResponse);
      
    } catch (error) {
      fastify.log.error('Export initiation failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Export Failed',
        status: 500,
        detail: 'An error occurred while initiating the export',
        code: 'EXPORT_INITIATION_ERROR'
      };
      
      return reply.status(500).send(apiError);
    }
  });

  // Download export
  fastify.get('/results/export/:export_id/download', {
    schema: {
      params: {
        type: 'object',
        required: ['export_id'],
        properties: {
          export_id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { export_id: string } }>, reply: FastifyReply) => {
    try {
      const exportId = request.params.export_id;
      
      // Mock CSV content
      const csvContent = `Property Name,Address,City,State,Jurisdiction,Assessed Value,Indicated Value,Variance,Status,Confidence,Last Modified
Office Building Z,"1250 Business Park Drive",Austin,TX,Travis County,$2800000,$3050000,-$250000,PACKET_GENERATED,83%,2024-01-15
ABC Company Office Complex,"4500 Technology Way",Austin,TX,Travis County,$1850000,$1844660,$5340,READY,82%,2024-01-10`;

      // Mock PDF content
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font << /F1 5 0 R >>
>>
>>
endobj

4 0 obj
<<
/Length 400
>>
stream
BT
/F1 12 Tf
50 750 Td
(RESULTS EXPORT REPORT) Tj
0 -30 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
0 -30 Td
(Export ID: ${exportId}) Tj

0 -50 Td
(PROPERTY RESULTS SUMMARY) Tj
0 -20 Td
(Office Building Z - Travis County) Tj
0 -20 Td
(Assessed: $2,800,000 | Indicated: $3,050,000) Tj
0 -20 Td
(Variance: -$250,000 (Overassessed)) Tj

0 -30 Td
(ABC Company Office Complex - Travis County) Tj
0 -20 Td
(Assessed: $1,850,000 | Indicated: $1,844,660) Tj
0 -20 Td
(Variance: $5,340 (Slightly Overassessed)) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000279 00000 n 
0000000730 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
800
%%EOF`;

      // Determine content type and filename based on export format
      const contentType = exportId.endsWith('csv') || request.query.format === 'csv' 
        ? 'text/csv' 
        : 'application/pdf';
      
      const filename = exportId.endsWith('csv') || request.query.format === 'csv'
        ? `results-export-${exportId}.csv`
        : `results-export-${exportId}.pdf`;
      
      const content = contentType === 'text/csv' ? csvContent : pdfContent;
      
      reply
        .header('Content-Type', contentType)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Cache-Control', 'private, no-cache')
        .send(content);
        
    } catch (error) {
      fastify.log.error('Export download failed:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Export Download Failed',
        status: 404,
        detail: 'Export file not found or has expired',
        code: 'EXPORT_NOT_FOUND'
      };
      
      return reply.status(404).send(apiError);
    }
  });

  // Get export status
  fastify.get('/results/export/:export_id/status', {
    schema: {
      params: {
        type: 'object',
        required: ['export_id'],
        properties: {
          export_id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            export_id: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
            format: { type: 'string' },
            created_at: { type: 'string' },
            completed_at: { type: 'string' },
            download_url: { type: 'string' },
            expires_at: { type: 'string' },
            error_message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { export_id: string } }>, reply: FastifyReply) => {
    try {
      const exportId = request.params.export_id;
      
      // Mock export status - in production this would check job status
      const status = {
        export_id: exportId,
        status: 'COMPLETED' as const,
        format: 'csv',
        created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        completed_at: new Date().toISOString(),
        download_url: `/api/v1/results/export/${exportId}/download`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };
      
      return reply.status(200).send(status);
      
    } catch (error) {
      fastify.log.error('Failed to get export status:', sanitizeForLogging(error));
      
      const apiError: ApiError = {
        type: 'about:blank',
        title: 'Export Status Retrieval Failed',
        status: 404,
        detail: 'Export not found',
        code: 'EXPORT_STATUS_ERROR'
      };
      
      return reply.status(404).send(apiError);
    }
  });
}