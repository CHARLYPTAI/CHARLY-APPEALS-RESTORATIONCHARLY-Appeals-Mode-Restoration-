// Mock implementation of @charly/contracts for testing

export interface CommercialPropertyCore {
  id: string;
  address: string;
  propertyType: string;
  totalSquareFootage: number;
  yearBuilt: number;
  lotSize?: number;
  grossIncome?: number;
  netIncome?: number;
  expenses?: number;
  assessedValue: number;
  marketValue?: number;
  jurisdiction: string;
  taxYear: number;
  zoning?: string;
  condition?: string;
}

export interface ResidentialPropertyCore {
  id: string;
  address: string;
  totalSquareFootage: number;
  yearBuilt: number;
  lotSize?: number;
  bedrooms: number;
  bathrooms: number;
  homesteadExemption: boolean;
  assessedValue: number;
  marketValue?: number;
  jurisdiction: string;
  taxYear: number;
}

export interface AppealPacket {
  id: string;
  propertyId: string;
  submissionDate: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied';
  filingDeadline: string;
  evidence: Evidence[];
  narrative: string;
  recommendedValue: number;
}

export interface Evidence {
  id: string;
  type: 'photo' | 'document' | 'comparable' | 'inspection';
  title: string;
  description?: string;
  url: string;
  uploadDate: string;
}