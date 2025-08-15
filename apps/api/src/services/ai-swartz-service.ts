import type { LLMRequest } from '@charly/llm-router';
import { getRouter } from '@charly/llm-router';
import { createErrorBuilder, formatServiceError } from '../utils/error-handler.js';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';

export interface SwartzDocument {
  id: string;
  filename: string;
  type: 'income_statement' | 'rent_roll' | 'profit_loss' | 'cash_flow' | 'other';
  content: string;
  uploadDate: string;
}

export interface SwartzParseRequest {
  propertyId: string;
  documents: SwartzDocument[];
  approach: 'income' | 'sales' | 'cost';
  targetYear?: number;
}

export interface IncomeApproachData {
  grossRentalIncome: number;
  vacancyRate: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  capRate: number;
  indicatedValue: number;
  confidence: number;
  methodology: 'direct_cap' | 'discounted_cash_flow' | 'gross_rent_multiplier';
}

export interface SalesCompData {
  comparables: Array<{
    address: string;
    saleDate: string;
    salePrice: number;
    pricePerSF: number;
    adjustments: number;
    adjustedPrice: number;
    similarity: number;
  }>;
  indicatedValue: number;
  confidence: number;
}

export interface CostApproachDataParsed {
  landValue: number;
  improvementCost: number;
  depreciation: {
    physical: number;
    functional: number;
    external: number;
    total: number;
  };
  indicatedValue: number;
  confidence: number;
}

export interface SwartzParseResponse {
  requestId: string;
  approach: 'income' | 'sales' | 'cost';
  incomeData?: IncomeApproachData;
  salesData?: SalesCompData;
  costData?: CostApproachDataParsed;
  extractedFields: Record<string, any>;
  confidence: number;
  warnings: string[];
  errors: string[];
}

export class AISwartzService {
  private router: any = null;
  
  constructor() {
    try {
      // Use the centralized LLM Router with all security features
      this.router = getRouter();
    } catch (error) {
      console.error('LLM Router initialization failed:', sanitizeForLogging(error));
      throw new Error('AI SWARTZ Service requires LLM Router to be available');
    }
  }

  async parseIncomeApproach(request: SwartzParseRequest): Promise<SwartzParseResponse> {
    const errorBuilder = createErrorBuilder();
    const requestId = `swartz-income-${Date.now()}`;
    
    try {
      if (request.approach !== 'income') {
        errorBuilder.add('This method only handles income approach parsing');
      }

      const incomeDocuments = request.documents.filter(doc => 
        ['income_statement', 'profit_loss', 'rent_roll', 'cash_flow'].includes(doc.type)
      );

      if (incomeDocuments.length === 0) {
        errorBuilder.add('No income-related documents found for parsing');
      }

      if (errorBuilder.hasErrors()) {
        return {
          requestId,
          approach: 'income',
          extractedFields: {},
          confidence: 0,
          warnings: [],
          errors: errorBuilder.getErrors()
        };
      }

      // Parse each document using AI
      const parseResults = await Promise.all(
        incomeDocuments.map(doc => this.parseIncomeDocument(doc, request.targetYear || new Date().getFullYear()))
      );

      // Consolidate results
      const consolidatedData = await this.consolidateIncomeData(parseResults, requestId);
      
      return {
        requestId,
        approach: 'income',
        incomeData: consolidatedData,
        extractedFields: this.extractIncomeFields(parseResults),
        confidence: consolidatedData.confidence,
        warnings: this.generateIncomeWarnings(consolidatedData, parseResults),
        errors: errorBuilder.getErrors()
      };

    } catch (error) {
      errorBuilder.add(formatServiceError(error, 'Income approach SWARTZ parsing failed'));
      return {
        requestId,
        approach: 'income',
        extractedFields: {},
        confidence: 0,
        warnings: [],
        errors: errorBuilder.getErrors()
      };
    }
  }

  async parseSalesComparison(request: SwartzParseRequest): Promise<SwartzParseResponse> {
    const errorBuilder = createErrorBuilder();
    const requestId = `swartz-sales-${Date.now()}`;
    
    try {
      if (request.approach !== 'sales') {
        errorBuilder.add('This method only handles sales comparison parsing');
      }

      // For sales approach, we expect documents containing comparable sales data
      const salesDocuments = request.documents.filter(doc => 
        doc.content.toLowerCase().includes('sale') || 
        doc.content.toLowerCase().includes('comparable') ||
        doc.content.toLowerCase().includes('market')
      );

      if (salesDocuments.length === 0) {
        errorBuilder.add('No sales-related documents found for parsing');
      }

      if (errorBuilder.hasErrors()) {
        return {
          requestId,
          approach: 'sales',
          extractedFields: {},
          confidence: 0,
          warnings: [],
          errors: errorBuilder.getErrors()
        };
      }

      const parseResults = await Promise.all(
        salesDocuments.map(doc => this.parseSalesDocument(doc))
      );

      const consolidatedData = await this.consolidateSalesData(parseResults, requestId);
      
      return {
        requestId,
        approach: 'sales',
        salesData: consolidatedData,
        extractedFields: this.extractSalesFields(parseResults),
        confidence: consolidatedData.confidence,
        warnings: this.generateSalesWarnings(consolidatedData),
        errors: errorBuilder.getErrors()
      };

    } catch (error) {
      errorBuilder.add(formatServiceError(error, 'Sales comparison SWARTZ parsing failed'));
      return {
        requestId,
        approach: 'sales',
        extractedFields: {},
        confidence: 0,
        warnings: [],
        errors: errorBuilder.getErrors()
      };
    }
  }

  async parseCostApproach(request: SwartzParseRequest): Promise<SwartzParseResponse> {
    const errorBuilder = createErrorBuilder();
    const requestId = `swartz-cost-${Date.now()}`;
    
    try {
      if (request.approach !== 'cost') {
        errorBuilder.add('This method only handles cost approach parsing');
      }

      const costDocuments = request.documents.filter(doc => 
        doc.content.toLowerCase().includes('cost') || 
        doc.content.toLowerCase().includes('replacement') ||
        doc.content.toLowerCase().includes('depreciation') ||
        doc.content.toLowerCase().includes('land value')
      );

      if (costDocuments.length === 0) {
        errorBuilder.add('No cost-related documents found for parsing');
      }

      if (errorBuilder.hasErrors()) {
        return {
          requestId,
          approach: 'cost',
          extractedFields: {},
          confidence: 0,
          warnings: [],
          errors: errorBuilder.getErrors()
        };
      }

      const parseResults = await Promise.all(
        costDocuments.map(doc => this.parseCostDocument(doc))
      );

      const consolidatedData = await this.consolidateCostData(parseResults, requestId);
      
      return {
        requestId,
        approach: 'cost',
        costData: consolidatedData,
        extractedFields: this.extractCostFields(parseResults),
        confidence: consolidatedData.confidence,
        warnings: this.generateCostWarnings(consolidatedData),
        errors: errorBuilder.getErrors()
      };

    } catch (error) {
      errorBuilder.add(formatServiceError(error, 'Cost approach SWARTZ parsing failed'));
      return {
        requestId,
        approach: 'cost',
        extractedFields: {},
        confidence: 0,
        warnings: [],
        errors: errorBuilder.getErrors()
      };
    }
  }

  private async parseIncomeDocument(document: SwartzDocument, targetYear: number): Promise<any> {
    try {
      const llmRequest: LLMRequest = {
        prompt: this.buildIncomeParsingPrompt(document, targetYear),
        model: 'gpt-4',
        maxTokens: 1200,
        temperature: 0.1, // Low temperature for precise extraction
        schema: {
          type: 'object',
          properties: {
            grossRentalIncome: { type: 'number', minimum: 0 },
            vacancyRate: { type: 'number', minimum: 0, maximum: 1 },
            effectiveGrossIncome: { type: 'number', minimum: 0 },
            operatingExpenses: { type: 'number', minimum: 0 },
            netOperatingIncome: { type: 'number' },
            extractedFields: { type: 'object' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            warnings: { type: 'array', items: { type: 'string' } }
          },
          required: ['grossRentalIncome', 'operatingExpenses', 'netOperatingIncome', 'confidence']
        }
      };

      if (!this.router) {
        throw new Error('LLM Router not available - ensure router is properly initialized');
      }
      
      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        return JSON.parse(response.content);
      }

      return this.createFallbackIncomeData(document);

    } catch (error) {
      console.error(`Income document parsing failed for ${document.filename}:`, sanitizeForLogging(error));
      return this.createFallbackIncomeData(document);
    }
  }

  private async parseSalesDocument(document: SwartzDocument): Promise<any> {
    try {
      const llmRequest: LLMRequest = {
        prompt: this.buildSalesParsingPrompt(document),
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.1,
        schema: {
          type: 'object',
          properties: {
            comparables: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  address: { type: 'string' },
                  saleDate: { type: 'string' },
                  salePrice: { type: 'number', minimum: 0 },
                  pricePerSF: { type: 'number', minimum: 0 },
                  adjustments: { type: 'number' },
                  similarity: { type: 'number', minimum: 0, maximum: 1 }
                },
                required: ['address', 'saleDate', 'salePrice']
              }
            },
            extractedFields: { type: 'object' },
            confidence: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['comparables', 'confidence']
        }
      };

      if (!this.router) {
        throw new Error('LLM Router not available - ensure router is properly initialized');
      }
      
      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        return JSON.parse(response.content);
      }

      return this.createFallbackSalesData(document);

    } catch (error) {
      console.error(`Sales document parsing failed for ${document.filename}:`, sanitizeForLogging(error));
      return this.createFallbackSalesData(document);
    }
  }

  private async parseCostDocument(document: SwartzDocument): Promise<any> {
    try {
      const llmRequest: LLMRequest = {
        prompt: this.buildCostParsingPrompt(document),
        model: 'gpt-4',
        maxTokens: 800,
        temperature: 0.1,
        schema: {
          type: 'object',
          properties: {
            landValue: { type: 'number', minimum: 0 },
            improvementCost: { type: 'number', minimum: 0 },
            physicalDepreciation: { type: 'number', minimum: 0 },
            functionalObsolescence: { type: 'number', minimum: 0 },
            externalObsolescence: { type: 'number', minimum: 0 },
            extractedFields: { type: 'object' },
            confidence: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['landValue', 'improvementCost', 'confidence']
        }
      };

      if (!this.router) {
        throw new Error('LLM Router not available - ensure router is properly initialized');
      }
      
      const response = await this.router.generateCompletion(llmRequest);
      
      if (response.validated && response.content) {
        return JSON.parse(response.content);
      }

      return this.createFallbackCostData(document);

    } catch (error) {
      console.error(`Cost document parsing failed for ${document.filename}:`, sanitizeForLogging(error));
      return this.createFallbackCostData(document);
    }
  }

  private buildIncomeParsingPrompt(document: SwartzDocument, targetYear: number): string {
    return `Extract financial data from this ${document.type} document for income approach valuation.

Document: ${document.filename}
Target Year: ${targetYear}

Document Content:
${document.content}

Please extract the following financial data:
1. Gross Rental Income (annual)
2. Vacancy Rate (as decimal, e.g., 0.05 for 5%)
3. Effective Gross Income (gross income - vacancy)
4. Operating Expenses (annual total)
5. Net Operating Income (effective gross income - operating expenses)

Focus on data for ${targetYear} if available, otherwise use the most recent complete year.

Return as JSON with numeric values and confidence score (0-1). Include any warnings about data quality or assumptions made.`;
  }

  private buildSalesParsingPrompt(document: SwartzDocument): string {
    return `Extract comparable sales data from this document for sales comparison analysis.

Document: ${document.filename}

Document Content:
${document.content}

Please extract information about comparable property sales including:
1. Property addresses
2. Sale dates
3. Sale prices
4. Price per square foot (if available)
5. Any adjustments mentioned
6. Similarity factors to subject property

Return as JSON with an array of comparables and confidence score. Focus on recent sales (within last 2 years preferred).`;
  }

  private buildCostParsingPrompt(document: SwartzDocument): string {
    return `Extract cost approach data from this document for property valuation.

Document: ${document.filename}

Document Content:
${document.content}

Please extract:
1. Land Value (if separately stated)
2. Improvement/Replacement Cost
3. Physical Depreciation (wear and tear)
4. Functional Obsolescence (design issues)
5. External Obsolescence (location/market factors)

Return as JSON with numeric values and confidence score. Note any assumptions or calculations made.`;
  }

  private async consolidateIncomeData(parseResults: any[], requestId: string): Promise<IncomeApproachData> {
    // Simple averaging for now - in production this would be more sophisticated
    const validResults = parseResults.filter(r => r.confidence > 0.3);
    
    if (validResults.length === 0) {
      return this.createDefaultIncomeData();
    }

    const avg = (field: string) => {
      const values = validResults.map(r => r[field]).filter(v => typeof v === 'number' && v > 0);
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    };

    const grossRentalIncome = avg('grossRentalIncome');
    const vacancyRate = avg('vacancyRate') || 0.05; // Default 5% vacancy
    const operatingExpenses = avg('operatingExpenses');
    const effectiveGrossIncome = grossRentalIncome * (1 - vacancyRate);
    const netOperatingIncome = effectiveGrossIncome - operatingExpenses;
    
    // Estimate cap rate (in production, this would come from market data)
    const capRate = 0.075; // Default 7.5%
    const indicatedValue = netOperatingIncome / capRate;
    
    const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;

    return {
      grossRentalIncome: Math.round(grossRentalIncome),
      vacancyRate,
      effectiveGrossIncome: Math.round(effectiveGrossIncome),
      operatingExpenses: Math.round(operatingExpenses),
      netOperatingIncome: Math.round(netOperatingIncome),
      capRate,
      indicatedValue: Math.round(indicatedValue),
      confidence: Math.min(avgConfidence, 0.9),
      methodology: 'direct_cap'
    };
  }

  private async consolidateSalesData(parseResults: any[], requestId: string): Promise<SalesCompData> {
    const allComparables = parseResults.flatMap(r => r.comparables || []);
    
    if (allComparables.length === 0) {
      return this.createDefaultSalesData();
    }

    // Calculate weighted average
    const weightedPrice = allComparables.reduce((sum, comp) => {
      const weight = comp.similarity || 0.5;
      return sum + (comp.adjustedPrice || comp.salePrice) * weight;
    }, 0);

    const totalWeight = allComparables.reduce((sum, comp) => sum + (comp.similarity || 0.5), 0);
    const indicatedValue = totalWeight > 0 ? weightedPrice / totalWeight : 0;
    
    const avgConfidence = parseResults.reduce((sum, r) => sum + r.confidence, 0) / parseResults.length;

    return {
      comparables: allComparables.slice(0, 5), // Keep top 5
      indicatedValue: Math.round(indicatedValue),
      confidence: Math.min(avgConfidence, 0.9)
    };
  }

  private async consolidateCostData(parseResults: any[], requestId: string): Promise<CostApproachDataParsed> {
    const validResults = parseResults.filter(r => r.confidence > 0.3);
    
    if (validResults.length === 0) {
      return this.createDefaultCostData();
    }

    const avg = (field: string) => {
      const values = validResults.map(r => r[field]).filter(v => typeof v === 'number' && v >= 0);
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    };

    const landValue = avg('landValue');
    const improvementCost = avg('improvementCost');
    const physicalDep = avg('physicalDepreciation');
    const functionalObs = avg('functionalObsolescence');
    const externalObs = avg('externalObsolescence');
    
    const totalDepreciation = physicalDep + functionalObs + externalObs;
    const indicatedValue = landValue + (improvementCost - totalDepreciation);
    
    const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;

    return {
      landValue: Math.round(landValue),
      improvementCost: Math.round(improvementCost),
      depreciation: {
        physical: Math.round(physicalDep),
        functional: Math.round(functionalObs),
        external: Math.round(externalObs),
        total: Math.round(totalDepreciation)
      },
      indicatedValue: Math.round(indicatedValue),
      confidence: Math.min(avgConfidence, 0.9)
    };
  }

  private extractIncomeFields(parseResults: any[]): Record<string, any> {
    const fields: Record<string, any> = {};
    parseResults.forEach(result => {
      if (result.extractedFields) {
        Object.assign(fields, result.extractedFields);
      }
    });
    return fields;
  }

  private extractSalesFields(parseResults: any[]): Record<string, any> {
    return this.extractIncomeFields(parseResults); // Same logic
  }

  private extractCostFields(parseResults: any[]): Record<string, any> {
    return this.extractIncomeFields(parseResults); // Same logic
  }

  private generateIncomeWarnings(data: IncomeApproachData, parseResults: any[]): string[] {
    const warnings: string[] = [];
    
    if (data.confidence < 0.7) {
      warnings.push('Low confidence in extracted financial data - manual review recommended');
    }
    
    if (data.vacancyRate === 0.05) {
      warnings.push('Default vacancy rate (5%) applied - actual vacancy data not found');
    }
    
    if (data.netOperatingIncome <= 0) {
      warnings.push('Negative or zero NOI calculated - check operating expenses');
    }
    
    return warnings;
  }

  private generateSalesWarnings(data: SalesCompData): string[] {
    const warnings: string[] = [];
    
    if (data.comparables.length < 3) {
      warnings.push('Limited comparable sales data - consider additional market research');
    }
    
    if (data.confidence < 0.7) {
      warnings.push('Low confidence in sales comparison analysis');
    }
    
    return warnings;
  }

  private generateCostWarnings(data: CostApproachDataParsed): string[] {
    const warnings: string[] = [];
    
    if (data.landValue === 0) {
      warnings.push('Land value not extracted - may need separate land valuation');
    }
    
    if (data.depreciation.total / data.improvementCost > 0.8) {
      warnings.push('High depreciation rate detected - verify accuracy');
    }
    
    return warnings;
  }

  private createFallbackIncomeData(document: SwartzDocument): any {
    return {
      grossRentalIncome: 0,
      vacancyRate: 0.05,
      effectiveGrossIncome: 0,
      operatingExpenses: 0,
      netOperatingIncome: 0,
      extractedFields: { source: document.filename },
      confidence: 0.1,
      warnings: ['AI parsing failed - manual review required']
    };
  }

  private createFallbackSalesData(document: SwartzDocument): any {
    return {
      comparables: [],
      extractedFields: { source: document.filename },
      confidence: 0.1
    };
  }

  private createFallbackCostData(document: SwartzDocument): any {
    return {
      landValue: 0,
      improvementCost: 0,
      physicalDepreciation: 0,
      functionalObsolescence: 0,
      externalObsolescence: 0,
      extractedFields: { source: document.filename },
      confidence: 0.1
    };
  }

  private createDefaultIncomeData(): IncomeApproachData {
    return {
      grossRentalIncome: 0,
      vacancyRate: 0.05,
      effectiveGrossIncome: 0,
      operatingExpenses: 0,
      netOperatingIncome: 0,
      capRate: 0.075,
      indicatedValue: 0,
      confidence: 0,
      methodology: 'direct_cap'
    };
  }

  private createDefaultSalesData(): SalesCompData {
    return {
      comparables: [],
      indicatedValue: 0,
      confidence: 0
    };
  }

  private createDefaultCostData(): CostApproachDataParsed {
    return {
      landValue: 0,
      improvementCost: 0,
      depreciation: { physical: 0, functional: 0, external: 0, total: 0 },
      indicatedValue: 0,
      confidence: 0
    };
  }
}