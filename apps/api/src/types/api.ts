export interface UploadResponse {
  upload_id: string;
  signed_urls: string[];
  pipeline: {
    av: 'pending' | 'processing' | 'completed' | 'failed';
    exif: 'pending' | 'processing' | 'completed' | 'failed';
    ocr: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

export interface ValidationResponse {
  workfile_id: string;
  normalized: unknown;
  errors: string[];
  decision_preview?: {
    label: 'OVER' | 'FAIR' | 'UNDER';
    confidence: number;
    savings_estimate: number;
  };
}

export interface CommercialValidationRequest {
  property: unknown;
  rent_roll_ref?: string;
  income_stmt_ref?: string;
}

export interface ResidentialValidationRequest {
  property: unknown;
  comp_refs?: string[];
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
}