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

// Typed API Functions
export async function uploadFiles(files: FileList): Promise<PropertyResponse[]> {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  try {
    const res = await fetch("/api/ingest", {
      method: "POST",
      body: formData,
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
    const res = await fetch("/api/kpis", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
    const res = await fetch(`/api/properties/${propertyId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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