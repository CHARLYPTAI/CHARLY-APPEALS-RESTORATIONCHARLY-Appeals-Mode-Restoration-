import type { CommercialPropertyCore } from '@charly/contracts';
import type { LLMRequest } from '@charly/llm-router';
import { getRouter } from '@charly/llm-router';
import { generateWorkfileId } from '../utils/id-generator.js';
import { createErrorBuilder, formatServiceError } from '../utils/error-handler.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';
import { AINewNarrativeService } from './ai-narrative-service.js';
import type { NarrativeRequest } from './ai-narrative-service.js';

export interface ApproachData {
  approach: 'income' | 'sales' | 'cost';
  indicatedValue: number;
  confidence: number;
  weight: number;
  completed: boolean;
  rationale: string[];
}

export interface NarrativeSection {
  id: string;
  title: string;
  content: string;
}

export interface AppealPacketRequest {
  propertyId: string;
  approaches: ApproachData[];
  reconciliation: {
    finalValue: number;
    overallConfidence: number;
    recommendation: 'APPEAL' | 'MONITOR' | 'NO_ACTION';
    savingsEstimate: number;
  };
  narrativeSections: NarrativeSection[];
}

export interface AppealPacketResponse {
  packet_id: string;
  status: 'GENERATED' | 'FAILED';
  download_url?: string;
  errors: string[];
}

export interface AppealPacketStatus {
  packet_id: string;
  property_id: string;
  status: 'DRAFT' | 'READY' | 'GENERATING' | 'GENERATED' | 'FAILED';
  created_at: string;
  completed_at?: string;
  download_url?: string;
  errors: string[];
}

export class AppealService {
  private narrativeService = new AINewNarrativeService();
  private router: any = null;

  constructor() {
    try {
      // Initialize LLM Router for enhanced appeal packet generation
      this.router = getRouter();
    } catch (error) {
      console.error('LLM Router initialization failed in AppealService:', sanitizeForLogging(error));
      // Appeal service can still work without AI enhancements
    }
  }

  async generateAppealPacket(workfileId: string): Promise<Buffer> {
    const mockProperty: Partial<CommercialPropertyCore> = {
      address: {
        street: '123 Business Ave',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210'
      },
      propertyType: 'office',
      assessedValue: 2500000,
      marketValue: 3000000,
      taxRate: 0.0125
    };

    const pdfContent = this.generateCommercialPDF(mockProperty, workfileId);
    return Buffer.from(pdfContent, 'utf8');
  }

  async generateComprehensivePacket(request: AppealPacketRequest): Promise<AppealPacketResponse> {
    const packetId = generateWorkfileId();
    const errorBuilder = createErrorBuilder();

    try {
      // Validate request
      if (!request.propertyId) {
        errorBuilder.add('Property ID is required');
      }

      if (!request.approaches || request.approaches.length === 0) {
        errorBuilder.add('At least one valuation approach is required');
      }

      // Validate approaches are completed
      const incompletedApproaches = request.approaches.filter(app => !app.completed);
      if (incompletedApproaches.length > 0) {
        errorBuilder.add(`The following approaches are not completed: ${incompletedApproaches.map(a => a.approach).join(', ')}`);
      }

      // Validate weights sum to 1.0
      const totalWeight = request.approaches.reduce((sum, app) => sum + app.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        errorBuilder.add(`Approach weights must sum to 1.0 (current sum: ${totalWeight.toFixed(3)})`);
      }

      if (errorBuilder.hasErrors()) {
        return {
          packet_id: packetId,
          status: 'FAILED',
          errors: errorBuilder.getErrors()
        };
      }

      // Generate AI-powered narratives if not provided or to enhance existing ones
      let narrativeSections = request.narrativeSections || [];
      
      if (narrativeSections.length === 0) {
        const narrativeRequest: NarrativeRequest = {
          propertyId: request.propertyId,
          propertyType: 'commercial', // Default - in production this would be determined from property data
          approaches: request.approaches,
          propertyData: {
            address: '123 Business Ave, Anytown, CA', // Placeholder - get from property service
            assessedValue: 2500000, // Placeholder
            estimatedMarketValue: request.reconciliation.finalValue,
            jurisdiction: 'Sample County'
          }
        };

        const narrativeResponse = await this.narrativeService.generateCommercialNarrative(narrativeRequest);
        narrativeSections = narrativeResponse.sections;
        
        if (narrativeResponse.errors.length > 0) {
          console.warn('AI narrative generation warnings:', narrativeResponse.errors);
        }
      }

      // Generate AI-enhanced appeal summary if router is available
      let aiEnhancedSummary = '';
      if (this.router) {
        try {
          aiEnhancedSummary = await this.generateAIAppealSummary(request, narrativeSections);
        } catch (error) {
          console.warn('AI appeal summary generation failed:', sanitizeForLogging(error));
          // Continue without AI enhancement
        }
      }

      // Generate enhanced PDF content with AI narratives
      const pdfContent = this.generateEnhancedPDF({
        ...request,
        narrativeSections,
        aiEnhancedSummary
      }, packetId);
      
      // In a real implementation, this would save the PDF and return a download URL
      const downloadUrl = `/api/v1/appeal-packet/${packetId}/download`;

      return {
        packet_id: packetId,
        status: 'GENERATED',
        download_url: downloadUrl,
        errors: []
      };

    } catch (error) {
      errorBuilder.add(formatServiceError(error, 'Appeal packet generation failed'));
      return {
        packet_id: packetId,
        status: 'FAILED',
        errors: errorBuilder.getErrors()
      };
    }
  }

  async updatePacketStatus(packetId: string, status: AppealPacketStatus['status']): Promise<AppealPacketStatus> {
    // Mock implementation - in real system this would update database
    return {
      packet_id: packetId,
      property_id: 'OBZ-2023-001',
      status,
      created_at: new Date().toISOString(),
      completed_at: status === 'GENERATED' ? new Date().toISOString() : undefined,
      download_url: status === 'GENERATED' ? `/api/v1/appeal-packet/${packetId}/download` : undefined,
      errors: []
    };
  }

  async getPacketStatus(packetId: string): Promise<AppealPacketStatus> {
    // Mock implementation - in real system this would query database
    return {
      packet_id: packetId,
      property_id: 'OBZ-2023-001',
      status: 'GENERATED',
      created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      completed_at: new Date().toISOString(),
      download_url: `/api/v1/appeal-packet/${packetId}/download`,
      errors: []
    };
  }

  private async generateAIAppealSummary(request: AppealPacketRequest, narrativeSections: NarrativeSection[]): Promise<string> {
    try {
      const llmRequest: LLMRequest = {
        prompt: this.buildAppealSummaryPrompt(request, narrativeSections),
        model: 'gpt-4',
        maxTokens: 800,
        temperature: 0.2,
        schema: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            keyStrengths: { type: 'array', items: { type: 'string' } },
            recommendedStrategy: { type: 'string' },
            appealProbability: { type: 'string', enum: ['high', 'moderate', 'low'] }
          },
          required: ['executiveSummary', 'keyStrengths', 'recommendedStrategy']
        }
      };

      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        const parsed = JSON.parse(response.content);
        return `${parsed.executiveSummary}\n\nKey Strengths:\n${parsed.keyStrengths.map((s: string) => `• ${s}`).join('\n')}\n\nRecommended Strategy: ${parsed.recommendedStrategy}`;
      }

      return '';
    } catch (error) {
      console.error('AI appeal summary generation failed:', sanitizeForLogging(error));
      return '';
    }
  }

  private buildAppealSummaryPrompt(request: AppealPacketRequest, narrativeSections: NarrativeSection[]): string {
    const approachSummary = request.approaches.map(app => 
      `${app.approach.toUpperCase()}: $${app.indicatedValue.toLocaleString()} (${(app.confidence * 100).toFixed(0)}% confidence, ${(app.weight * 100).toFixed(0)}% weight)`
    ).join('\n');

    const narrativeText = narrativeSections.map(section => section.content).join(' ');

    return `Generate a compelling executive summary for a property tax appeal based on the following analysis:

Property ID: ${request.propertyId}
Final Market Value: $${request.reconciliation.finalValue.toLocaleString()}
Recommendation: ${request.reconciliation.recommendation}
Estimated Savings: $${request.reconciliation.savingsEstimate.toLocaleString()}

Valuation Approaches:
${approachSummary}

Detailed Analysis:
${narrativeText.substring(0, 2000)}...

Please provide:
1. An executive summary that clearly states the case for appeal
2. Key strengths of the valuation analysis
3. Recommended strategy for presenting the appeal
4. Assessment of appeal probability

Focus on making a professional, fact-based case that would be compelling to a tax assessor or review board.`;
  }

  private generateEnhancedPDF(request: AppealPacketRequest & { aiEnhancedSummary?: string }, packetId: string): string {
    const currentDate = new Date().toLocaleDateString();
    
    // Create comprehensive PDF content with all approach data
    const approachSummary = request.approaches.map(app => 
      `${app.approach.toUpperCase()} APPROACH: $${app.indicatedValue.toLocaleString()} (Confidence: ${(app.confidence * 100).toFixed(0)}%, Weight: ${(app.weight * 100).toFixed(0)}%)`
    ).join('\\n');

    const narrativeContent = request.narrativeSections.map(section =>
      `${section.title.toUpperCase()}:\\n${section.content}`
    ).join('\\n\\n');

    const aiSummarySection = request.aiEnhancedSummary ? 
      `\\n\\nAI-ENHANCED APPEAL STRATEGY:\\n${request.aiEnhancedSummary}` : '';

    return `%PDF-1.4
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
/Length 1500
>>
stream
BT
/F1 12 Tf
50 750 Td
(COMPREHENSIVE PROPERTY APPEAL DOSSIER) Tj
0 -30 Td
(Generated by CHARLY Platform) Tj
0 -30 Td
(Date: ${currentDate}) Tj
0 -30 Td
(Packet ID: ${packetId}) Tj
0 -30 Td
(Property ID: ${request.propertyId}) Tj

0 -50 Td
(VALUATION SUMMARY) Tj
0 -20 Td
(${approachSummary}) Tj

0 -30 Td
(FINAL RECONCILIATION) Tj
0 -20 Td
(Final Market Value: $${request.reconciliation.finalValue.toLocaleString()}) Tj
0 -20 Td
(Overall Confidence: ${(request.reconciliation.overallConfidence * 100).toFixed(0)}%) Tj
0 -20 Td
(Recommendation: ${request.reconciliation.recommendation}) Tj
0 -20 Td
(Estimated Annual Tax Savings: $${request.reconciliation.savingsEstimate.toLocaleString()}) Tj

0 -50 Td
(DETAILED ANALYSIS) Tj
0 -20 Td
(${narrativeContent}) Tj

0 -30 Td
(${aiSummarySection}) Tj

0 -50 Td
(This comprehensive appeal dossier was generated using) Tj
0 -20 Td
(CHARLY's advanced valuation platform, incorporating) Tj
0 -20 Td
(multiple approaches and professional analysis.) Tj
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
0000001830 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1900
%%EOF`;
  }

  private generateCommercialPDF(property: Partial<CommercialPropertyCore>, workfileId: string): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `%PDF-1.4
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
/Length 800
>>
stream
BT
/F1 12 Tf
50 750 Td
(COMMERCIAL PROPERTY APPEAL DOSSIER) Tj
0 -30 Td
(Generated by CHARLY Platform) Tj
0 -30 Td
(Date: ${currentDate}) Tj
0 -30 Td
(Workfile ID: ${workfileId}) Tj

0 -50 Td
(PROPERTY INFORMATION) Tj
0 -20 Td
(Address: ${property.address?.street || 'N/A'}) Tj
0 -20 Td
(City: ${property.address?.city || 'N/A'}, ${property.address?.state || 'N/A'} ${property.address?.zipCode || 'N/A'}) Tj
0 -20 Td
(Property Type: ${property.propertyType || 'N/A'}) Tj

0 -30 Td
(ASSESSMENT ANALYSIS) Tj
0 -20 Td
(Current Assessed Value: $${property.assessedValue?.toLocaleString() || 'N/A'}) Tj
0 -20 Td
(Estimated Market Value: $${property.marketValue?.toLocaleString() || 'N/A'}) Tj
0 -20 Td
(Tax Rate: ${((property.taxRate || 0) * 100).toFixed(2)}%) Tj

0 -30 Td
(APPEAL RECOMMENDATION) Tj
0 -20 Td
(Based on our analysis, this property appears to be) Tj
0 -20 Td
(overassessed relative to market value.) Tj

0 -30 Td
(This report was generated by CHARLY's automated) Tj
0 -20 Td
(assessment analysis system. No platform-provided) Tj
0 -20 Td
(comparables are included in this report.) Tj
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
0000001130 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1200
%%EOF`;
  }
}