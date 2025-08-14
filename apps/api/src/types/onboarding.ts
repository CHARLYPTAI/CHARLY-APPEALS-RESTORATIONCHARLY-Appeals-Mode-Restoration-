export interface CustomerRegistrationRequest {
  organization: {
    name: string;
    type: 'property_management' | 'commercial_real_estate' | 'law_firm' | 'other';
    size: 'small' | 'medium' | 'large' | 'enterprise';
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    phone: string;
    website?: string;
  };
  primary_contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    title: string;
  };
  billing_contact?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    title: string;
  };
  jurisdictions: string[];
  expected_monthly_appeals: number;
  integration_preferences: {
    api_access: boolean;
    webhook_url?: string;
    sso_required: boolean;
    white_label: boolean;
  };
}

export interface CustomerRegistrationResponse {
  customer_id: string;
  organization_id: string;
  api_key: string;
  onboarding_status: 'pending' | 'in_progress' | 'completed';
  next_steps: {
    step: string;
    description: string;
    deadline?: string;
  }[];
}

export interface OnboardingStepRequest {
  customer_id: string;
  step_type: 'sample_data_upload' | 'jurisdiction_verification' | 'api_integration_test' | 'final_review';
  data?: unknown;
}

export interface OnboardingStepResponse {
  step_id: string;
  status: 'pending' | 'completed' | 'failed';
  result?: unknown;
  errors?: string[];
  next_step?: string;
}

export interface OnboardingStatusResponse {
  customer_id: string;
  organization_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: {
    current_step: number;
    total_steps: number;
    completion_percentage: number;
  };
  steps: {
    step_name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    completed_at?: string;
    errors?: string[];
  }[];
  kpis: {
    time_from_registration: number;
    sample_packets_generated: number;
    integration_test_success: boolean;
  };
}

export interface KPITrackingData {
  customer_id: string;
  event_type: 'registration' | 'first_upload' | 'first_packet' | 'integration_complete';
  timestamp: string;
  metadata?: {
    appeal_packet_success?: boolean;
    time_to_first_packet?: number;
    data_entry_reduction?: number;
  };
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
}