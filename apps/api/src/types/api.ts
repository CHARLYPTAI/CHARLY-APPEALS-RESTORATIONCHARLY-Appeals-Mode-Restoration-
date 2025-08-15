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

export interface CommercialProperty {
  property_address: string;
  assessed_value?: number;
  market_value?: number;
  jurisdiction?: string;
  tax_year?: number;
  property_data?: Record<string, any>;
}

export interface ResidentialProperty {
  property_address: string;
  assessed_value?: number;
  market_value?: number;
  jurisdiction?: string;
  tax_year?: number;
  homestead_exemption?: boolean;
  square_footage?: number;
  lot_size?: number;
  year_built?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: 'single_family' | 'condo' | 'townhome' | 'duplex' | 'other';
  garage_spaces?: number;
  property_data?: Record<string, any>;
}

export interface CommercialValidationRequest {
  property: CommercialProperty;
  rent_roll_ref?: string;
  income_stmt_ref?: string;
}

export interface ResidentialValidationRequest {
  property: ResidentialProperty;
  comp_refs?: string[];
  neighborhood_analysis?: boolean;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
}