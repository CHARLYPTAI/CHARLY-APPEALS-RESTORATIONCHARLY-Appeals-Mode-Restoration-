/**
 * CHARLY Platform API Client
 * Type-safe API client with comprehensive error handling and authentication
 */

import { authenticatedRequest } from './auth';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  details?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  timestamp?: string;
  request_id?: string;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginationResponse {
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// Property Types
export interface Property {
  id: string;
  property_id?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  property_type: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed Use' | 'Vacant Land';
  current_assessment: number;
  market_value?: number;
  assessed_value: number;
  proposed_value?: number;
  potential_savings?: number;
  square_footage?: number;
  lot_size?: number;
  year_built?: number;
  status: 'Under Review' | 'Appeal Filed' | 'Won' | 'Lost' | 'Pending';
  flags: string[];
  created_date: string;
  updated_date: string;
}

export interface PropertyCreate {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  property_type: Property['property_type'];
  current_assessment: number;
  square_footage?: number;
  lot_size?: number;
  year_built?: number;
}

// Appeal Types
export interface AppealPacket {
  packet_id: string;
  property_id: string;
  status: 'draft' | 'generated' | 'filed' | 'pending' | 'approved' | 'denied';
  download_url: string;
  file_size?: number;
  pages?: number;
  generated_at: string;
}

export interface AppealRequest {
  property_id: string;
  appeal_type?: 'standard' | 'expedited' | 'complex';
  narrative_type?: string;
  custom_parameters?: Record<string, any>;
}

// Filing Types
export interface FilingPacket {
  id: string;
  property_address: string;
  county: string;
  status: 'Awaiting Signature' | 'Ready to File' | 'Filed' | 'Rejected';
  download_url: string;
  deadline?: string;
  filed_date?: string;
}

// Valuation Types
export interface ValuationRequest {
  property_id: string;
  approach: 'income' | 'sales' | 'cost';
  parameters?: Record<string, any>;
}

export interface ValuationResult {
  property_id: string;
  approach: 'income' | 'sales' | 'cost';
  estimated_value: number;
  confidence_score: number;
  methodology: string;
  comparable_properties: any[];
  calculated_at: string;
}

// ===========================================
// API CLIENT CLASS
// ===========================================

export class CharlyAPIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  // ===========================================
  // GENERIC REQUEST HANDLER
  // ===========================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await authenticatedRequest(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Request failed',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        return {
          error: errorData.error || 'Request failed',
          message: errorData.message || `HTTP ${response.status}`,
          details: errorData.details,
          request_id: response.headers.get('x-request-id') || undefined,
        };
      }

      // Parse successful response
      const data = await response.json();
      return { data };

    } catch (error) {
      console.error('API Request failed:', error);
      return {
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  // ===========================================
  // PORTFOLIO API
  // ===========================================

  async getProperties(params?: PaginationParams): Promise<ApiResponse<Property[]>> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `/api/portfolio/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<Property[]>(endpoint);
  }

  async getProperty(propertyId: string): Promise<ApiResponse<Property>> {
    return this.request<Property>(`/api/portfolio/properties/${propertyId}`);
  }

  async createProperty(property: PropertyCreate): Promise<ApiResponse<Property>> {
    return this.request<Property>('/api/portfolio/properties', {
      method: 'POST',
      body: JSON.stringify(property),
    });
  }

  async updateProperty(propertyId: string, updates: Partial<Property>): Promise<ApiResponse<Property>> {
    return this.request<Property>(`/api/portfolio/properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProperty(propertyId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/portfolio/properties/${propertyId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================
  // VALUATION API
  // ===========================================

  async getValuation(propertyId: string): Promise<ApiResponse<ValuationResult>> {
    return this.request<ValuationResult>(`/api/portfolio/valuation/${propertyId}`);
  }

  async requestValuation(request: ValuationRequest): Promise<ApiResponse<ValuationResult>> {
    return this.request<ValuationResult>('/api/portfolio/valuation', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async saveDraft(propertyId: string, data: any): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/portfolio/valuation/${propertyId}/draft`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async finalizeValuation(propertyId: string, data: any): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/portfolio/valuation/${propertyId}/finalize`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===========================================
  // APPEALS API
  // ===========================================

  async getAppeals(params?: PaginationParams): Promise<ApiResponse<AppealPacket[]>> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `/api/appeals/packets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<AppealPacket[]>(endpoint);
  }

  async generateAppeal(request: AppealRequest): Promise<ApiResponse<AppealPacket>> {
    return this.request<AppealPacket>('/api/appeals/generate-packet', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateSimpleAppeal(propertyId: string): Promise<ApiResponse<AppealPacket>> {
    return this.request<AppealPacket>('/api/appeals/generate-packet-simple', {
      method: 'POST',
      body: JSON.stringify({ property_id: propertyId }),
    });
  }

  async getAppealStatus(packetId: string): Promise<ApiResponse<AppealPacket>> {
    return this.request<AppealPacket>(`/api/appeals/packet-status/${packetId}`);
  }

  async downloadAppeal(packetId: string): Promise<Response> {
    return authenticatedRequest(`/api/appeals/download/${packetId}`);
  }

  // ===========================================
  // FILING API
  // ===========================================

  async getFilingPackets(): Promise<ApiResponse<{ packets: FilingPacket[] }>> {
    return this.request<{ packets: FilingPacket[] }>('/api/filing/packets');
  }

  async fileAppeal(appealData: Record<string, any>): Promise<ApiResponse<void>> {
    return this.request<void>('/api/filing/file-appeal', {
      method: 'POST',
      body: JSON.stringify(appealData),
    });
  }

  async uploadSignedDocument(packetId: string, file: File): Promise<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('packet_id', packetId);

    try {
      const response = await authenticatedRequest('/api/filing/upload-signed-doc', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Upload failed',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        return { error: errorData.error, message: errorData.message };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // ===========================================
  // HEALTH & SYSTEM API
  // ===========================================

  async getHealth(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/health');
  }

  async getVersion(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/version');
  }

  // ===========================================
  // SETTINGS API
  // ===========================================

  async getSettings(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/settings');
  }

  async updateSettings(settings: Record<string, any>): Promise<ApiResponse<any>> {
    return this.request<any>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ===========================================
  // KPI API
  // ===========================================

  async getKPIs(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/kpis');
  }

  // ===========================================
  // BULK OPERATIONS
  // ===========================================

  async bulkGenerateAppeals(propertyIds: string[]): Promise<ApiResponse<any>> {
    return this.request<any>('/api/appeals/bulk-generate', {
      method: 'POST',
      body: JSON.stringify({ property_ids: propertyIds }),
    });
  }

  async bulkFileAppeals(appeals: Record<string, any>[]): Promise<ApiResponse<void>> {
    return this.request<void>('/api/filing/bulk-file-appeals', {
      method: 'POST',
      body: JSON.stringify({ appeals }),
    });
  }
}

// ===========================================
// SINGLETON INSTANCE
// ===========================================

export const apiClient = new CharlyAPIClient();

// ===========================================
// CONVENIENCE HOOKS
// ===========================================

export const useApiCall = <T>(
  apiCall: () => Promise<ApiResponse<T>>
) => {
  return async (): Promise<T | null> => {
    const response = await apiCall();
    
    if (response.error) {
      console.error('API Error:', response.error, response.message);
      throw new Error(response.message || response.error);
    }
    
    return response.data || null;
  };
};

// ===========================================
// ERROR HANDLING UTILITIES
// ===========================================

export const handleApiError = (response: ApiResponse): string => {
  if (response.details && response.details.length > 0) {
    return response.details.map(d => d.message).join(', ');
  }
  return response.message || response.error || 'An unknown error occurred';
};

export const isApiError = (response: ApiResponse): boolean => {
  return !!response.error;
};

export default apiClient;