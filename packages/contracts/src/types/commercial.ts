export interface CommercialPropertyCore {
  propertyId: string;
  address: Address;
  propertyType: PropertyType;
  assessedValue: number;
  marketValue?: number;
  taxRate: number;
  currentTaxes?: number;
  assessmentDate?: string;
  ownershipInfo: OwnershipInfo;
  financials?: PropertyFinancials;
  jurisdiction?: Jurisdiction;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
}

export type PropertyType = 
  | 'office' 
  | 'retail' 
  | 'industrial' 
  | 'multifamily' 
  | 'mixed_use' 
  | 'land' 
  | 'other';

export interface OwnershipInfo {
  ownerName: string;
  ownerType: OwnerType;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type OwnerType = 
  | 'individual' 
  | 'corporation' 
  | 'llc' 
  | 'partnership' 
  | 'trust' 
  | 'other';

export interface PropertyFinancials {
  grossRentalIncome?: number;
  operatingExpenses?: number;
  vacancyRate?: number;
  capRate?: number;
}

export interface Jurisdiction {
  jurisdictionId: string;
  name: string;
  state: string;
  appealDeadline?: string;
  appealFee?: number;
  efileAvailable?: boolean;
}