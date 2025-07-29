// LOC_CATEGORY: tests
import { faker } from '@faker-js/faker';

// User mock data
export const mockUsers = {
  admin: {
    username: 'admin',
    role: 'Admin',
    email: 'admin@charly.com',
    dashboard_layout: {
      layout: [
        { i: 'overview', x: 0, y: 0, w: 12, h: 4 },
        { i: 'properties', x: 0, y: 4, w: 8, h: 8 },
        { i: 'jurisdiction', x: 8, y: 4, w: 4, h: 8 },
      ],
    },
  },
  analyst: {
    username: 'analyst',
    role: 'Analyst',
    email: 'analyst@charly.com',
  },
};

// Property mock data
export const mockProperties = [
  {
    account_number: '123456789',
    property_address: '123 Main Street, Dallas, TX 75201',
    current_assessed_value: 500000,
    market_value: 525000,
    property_type: 'Commercial',
    jurisdiction: 'Dallas County, TX',
    flag_status: 'Over-assessed',
    appeal_potential: 'High',
    owner_name: 'John Doe',
    building_area: 5000,
    lot_size: 10000,
    year_built: 2010,
    gross_income: 60000,
    operating_expenses: 20000,
    net_operating_income: 40000,
    cap_rate: 8.0,
    tax_amount: 12500,
  },
  {
    account_number: '987654321',
    property_address: '456 Oak Avenue, Dallas, TX 75202',
    current_assessed_value: 750000,
    market_value: 800000,
    property_type: 'Retail',
    jurisdiction: 'Dallas County, TX',
    flag_status: 'Fair',
    appeal_potential: 'Low',
    owner_name: 'Jane Smith',
    building_area: 8000,
    lot_size: 15000,
    year_built: 2015,
    gross_income: 96000,
    operating_expenses: 36000,
    net_operating_income: 60000,
    cap_rate: 7.5,
    tax_amount: 18750,
  },
];

// Generate random property data
export const generateMockProperty = () => ({
  account_number: faker.string.numeric(9),
  parcel_id: faker.string.alphanumeric(10).toUpperCase(),
  property_address: faker.location.streetAddress({ useFullAddress: true }),
  owner_name: faker.person.fullName(),
  mailing_address: faker.location.streetAddress({ useFullAddress: true }),
  current_assessed_value: faker.number.int({ min: 100000, max: 5000000 }),
  prior_assessed_value: faker.number.int({ min: 100000, max: 5000000 }),
  market_value: faker.number.int({ min: 100000, max: 5000000 }),
  appraised_value: faker.number.int({ min: 100000, max: 5000000 }),
  improvement_value: faker.number.int({ min: 50000, max: 3000000 }),
  land_value: faker.number.int({ min: 50000, max: 2000000 }),
  property_type: faker.helpers.arrayElement([
    'Commercial',
    'Residential',
    'Industrial',
    'Retail',
    'Office',
    'Mixed Use',
  ]),
  building_area: faker.number.int({ min: 1000, max: 50000 }),
  lot_size: faker.number.int({ min: 2000, max: 100000 }),
  year_built: faker.number.int({ min: 1900, max: 2024 }),
  stories: faker.number.int({ min: 1, max: 50 }),
  units: faker.number.int({ min: 1, max: 200 }),
  condition: faker.helpers.arrayElement(['Excellent', 'Good', 'Average', 'Fair', 'Poor']),
  construction_type: faker.helpers.arrayElement(['Frame', 'Masonry', 'Steel', 'Concrete', 'Mixed']),
  parking_spaces: faker.number.int({ min: 0, max: 500 }),
  gross_income: faker.number.int({ min: 0, max: 1000000 }),
  operating_expenses: faker.number.int({ min: 0, max: 500000 }),
  net_operating_income: faker.number.int({ min: 0, max: 500000 }),
  cap_rate: faker.number.float({ min: 4, max: 12, precision: 0.1 }),
  expense_ratio: faker.number.float({ min: 20, max: 60, precision: 0.1 }),
  vacancy_rate: faker.number.float({ min: 0, max: 30, precision: 0.1 }),
  rental_rate_sqft: faker.number.float({ min: 10, max: 100, precision: 0.01 }),
  price_per_sqft: faker.number.float({ min: 50, max: 1000, precision: 0.01 }),
  tax_amount: faker.number.int({ min: 1000, max: 100000 }),
  tax_rate: faker.number.float({ min: 1, max: 5, precision: 0.001 }),
  exemptions: faker.helpers.arrayElement(['Homestead', 'Senior', 'Veteran', 'None']),
  assessment_ratio: faker.number.float({ min: 50, max: 100, precision: 0.1 }),
  special_assessments: faker.number.int({ min: 0, max: 10000 }),
  city: faker.location.city(),
  county: faker.location.county(),
  state: faker.location.state({ abbreviated: true }),
  zip_code: faker.location.zipCode(),
  latitude: faker.location.latitude(),
  longitude: faker.location.longitude(),
  census_tract: faker.string.numeric(6),
  school_district: faker.company.name() + ' ISD',
  zoning: faker.helpers.arrayElement(['R-1', 'R-2', 'C-1', 'C-2', 'I-1', 'MU-1']),
  neighborhood: faker.location.street(),
  prior_appeals: faker.helpers.arrayElement(['None', '1', '2', '3', '4+']),
  last_appeal_year: faker.number.int({ min: 2018, max: 2023 }),
  appeal_outcome: faker.helpers.arrayElement([
    'Not Applicable',
    'Successful',
    'Partial Success',
    'Unsuccessful',
  ]),
  appeal_value_change: faker.number.int({ min: -100000, max: 0 }),
  flag_status: faker.helpers.arrayElement(['Over-assessed', 'Fair', 'Under-assessed']),
  appeal_potential: faker.helpers.arrayElement(['High', 'Medium', 'Low', 'None']),
});

// Bulk generate properties
export const generateMockProperties = (count: number) =>
  Array.from({ length: count }, () => generateMockProperty());

// Jurisdiction mock data
export const mockJurisdictions = {
  dallas_county_tx: {
    name: 'Dallas County, TX',
    state: 'Texas',
    assessment_cycle: 'Annual',
    appeal_deadline: 'May 15',
    cap_rate_floor: 8.0,
    residential_exemption: 25000,
    commercial_exemption: 0,
    rules: {
      max_assessment_increase: 10,
      protest_period_days: 30,
      evidence_requirements: ['Recent appraisal', 'Comparable sales', 'Income statements'],
    },
  },
  los_angeles_ca: {
    name: 'Los Angeles County, CA',
    state: 'California',
    assessment_cycle: 'Proposition 13',
    appeal_deadline: 'September 15',
    cap_rate_floor: 6.0,
    residential_exemption: 7000,
    commercial_exemption: 0,
    rules: {
      max_assessment_increase: 2,
      protest_period_days: 60,
      evidence_requirements: [
        'Professional appraisal',
        'Market analysis',
        'Property condition report',
      ],
    },
  },
};

// Narrative mock data
export const mockNarratives = [
  {
    id: '1',
    property_address: '123 Main Street, Dallas, TX',
    account_number: '123456789',
    narrative_type: 'Commercial Appeal',
    content: `Based on comprehensive market analysis and comparable property valuations, the subject property at 123 Main Street appears to be over-assessed relative to current market conditions. The property's current assessed value of $500,000 significantly exceeds the market value of similar properties in the immediate vicinity.

Key factors supporting this appeal include:
1. Recent comparable sales averaging 15% below the subject's assessed value
2. Declining rental rates in the commercial corridor
3. Increased vacancy rates affecting property income
4. Deferred maintenance issues impacting property value

We respectfully request a reassessment to align with current market conditions.`,
    created_date: '2024-06-11',
    status: 'Final',
    word_count: 95,
  },
  {
    id: '2',
    property_address: '456 Oak Avenue, Dallas, TX',
    account_number: '987654321',
    narrative_type: 'Residential Appeal',
    content: `The residential property located at 456 Oak Avenue demonstrates significant assessment discrepancies when compared to similar properties in the immediate area. Current market analysis indicates the property is over-assessed by approximately 20%.

Supporting evidence:
- Three comparable sales within 0.5 miles show lower per-square-foot valuations
- Property condition assessment reveals necessary repairs
- Neighborhood market trends show declining values

We request an adjustment to reflect fair market value.`,
    created_date: '2024-06-10',
    status: 'Draft',
    word_count: 73,
  },
];

// File upload mock data
export const mockUploadResults = [
  {
    success: true,
    records_processed: 150,
    flagged_properties: 45,
    file_type: 'spreadsheet',
    message: 'File processed successfully',
    timestamp: new Date().toISOString(),
  },
  {
    success: true,
    records_processed: 89,
    flagged_properties: 23,
    file_type: 'csv',
    message: 'CSV import completed',
    timestamp: new Date().toISOString(),
  },
];

// Analytics mock data
export const mockAnalyticsData = {
  totalProperties: 15420,
  overAssessed: 4126,
  appealPotential: 8450,
  successRate: 78.5,
  avgReduction: 125000,
  totalSavings: 45600000,
  jurisdictionPerformance: [
    { jurisdiction: 'Dallas County, TX', properties: 5420, flagged: 1245, success_rate: 82.1 },
    { jurisdiction: 'Los Angeles County, CA', properties: 8200, flagged: 2150, success_rate: 75.8 },
    { jurisdiction: 'Cook County, IL', properties: 1800, flagged: 731, success_rate: 79.3 },
  ],
  propertyTypeAnalysis: [
    { type: 'Commercial', count: 6250, avg_assessment: 875000, over_assessed: 1820 },
    { type: 'Residential', count: 7890, avg_assessment: 285000, over_assessed: 1950 },
    { type: 'Industrial', count: 980, avg_assessment: 1200000, over_assessed: 245 },
    { type: 'Retail', count: 300, avg_assessment: 650000, over_assessed: 111 },
  ],
};

// Canonical fields mock data
export const mockCanonicalFields = {
  property_identification: {
    title: 'Property Identification',
    fields: {
      account_number: { type: 'text', label: 'Account Number', required: true },
      parcel_id: { type: 'text', label: 'Parcel ID' },
      property_address: { type: 'text', label: 'Property Address', required: true },
      owner_name: { type: 'text', label: 'Owner Name' },
      mailing_address: { type: 'textarea', label: 'Mailing Address' },
    },
  },
  assessment_values: {
    title: 'Assessment Values',
    fields: {
      current_assessed_value: { type: 'currency', label: 'Current Assessed Value', required: true },
      prior_assessed_value: { type: 'currency', label: 'Prior Assessed Value' },
      market_value: { type: 'currency', label: 'Market Value' },
      appraised_value: { type: 'currency', label: 'Appraised Value' },
      improvement_value: { type: 'currency', label: 'Improvement Value' },
      land_value: { type: 'currency', label: 'Land Value' },
    },
  },
};

// JWT tokens
export const mockTokens = {
  valid:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.K_2n-Y3z4XgBQZ0QdjEb5LZpGZvHHUmgIZGZ9UmFJ3I',
  expired:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTAwMDAwMDAwMH0.expired',
  invalid: 'invalid.token.here',
};

// Error messages
export const mockErrorMessages = {
  auth: {
    invalidCredentials: 'Invalid username or password',
    tokenExpired: 'Your session has expired. Please login again.',
    unauthorized: 'You are not authorized to access this resource',
  },
  api: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    notFound: 'The requested resource was not found',
  },
  validation: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    minLength: 'Must be at least {min} characters',
    maxLength: 'Must be no more than {max} characters',
  },
};
