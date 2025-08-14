export type BackendClass =
  | 'Commercial'
  | 'Residential'
  | 'Industrial'
  | 'Mixed Use'
  | 'Agricultural'
  | 'Special Purpose';

export interface PropertyTypeMap {
  label: string;              // UI label as shown in dropdown
  backendClass: BackendClass; // Value to submit to API
  iaaoCategory?: string;      // Optional: "Commercial – Retail/Food Service", etc.
  synonyms?: string[];        // Optional additional phrases mapping here
}

export const PROPERTY_TYPE_CROSSWALK: PropertyTypeMap[] = [
  // Commercial - Office
  { label: 'Class A Office Building', backendClass: 'Commercial', iaaoCategory: 'Commercial – Office Class A' },
  { label: 'Class B Office Building', backendClass: 'Commercial', iaaoCategory: 'Commercial – Office Class B' },
  { label: 'Class C Office Building', backendClass: 'Commercial', iaaoCategory: 'Commercial – Office Class C' },
  { label: 'Medical Office Building', backendClass: 'Commercial', iaaoCategory: 'Commercial – Medical Office' },
  { label: 'Government Office Building', backendClass: 'Commercial', iaaoCategory: 'Commercial – Government Office' },
  
  // Commercial - Retail
  { label: 'Shopping Center', backendClass: 'Commercial', iaaoCategory: 'Commercial – Retail Shopping Center' },
  { label: 'Strip Center', backendClass: 'Commercial', iaaoCategory: 'Commercial – Retail Strip Center' },
  { label: 'Standalone Retail', backendClass: 'Commercial', iaaoCategory: 'Commercial – Retail' },
  { label: 'Big Box Store', backendClass: 'Commercial', iaaoCategory: 'Commercial – Retail Big Box' },
  { label: 'Department Store', backendClass: 'Commercial', iaaoCategory: 'Commercial – Retail Department Store' },
  
  // Commercial - Hospitality (Hotels)
  { label: 'Full-Service Hotel', backendClass: 'Commercial', iaaoCategory: 'Commercial – Hospitality' },
  { label: 'Limited-Service Hotel', backendClass: 'Commercial', iaaoCategory: 'Commercial – Hospitality' },
  { label: 'Extended Stay Hotel', backendClass: 'Commercial', iaaoCategory: 'Commercial – Hospitality' },
  { label: 'Resort Property', backendClass: 'Commercial', iaaoCategory: 'Commercial – Hospitality' },
  
  // Additional Commercial - Food Service (mentioned in requirements but not in current dropdown)
  { label: 'Restaurant / Bar', backendClass: 'Commercial', iaaoCategory: 'Commercial – Food Service' },
  { label: 'Restaurant', backendClass: 'Commercial', iaaoCategory: 'Commercial – Food Service' },
  { label: 'Bar', backendClass: 'Commercial', iaaoCategory: 'Commercial – Food Service' },
  
  // Industrial
  { label: 'Warehouse/Distribution', backendClass: 'Industrial', iaaoCategory: 'Industrial – Warehouse' },
  { label: 'Manufacturing Facility', backendClass: 'Industrial', iaaoCategory: 'Industrial – Manufacturing' },
  { label: 'Flex/R&D Space', backendClass: 'Industrial', iaaoCategory: 'Industrial – Flex Space' },
  { label: 'Cold Storage Facility', backendClass: 'Industrial', iaaoCategory: 'Industrial – Cold Storage' },
  { label: 'Data Center', backendClass: 'Industrial', iaaoCategory: 'Industrial – Data Center' },
  
  // Mixed Use
  { label: 'Residential/Commercial Mixed Use', backendClass: 'Mixed Use', iaaoCategory: 'Mixed Use' },
  { label: 'Office/Retail Mixed Use', backendClass: 'Mixed Use', iaaoCategory: 'Mixed Use' },
  { label: 'Mixed-Use (Resi over Retail)', backendClass: 'Mixed Use', iaaoCategory: 'Mixed Use' },
  
  // Residential - Multifamily (Income-Producing)
  { label: 'Garden Apartments', backendClass: 'Residential', iaaoCategory: 'Residential – Multi Family' },
  { label: 'Mid-Rise Apartments', backendClass: 'Residential', iaaoCategory: 'Residential – Multi Family' },
  { label: 'High-Rise Apartments', backendClass: 'Residential', iaaoCategory: 'Residential – Multi Family' },
  { label: 'Student Housing', backendClass: 'Residential', iaaoCategory: 'Residential – Multi Family' },
  { label: 'Senior Housing', backendClass: 'Residential', iaaoCategory: 'Residential – Multi Family' },
  { label: 'Affordable Housing', backendClass: 'Residential', iaaoCategory: 'Residential – Multi Family' },
  { label: 'Multi-Family (Apartments)', backendClass: 'Residential', iaaoCategory: 'Residential – Multi Family' },
  
  // Residential - Single Family
  { label: 'Single Family Home', backendClass: 'Residential', iaaoCategory: 'Residential – Single Family' },
  { label: 'Single-Family Residential', backendClass: 'Residential', iaaoCategory: 'Residential – Single Family' },
  { label: 'Condominium', backendClass: 'Residential', iaaoCategory: 'Residential – Single Family' },
  { label: 'Townhome', backendClass: 'Residential', iaaoCategory: 'Residential – Single Family' },
  { label: 'Mobile Home', backendClass: 'Residential', iaaoCategory: 'Residential – Single Family' },
  
  // Special Purpose (Land and Institutional)
  { label: 'Commercial Land', backendClass: 'Special Purpose', iaaoCategory: 'Special Purpose – Land' },
  { label: 'Residential Land', backendClass: 'Special Purpose', iaaoCategory: 'Special Purpose – Land' },
  { label: 'Industrial Land', backendClass: 'Special Purpose', iaaoCategory: 'Special Purpose – Land' },
  { label: 'School / Church', backendClass: 'Special Purpose', iaaoCategory: 'Special Purpose – Institutional' },
  
  // Additional examples from requirements template
  { label: 'Office', backendClass: 'Commercial', iaaoCategory: 'Commercial – Office' },
  { label: 'Hotel / Hospitality', backendClass: 'Commercial', iaaoCategory: 'Commercial – Hospitality' },
  { label: 'Warehouse / Distribution', backendClass: 'Industrial', iaaoCategory: 'Industrial – Warehouse' }
];

// Safe fallback mapper, in case new labels appear before crosswalk is updated
export function mapPropertyTypeLabelToBackend(label?: string): BackendClass {
  if (!label) return 'Commercial';
  
  // First try exact match
  const exact = PROPERTY_TYPE_CROSSWALK.find(x => x.label === label);
  if (exact) return exact.backendClass;
  
  // Fallback to keyword-based mapping
  const v = label.toLowerCase();
  if (v.includes('mixed')) return 'Mixed Use';
  if (v.includes('resid') || v.includes('apartment') || v.includes('condo') || v.includes('single') || v.includes('multi'))
    return 'Residential';
  if (v.includes('industrial') || v.includes('warehouse') || v.includes('manufact'))
    return 'Industrial';
  if (v.includes('agri') || v.includes('farm') || v.includes('ranch'))
    return 'Agricultural';
  if (v.includes('special') || v.includes('church') || v.includes('school') || v.includes('hospital') || v.includes('theater') || v.includes('stadium') || v.includes('civic') || v.includes('land'))
    return 'Special Purpose';
  
  // Default to Commercial
  return 'Commercial';
}