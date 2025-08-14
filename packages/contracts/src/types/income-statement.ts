export interface IncomeStatementMetadata {
  uploadId: string;
  extractionDate: string;
  periodStart: string;
  periodEnd: string;
  revenue?: Revenue;
  expenses?: Expenses;
  netOperatingIncome?: number;
}

export interface Revenue {
  rentalIncome?: number;
  parkingIncome?: number;
  laundryIncome?: number;
  otherIncome?: number;
  totalRevenue?: number;
}

export interface Expenses {
  propertyManagement?: number;
  utilities?: number;
  maintenance?: number;
  insurance?: number;
  propertyTaxes?: number;
  advertising?: number;
  legal?: number;
  otherExpenses?: number;
  totalExpenses?: number;
}