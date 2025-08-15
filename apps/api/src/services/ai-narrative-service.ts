import type { LLMRequest } from '@charly/llm-router';
import { getRouter } from '@charly/llm-router';
import { createErrorBuilder, formatServiceError } from '../utils/error-handler.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';
import type { ApproachData } from './appeal-service.js';

export interface NarrativeRequest {
  propertyId: string;
  propertyType: 'commercial' | 'residential';
  approaches: ApproachData[];
  propertyData: {
    address: string;
    assessedValue: number;
    estimatedMarketValue: number;
    jurisdiction: string;
  };
}

export interface NarrativeSection {
  id: string;
  title: string;
  content: string;
  approach?: 'income' | 'sales' | 'cost' | 'summary';
}

export interface NarrativeResponse {
  sections: NarrativeSection[];
  errors: string[];
  requestId?: string;
}

export class AINewNarrativeService {
  private router: any = null;
  
  constructor() {
    try {
      // Use the centralized LLM Router with all security features
      this.router = getRouter();
    } catch (error) {
      console.error('LLM Router initialization failed:', sanitizeForLogging(error));
      throw new Error('AI Narrative Service requires LLM Router to be available');
    }
  }

  async generateCommercialNarrative(request: NarrativeRequest): Promise<NarrativeResponse> {
    const errorBuilder = createErrorBuilder();
    
    try {
      if (request.propertyType !== 'commercial') {
        errorBuilder.add('Commercial narrative service only handles commercial properties');
      }

      if (!request.approaches || request.approaches.length === 0) {
        errorBuilder.add('At least one valuation approach is required for narrative generation');
      }

      if (errorBuilder.hasErrors()) {
        return {
          sections: [],
          errors: errorBuilder.getErrors()
        };
      }

      const sections: NarrativeSection[] = [];

      // Generate approach-specific narratives
      for (const approach of request.approaches) {
        if (approach.completed) {
          const narrativeSection = await this.generateApproachNarrative(request, approach);
          if (narrativeSection) {
            sections.push(narrativeSection);
          }
        }
      }

      // Generate executive summary
      const summarySection = await this.generateExecutiveSummary(request, request.approaches);
      if (summarySection) {
        sections.push(summarySection);
      }

      return {
        sections,
        errors: errorBuilder.getErrors()
      };

    } catch (error) {
      errorBuilder.add(formatServiceError(error, 'Commercial narrative generation failed'));
      return {
        sections: [],
        errors: errorBuilder.getErrors()
      };
    }
  }

  async generateResidentialNarrative(request: NarrativeRequest): Promise<NarrativeResponse> {
    const errorBuilder = createErrorBuilder();
    
    try {
      if (request.propertyType !== 'residential') {
        errorBuilder.add('Residential narrative service only handles residential properties');
      }

      // Residential properties can use multiple approaches
      const completedApproaches = request.approaches.filter(a => a.completed);
      if (completedApproaches.length === 0) {
        errorBuilder.add('Residential properties require at least one completed valuation approach');
      }

      if (errorBuilder.hasErrors()) {
        return {
          sections: [],
          errors: errorBuilder.getErrors()
        };
      }

      const sections: NarrativeSection[] = [];

      // Generate approach-specific narratives
      for (const approach of completedApproaches) {
        let narrativeSection: NarrativeSection | null = null;
        
        switch (approach.approach) {
          case 'sales':
            narrativeSection = await this.generateResidentialSalesNarrative(request, approach);
            break;
          case 'income':
            // For rental residential properties
            narrativeSection = await this.generateResidentialIncomeNarrative(request, approach);
            break;
          case 'cost':
            // For newer residential properties or when improvements are significant
            narrativeSection = await this.generateResidentialCostNarrative(request, approach);
            break;
        }
        
        if (narrativeSection) {
          sections.push(narrativeSection);
        }
      }

      // Generate residential summary
      const summarySection = await this.generateResidentialSummary(request);
      if (summarySection) {
        sections.push(summarySection);
      }

      return {
        sections,
        errors: errorBuilder.getErrors()
      };

    } catch (error) {
      errorBuilder.add(formatServiceError(error, 'Residential narrative generation failed'));
      return {
        sections: [],
        errors: errorBuilder.getErrors()
      };
    }
  }

  private async generateApproachNarrative(request: NarrativeRequest, approach: ApproachData): Promise<NarrativeSection | null> {
    try {
      const llmRequest: LLMRequest = {
        prompt: this.buildApproachPrompt(request, approach),
        model: 'gpt-4',
        maxTokens: 800,
        temperature: 0.3,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            keyPoints: { type: 'array', items: { type: 'string' } }
          },
          required: ['title', 'content']
        }
      };

      if (!this.router) {
        throw new Error('LLM Router not available - ensure router is properly initialized');
      }
      
      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        const parsed = JSON.parse(response.content);
        return {
          id: `narrative-${approach.approach}-${Date.now()}`,
          title: parsed.title || `${approach.approach.toUpperCase()} Approach Analysis`,
          content: parsed.content || 'Analysis content could not be generated.',
          approach: approach.approach
        };
      }

      // Fallback if AI fails
      return this.generateFallbackNarrative(approach);

    } catch (error) {
      console.error(`Approach narrative generation failed for ${approach.approach}:`, sanitizeForLogging(error));
      return this.generateFallbackNarrative(approach);
    }
  }

  private async generateExecutiveSummary(request: NarrativeRequest, approaches: ApproachData[]): Promise<NarrativeSection | null> {
    try {
      const completedApproaches = approaches.filter(a => a.completed);
      const weightedValue = completedApproaches.reduce((sum, a) => sum + (a.indicatedValue * a.weight), 0);

      const llmRequest: LLMRequest = {
        prompt: this.buildSummaryPrompt(request, completedApproaches, weightedValue),
        model: 'gpt-4',
        maxTokens: 600,
        temperature: 0.2,
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            recommendation: { type: 'string', enum: ['APPEAL', 'MONITOR', 'NO_ACTION'] },
            confidence: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['content', 'recommendation']
        }
      };

      if (!this.router) {
        throw new Error('LLM Router not available - ensure router is properly initialized');
      }
      
      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        const parsed = JSON.parse(response.content);
        return {
          id: `narrative-summary-${Date.now()}`,
          title: 'Executive Summary',
          content: parsed.content || 'Executive summary could not be generated.',
          approach: 'summary'
        };
      }

      return this.generateFallbackSummary(request, weightedValue);

    } catch (error) {
      console.error('Executive summary generation failed:', sanitizeForLogging(error));
      return this.generateFallbackSummary(request, weightedValue);
    }
  }

  private async generateResidentialSalesNarrative(request: NarrativeRequest, salesApproach: ApproachData): Promise<NarrativeSection | null> {
    try {
      const llmRequest: LLMRequest = {
        prompt: this.buildResidentialSalesPrompt(request, salesApproach),
        model: 'gpt-3.5-turbo',
        maxTokens: 600,
        temperature: 0.3,
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            marketAnalysis: { type: 'string' },
            appealStrength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
          },
          required: ['content']
        }
      };

      if (!this.router) {
        throw new Error('LLM Router not available - ensure router is properly initialized');
      }
      
      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        const parsed = JSON.parse(response.content);
        return {
          id: `narrative-residential-sales-${Date.now()}`,
          title: 'Market Value Analysis',
          content: parsed.content || 'Sales analysis could not be generated.',
          approach: 'sales'
        };
      }

      return this.generateResidentialFallback(request, salesApproach);

    } catch (error) {
      console.error('Residential sales narrative generation failed:', sanitizeForLogging(error));
      return this.generateResidentialFallback(request, salesApproach);
    }
  }

  private async generateResidentialSummary(request: NarrativeRequest): Promise<NarrativeSection | null> {
    const salesApproach = request.approaches.find(a => a.approach === 'sales');
    if (!salesApproach) return null;

    const assessmentRatio = request.propertyData.assessedValue / salesApproach.indicatedValue;
    const overassessment = assessmentRatio > 1.0;
    
    return {
      id: `narrative-residential-summary-${Date.now()}`,
      title: 'Appeal Recommendation',
      content: `Based on our market analysis, the property at ${request.propertyData.address} has an estimated market value of $${salesApproach.indicatedValue.toLocaleString()}. The current assessed value is $${request.propertyData.assessedValue.toLocaleString()}, representing ${overassessment ? 'an overassessment' : 'an underassessment'} of ${Math.abs((assessmentRatio - 1) * 100).toFixed(1)}%. ${overassessment ? 'We recommend proceeding with a formal appeal to achieve tax savings.' : 'The current assessment appears reasonable relative to market value.'}`,
      approach: 'summary'
    };
  }

  private async generateResidentialIncomeNarrative(request: NarrativeRequest, incomeApproach: ApproachData): Promise<NarrativeSection | null> {
    try {
      const llmRequest: LLMRequest = {
        prompt: this.buildResidentialIncomePrompt(request, incomeApproach),
        model: 'gpt-3.5-turbo',
        maxTokens: 600,
        temperature: 0.3,
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            rentalAnalysis: { type: 'string' },
            marketComparison: { type: 'string' }
          },
          required: ['content']
        }
      };

      if (!this.router) {
        throw new Error('LLM Router not available - ensure router is properly initialized');
      }
      
      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        const parsed = JSON.parse(response.content);
        return {
          id: `narrative-residential-income-${Date.now()}`,
          title: 'Income Approach Analysis',
          content: parsed.content || 'Income analysis could not be generated.',
          approach: 'income'
        };
      }

      return this.generateResidentialFallback(request, incomeApproach);

    } catch (error) {
      console.error('Residential income narrative generation failed:', error);
      return this.generateResidentialFallback(request, incomeApproach);
    }
  }

  private async generateResidentialCostNarrative(request: NarrativeRequest, costApproach: ApproachData): Promise<NarrativeSection | null> {
    try {
      const llmRequest: LLMRequest = {
        prompt: this.buildResidentialCostPrompt(request, costApproach),
        model: 'gpt-3.5-turbo',
        maxTokens: 600,
        temperature: 0.3,
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            costAnalysis: { type: 'string' },
            depreciationFactors: { type: 'string' }
          },
          required: ['content']
        }
      };

      if (!this.router) {
        throw new Error('LLM Router not available - ensure router is properly initialized');
      }
      
      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        const parsed = JSON.parse(response.content);
        return {
          id: `narrative-residential-cost-${Date.now()}`,
          title: 'Cost Approach Analysis',
          content: parsed.content || 'Cost analysis could not be generated.',
          approach: 'cost'
        };
      }

      return this.generateResidentialFallback(request, costApproach);

    } catch (error) {
      console.error('Residential cost narrative generation failed:', error);
      return this.generateResidentialFallback(request, costApproach);
    }
  }

  private buildApproachPrompt(request: NarrativeRequest, approach: ApproachData): string {
    return `Generate a professional narrative for a commercial property tax appeal using the ${approach.approach} approach.

Property Details:
- Address: ${request.propertyData.address}
- Current Assessed Value: $${request.propertyData.assessedValue.toLocaleString()}
- Jurisdiction: ${request.propertyData.jurisdiction}

${approach.approach.toUpperCase()} Approach Results:
- Indicated Value: $${approach.indicatedValue.toLocaleString()}
- Confidence Level: ${(approach.confidence * 100).toFixed(0)}%
- Analysis Weight: ${(approach.weight * 100).toFixed(0)}%

Key rationale points:
${approach.rationale.map(r => `- ${r}`).join('\n')}

Please provide a detailed narrative that:
1. Explains the methodology used in the ${approach.approach} approach
2. Discusses the key factors that influenced the valuation
3. Addresses any limitations or considerations
4. Supports the indicated value with professional reasoning

Return the response as JSON with "title" and "content" fields. The content should be professional, factual, and suitable for a formal property tax appeal document.`;
  }

  private buildSummaryPrompt(request: NarrativeRequest, approaches: ApproachData[], weightedValue: number): string {
    const approachSummary = approaches.map(a => 
      `${a.approach.toUpperCase()}: $${a.indicatedValue.toLocaleString()} (Weight: ${(a.weight * 100).toFixed(0)}%, Confidence: ${(a.confidence * 100).toFixed(0)}%)`
    ).join('\n');

    return `Generate an executive summary for a commercial property tax appeal.

Property: ${request.propertyData.address}
Current Assessed Value: $${request.propertyData.assessedValue.toLocaleString()}
Jurisdiction: ${request.propertyData.jurisdiction}

Valuation Approaches:
${approachSummary}

Weighted Final Value: $${Math.round(weightedValue).toLocaleString()}

Please provide an executive summary that:
1. Synthesizes all valuation approaches
2. Explains the reconciliation methodology
3. Provides a clear recommendation (APPEAL, MONITOR, or NO_ACTION)
4. Estimates potential tax savings if applicable
5. Addresses the strength of the appeal case

Return as JSON with "content", "recommendation", and optional "confidence" fields.`;
  }

  private buildResidentialSalesPrompt(request: NarrativeRequest, salesApproach: ApproachData): string {
    return `Generate a market analysis narrative for a residential property tax appeal.

Property: ${request.propertyData.address}
Current Assessed Value: $${request.propertyData.assessedValue.toLocaleString()}
Sales Comparison Indicated Value: $${salesApproach.indicatedValue.toLocaleString()}
Confidence: ${(salesApproach.confidence * 100).toFixed(0)}%

Analysis factors:
${salesApproach.rationale.map(r => `- ${r}`).join('\n')}

Please provide a narrative that:
1. Explains how comparable sales were selected and analyzed
2. Discusses market conditions and trends
3. Justifies any adjustments made to comparables
4. Concludes with the market value opinion

Return as JSON with "content" field containing the narrative.`;
  }

  private buildResidentialIncomePrompt(request: NarrativeRequest, incomeApproach: ApproachData): string {
    return `Generate an income approach analysis narrative for a residential rental property tax appeal.

Property: ${request.propertyData.address}
Current Assessed Value: $${request.propertyData.assessedValue.toLocaleString()}
Income Approach Indicated Value: $${incomeApproach.indicatedValue.toLocaleString()}
Confidence: ${(incomeApproach.confidence * 100).toFixed(0)}%

Analysis factors:
${incomeApproach.rationale.map(r => `- ${r}`).join('\n')}

Please provide a narrative that:
1. Explains the rental income analysis methodology
2. Discusses market rents and vacancy factors for residential properties
3. Details operating expenses typical for residential rental properties
4. Justifies the capitalization rate used
5. Concludes with the income approach value opinion

Focus on residential rental property considerations such as market rent comparisons, typical residential operating expenses (property taxes, insurance, maintenance, property management), and residential cap rates.

Return as JSON with "content" field containing the narrative.`;
  }

  private buildResidentialCostPrompt(request: NarrativeRequest, costApproach: ApproachData): string {
    return `Generate a cost approach analysis narrative for a residential property tax appeal.

Property: ${request.propertyData.address}
Current Assessed Value: $${request.propertyData.assessedValue.toLocaleString()}
Cost Approach Indicated Value: $${costApproach.indicatedValue.toLocaleString()}
Confidence: ${(costApproach.confidence * 100).toFixed(0)}%

Analysis factors:
${costApproach.rationale.map(r => `- ${r}`).join('\n')}

Please provide a narrative that:
1. Explains how replacement cost was estimated for the residential property
2. Discusses land value estimation methods for residential sites
3. Details depreciation factors affecting residential properties (physical, functional, external)
4. Addresses any unique characteristics of the home
5. Concludes with the cost approach value opinion

Focus on residential property considerations such as home construction costs, residential land values, typical home depreciation patterns, and neighborhood factors affecting residential values.

Return as JSON with "content" field containing the narrative.`;
  }

  private generateFallbackNarrative(approach: ApproachData): NarrativeSection {
    return {
      id: `narrative-fallback-${approach.approach}-${Date.now()}`,
      title: `${approach.approach.toUpperCase()} Approach Analysis`,
      content: `Our analysis using the ${approach.approach} approach indicates a value of $${approach.indicatedValue.toLocaleString()} with ${(approach.confidence * 100).toFixed(0)}% confidence. This approach was weighted at ${(approach.weight * 100).toFixed(0)}% in our overall valuation analysis. ${approach.rationale.join(' ')}`,
      approach: approach.approach
    };
  }

  private generateFallbackSummary(request: NarrativeRequest, weightedValue: number): NarrativeSection {
    const assessmentRatio = request.propertyData.assessedValue / weightedValue;
    const overassessed = assessmentRatio > 1.0;
    
    return {
      id: `narrative-fallback-summary-${Date.now()}`,
      title: 'Executive Summary',
      content: `Based on our comprehensive valuation analysis, the property at ${request.propertyData.address} has an estimated market value of $${Math.round(weightedValue).toLocaleString()}. The current assessed value of $${request.propertyData.assessedValue.toLocaleString()} ${overassessed ? 'exceeds' : 'is below'} our market value estimate by ${Math.abs((assessmentRatio - 1) * 100).toFixed(1)}%. ${overassessed ? 'We recommend proceeding with a formal appeal.' : 'The current assessment appears reasonable.'}`,
      approach: 'summary'
    };
  }

  private generateResidentialFallback(request: NarrativeRequest, salesApproach: ApproachData): NarrativeSection {
    return {
      id: `narrative-residential-fallback-${Date.now()}`,
      title: 'Market Value Analysis',
      content: `Based on sales comparison analysis, the market value for ${request.propertyData.address} is estimated at $${salesApproach.indicatedValue.toLocaleString()}. This conclusion is supported by analysis of comparable sales in the area with ${(salesApproach.confidence * 100).toFixed(0)}% confidence. ${salesApproach.rationale.join(' ')}`,
      approach: 'sales'
    };
  }
}