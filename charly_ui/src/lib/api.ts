// API Response Types
export interface KPIResponse {
  value?: string;
  count?: number;
}

export interface PropertyResponse {
  id: string;
  address: string;
  market_value: number;
  assessed_value: number;
  flags?: string[];
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface UploadResponse {
  success: boolean;
  properties: PropertyResponse[];
  message?: string;
  errors?: string[];
}

// Import authentication utilities
import { authenticatedRequest } from './auth';

// Typed API Functions
export async function uploadFiles(files: FileList): Promise<PropertyResponse[]> {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  try {
    const res = await authenticatedRequest("/api/ingest", {
      method: "POST",
      body: formData,
      headers: {
        // Remove Content-Type to let browser set boundary for multipart/form-data
      },
    });

    if (!res.ok) {
      const errorData: ApiError = await res.json();
      throw new Error(errorData.message || `Server returned ${res.status}`);
    }
    
    const result: PropertyResponse[] = await res.json();
    return result;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

export async function fetchKPIs(): Promise<Record<string, KPIResponse>> {
  try {
    const res = await authenticatedRequest("/api/kpis", {
      method: "GET",
    });

    if (!res.ok) {
      const errorData: ApiError = await res.json();
      throw new Error(errorData.message || `Server returned ${res.status}`);
    }

    const result: Record<string, KPIResponse> = await res.json();
    return result;
  } catch (error) {
    console.error("KPI fetch failed:", error);
    throw error;
  }
}

export async function fetchPropertyData(propertyId: string): Promise<PropertyResponse> {
  try {
    const res = await authenticatedRequest(`/api/properties/${propertyId}`, {
      method: "GET",
    });

    if (!res.ok) {
      const errorData: ApiError = await res.json();
      throw new Error(errorData.message || `Server returned ${res.status}`);
    }

    const result: PropertyResponse = await res.json();
    return result;
  } catch (error) {
    console.error(`Property fetch failed for ID ${propertyId}:`, error);
    throw error;
  }
}

// Rate limiting and retry logic
export class ApiClient {
  private requestQueue: Promise<Response>[] = [];
  private maxConcurrentRequests = 5;
  private retryAttempts = 3;
  private retryDelay = 1000;

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.executeWithRetry(async () => {
      // Rate limiting
      if (this.requestQueue.length >= this.maxConcurrentRequests) {
        await Promise.race(this.requestQueue);
      }

      const requestPromise = authenticatedRequest(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      this.requestQueue.push(requestPromise);

      try {
        const response = await requestPromise;
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        return await response.json();
      } finally {
        // Remove from queue
        const index = this.requestQueue.indexOf(requestPromise);
        if (index > -1) {
          this.requestQueue.splice(index, 1);
        }
      }
    });
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors
        if (error instanceof Error && error.message.includes('Authentication')) {
          throw error;
        }

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1))
          );
        }
      }
    }

    throw lastError!;
  }
}

// Global API client instance
export const apiClient = new ApiClient();