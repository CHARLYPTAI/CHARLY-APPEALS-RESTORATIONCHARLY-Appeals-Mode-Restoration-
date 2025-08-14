export interface RentRollMetadata {
  uploadId: string;
  extractionDate: string;
  reportDate?: string;
  totalUnits?: number;
  occupiedUnits?: number;
  totalGrossRent?: number;
  units: RentRollUnit[];
}

export interface RentRollUnit {
  unitNumber: string;
  status: UnitStatus;
  tenantName?: string;
  leaseStart?: string;
  leaseEnd?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  squareFootage?: number;
  rentPerSqft?: number;
}

export type UnitStatus = 'occupied' | 'vacant' | 'notice' | 'maintenance';