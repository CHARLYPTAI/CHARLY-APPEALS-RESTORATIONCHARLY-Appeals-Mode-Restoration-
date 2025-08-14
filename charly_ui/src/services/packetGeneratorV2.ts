/**
 * CHARLY 2.0 Tax Appeal Packet Generator Service
 * Enterprise-grade PDF generation with comprehensive appeal documentation
 */

import { Property } from '../types/property';

export interface NarrativeSection {
  id: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
}

export interface ComparableProperty {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  pricePerSqFt: number;
  buildingSize: number;
  yearBuilt: number;
  similarity: number; // 0-1 score
  adjustments: Array<{
    factor: string;
    amount: number;
    reason: string;
  }>;
}

export interface PacketExhibit {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'document' | 'spreadsheet' | 'photo' | 'map';
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  url?: string;
  thumbnailUrl?: string;
}

export interface AppealAnalyst {
  name: string;
  title: string;
  license?: string;
  phone?: string;
  email?: string;
  signature?: string; // Base64 image
}

export interface PacketConfiguration {
  includeExecutiveSummary: boolean;
  includePropertyDetails: boolean;
  includeFinancialAnalysis: boolean;
  includeComparableAnalysis: boolean;
  includeIncomeApproach: boolean;
  includeCostApproach: boolean;
  includeMarketApproach: boolean;
  includeExhibits: boolean;
  includeCountyForms: boolean;
  includeSignaturePage: boolean;
  customSections: NarrativeSection[];
}

export interface TaxAppealPacket {
  id: string;
  property: Property;
  narrative: NarrativeSection[];
  comparables: ComparableProperty[];
  exhibits: PacketExhibit[];
  analyst: AppealAnalyst;
  configuration: PacketConfiguration;
  generatedDate: Date;
  status: 'draft' | 'review' | 'final' | 'submitted';
  
  // Financial calculations
  currentAssessment: number;
  proposedAssessment: number;
  potentialSavings: number;
  taxRate: number;
  
  // Market analysis
  marketValue: number;
  costValue?: number;
  incomeValue?: number;
  finalValue: number;
  
  // Supporting data
  marketData?: {
    averageCapRate: number;
    averageExpenseRatio: number;
    vacancyRate: number;
    marketTrends: string;
  };
}

class PacketGeneratorServiceV2 {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api/v2') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Generate AI-powered narrative sections for the appeal
   */
  async generateNarrative(property: Property, sections: string[]): Promise<NarrativeSection[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/generate-narrative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property,
          requestedSections: sections,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate narrative: ${response.statusText}`);
      }

      const data = await response.json();
      return data.narrative;
    } catch (error) {
      console.error('Error generating narrative:', error);
      
      // Fallback to default narrative sections
      return this.generateDefaultNarrative(property, sections);
    }
  }

  /**
   * Find and analyze comparable properties
   */
  async findComparables(property: Property, radius: number = 2): Promise<ComparableProperty[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/comparables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property,
          radius,
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to find comparables: ${response.statusText}`);
      }

      const data = await response.json();
      return data.comparables;
    } catch (error) {
      console.error('Error finding comparables:', error);
      return [];
    }
  }

  /**
   * Create a comprehensive tax appeal packet
   */
  async createPacket(
    property: Property,
    configuration: Partial<PacketConfiguration> = {}
  ): Promise<TaxAppealPacket> {
    const packetId = `packet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultConfig: PacketConfiguration = {
      includeExecutiveSummary: true,
      includePropertyDetails: true,
      includeFinancialAnalysis: true,
      includeComparableAnalysis: true,
      includeIncomeApproach: true,
      includeCostApproach: false,
      includeMarketApproach: true,
      includeExhibits: true,
      includeCountyForms: true,
      includeSignaturePage: true,
      customSections: [],
      ...configuration,
    };

    // Generate narrative sections
    const narrativeSections = await this.generateNarrative(property, [
      'executive-summary',
      'property-overview',
      'market-analysis',
      'valuation-conclusion',
    ]);

    // Find comparable properties
    const comparables = configuration.includeComparableAnalysis 
      ? await this.findComparables(property)
      : [];

    // Calculate financial metrics
    const financialAnalysis = this.calculateFinancialMetrics(property, comparables);

    const packet: TaxAppealPacket = {
      id: packetId,
      property,
      narrative: narrativeSections,
      comparables,
      exhibits: [], // Will be populated by user uploads
      analyst: {
        name: 'CHARLY AI Assistant',
        title: 'Automated Analysis System',
      },
      configuration: defaultConfig,
      generatedDate: new Date(),
      status: 'draft',
      ...financialAnalysis,
    };

    return packet;
  }

  /**
   * Generate PDF from packet data
   */
  async generatePDF(packet: TaxAppealPacket): Promise<Blob> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packet),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Upload exhibit files
   */
  async uploadExhibit(file: File, description: string): Promise<PacketExhibit> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    try {
      const response = await fetch(`${this.apiBaseUrl}/upload-exhibit`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload exhibit: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading exhibit:', error);
      throw error;
    }
  }

  /**
   * Save packet for later editing
   */
  async savePacket(packet: TaxAppealPacket): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/packets/${packet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packet),
      });

      if (!response.ok) {
        throw new Error(`Failed to save packet: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving packet:', error);
      throw error;
    }
  }

  /**
   * Load existing packet
   */
  async loadPacket(packetId: string): Promise<TaxAppealPacket> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/packets/${packetId}`);

      if (!response.ok) {
        throw new Error(`Failed to load packet: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading packet:', error);
      throw error;
    }
  }

  /**
   * Generate default narrative sections when AI is unavailable
   */
  private generateDefaultNarrative(property: Property, sections: string[]): NarrativeSection[] {
    const narratives: NarrativeSection[] = [];

    if (sections.includes('executive-summary')) {
      narratives.push({
        id: 'executive-summary',
        title: 'Executive Summary',
        content: `This property tax appeal is submitted for the property located at ${property.address}. Based on our comprehensive analysis, the current assessment of $${property.assessedValue?.toLocaleString()} exceeds the property's fair market value. We respectfully request an adjustment to $${property.marketValue?.toLocaleString()}, which represents the property's true market value based on current market conditions and comparable sales data.`,
        order: 1,
        required: true,
      });
    }

    if (sections.includes('property-overview')) {
      narratives.push({
        id: 'property-overview',
        title: 'Property Overview',
        content: `The subject property is a ${property.propertyType?.toLowerCase()} built in ${property.yearBuilt} with ${property.buildingSize?.toLocaleString()} square feet of building area on ${property.landSize?.toLocaleString()} square feet of land. The property generates annual rental income of approximately $${property.grossRent?.toLocaleString()} with net operating income of $${property.noi?.toLocaleString()}.`,
        order: 2,
        required: true,
      });
    }

    if (sections.includes('market-analysis')) {
      narratives.push({
        id: 'market-analysis',
        title: 'Market Analysis',
        content: `Our market analysis reveals that similar properties in the area are selling at an average of $${((property.marketValue || 0) / (property.buildingSize || 1)).toFixed(2)} per square foot. The current market exhibits a capitalization rate of approximately ${(property.capRate * 100).toFixed(2)}%, which supports our valuation conclusion. Market conditions and comparable sales data indicate that the current assessment is above market levels.`,
        order: 3,
        required: true,
      });
    }

    if (sections.includes('valuation-conclusion')) {
      narratives.push({
        id: 'valuation-conclusion',
        title: 'Valuation Conclusion',
        content: `Based on the income approach to value, comparable sales analysis, and current market conditions, we conclude that the fair market value of the subject property is $${property.marketValue?.toLocaleString()}. This represents a more accurate reflection of the property's value and its income-generating capacity in the current market environment.`,
        order: 4,
        required: true,
      });
    }

    return narratives;
  }

  /**
   * Calculate financial metrics for the appeal
   */
  private calculateFinancialMetrics(property: Property, comparables: ComparableProperty[]) {
    const currentAssessment = property.assessedValue || 0;
    const proposedAssessment = property.marketValue || 0;
    const taxRate = 0.02; // 2% default tax rate

    const potentialSavings = (currentAssessment - proposedAssessment) * taxRate;

    const averageCapRate = comparables.length > 0
      ? comparables.reduce((sum, comp) => sum + (comp.salePrice / (comp.buildingSize * 100)), 0) / comparables.length
      : property.capRate || 0.075;

    return {
      currentAssessment,
      proposedAssessment,
      potentialSavings,
      taxRate,
      marketValue: proposedAssessment,
      finalValue: proposedAssessment,
      marketData: {
        averageCapRate,
        averageExpenseRatio: 0.35,
        vacancyRate: 0.05,
        marketTrends: 'Stable market conditions with moderate growth expected.',
      },
    };
  }
}

export const packetGeneratorService = new PacketGeneratorServiceV2();
export default PacketGeneratorServiceV2;